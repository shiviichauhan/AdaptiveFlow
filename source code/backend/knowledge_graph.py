from typing import Dict, List, Set, Tuple
from collections import deque
from .models import Topic, DifficultyLevel

class KnowledgeGraph:
    def __init__(self):
        self.topics: Dict[str, Topic] = {}
        self.adjacency_list: Dict[str, List[str]] = {}  # prerequisite -> dependent
        self.reverse_adjacency: Dict[str, List[str]] = {}  # dependent -> prerequisite
    
    def add_topic(self, topic: Topic):
        self.topics[topic.id] = topic
        if topic.id not in self.adjacency_list:
            self.adjacency_list[topic.id] = []
        if topic.id not in self.reverse_adjacency:
            self.reverse_adjacency[topic.id] = []
        
        for prereq in topic.prerequisites:
            if prereq not in self.adjacency_list:
                self.adjacency_list[prereq] = []
            self.adjacency_list[prereq].append(topic.id)
            
            if topic.id not in self.reverse_adjacency:
                self.reverse_adjacency[topic.id] = []
            self.reverse_adjacency[topic.id].append(prereq)
    
    def get_prerequisites(self, topic_id: str) -> List[str]:
        return self.reverse_adjacency.get(topic_id, [])
    
    def get_dependents(self, topic_id: str) -> List[str]:
        return self.adjacency_list.get(topic_id, [])
    
    def get_all_prerequisites(self, topic_id: str) -> Set[str]:
        visited = set()
        queue = deque([topic_id])
        prerequisites = set()
        
        while queue:
            current = queue.popleft()
            for prereq in self.reverse_adjacency.get(current, []):
                if prereq not in visited:
                    visited.add(prereq)
                    prerequisites.add(prereq)
                    queue.append(prereq)
        
        return prerequisites
    
    def get_learning_path(self, start_topic: str, end_topic: str) -> List[str]:
        if start_topic == end_topic:
            return [start_topic]
        
        queue = deque([[start_topic]])
        visited = {start_topic}
        
        while queue:
            path = queue.popleft()
            current = path[-1]
            
            for neighbor in self.adjacency_list.get(current, []):
                if neighbor == end_topic:
                    return path + [neighbor]
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(path + [neighbor])
        
        return []
    
    def get_topological_order(self) -> List[str]:
        in_degree = {topic: 0 for topic in self.topics}
        
        for topic_id in self.topics:
            for prereq in self.reverse_adjacency.get(topic_id, []):
                in_degree[topic_id] += 1
        
        queue = deque([topic for topic, degree in in_degree.items() if degree == 0])
        result = []
        
        while queue:
            topic = queue.popleft()
            result.append(topic)
            
            for dependent in self.adjacency_list.get(topic, []):
                in_degree[dependent] -= 1
                if in_degree[dependent] == 0:
                    queue.append(dependent)
        
        return result
    
    def get_difficulty_level(self, topic_id: str) -> DifficultyLevel:
        return self.topics[topic_id].difficulty
    
    def get_prerequisite_depth(self, topic_id: str) -> int:
        prerequisites = self.get_all_prerequisites(topic_id)
        if not prerequisites:
            return 0
        
        max_depth = 0
        for prereq in prerequisites:
            depth = self.get_prerequisite_depth(prereq)
            max_depth = max(max_depth, depth)
        
        return max_depth + 1
    
    def validate_prerequisites(self, topic_id: str) -> bool:
        visited = set()
        return self._has_cycle(topic_id, visited)
    
    def _has_cycle(self, topic_id: str, visited: Set[str]) -> bool:
        if topic_id in visited:
            return True
        
        visited.add(topic_id)
        
        for prereq in self.reverse_adjacency.get(topic_id, []):
            if self._has_cycle(prereq, visited.copy()):
                return True
        
        return False
    
    def get_topic_stats(self) -> Dict:
        total_topics = len(self.topics)
        difficulty_distribution = {}
        
        for topic in self.topics.values():
            diff = topic.difficulty.value
            difficulty_distribution[diff] = difficulty_distribution.get(diff, 0) + 1
        
        return {
            "total_topics": total_topics,
            "difficulty_distribution": difficulty_distribution,
            "topics_with_prerequisites": sum(
                1 for t in self.topics.values() if t.prerequisites
            )
        }

def create_sample_knowledge_graph() -> KnowledgeGraph:
    graph = KnowledgeGraph()
    
    topics = [
        Topic("python_basics", "Python Basics", "Introduction to Python programming", 
              DifficultyLevel.BEGINNER, [], 60, ["programming"]),
        Topic("variables", "Variables & Data Types", "Understanding variables and data types",
              DifficultyLevel.BEGINNER, ["python_basics"], 45, ["programming", "fundamentals"]),
        Topic("control_flow", "Control Flow", "If statements, loops, and conditions",
              DifficultyLevel.ELEMENTARY, ["variables"], 50, ["programming", "logic"]),
        Topic("functions", "Functions", "Creating and using functions",
              DifficultyLevel.ELEMENTARY, ["control_flow"], 55, ["programming", "modularity"]),
        Topic("data_structures", "Data Structures", "Lists, dictionaries, sets",
              DifficultyLevel.INTERMEDIATE, ["functions"], 65, ["programming", "data"]),
        Topic("oop", "Object-Oriented Programming", "Classes and objects",
              DifficultyLevel.INTERMEDIATE, ["data_structures"], 70, ["programming", "paradigm"]),
        Topic("error_handling", "Error Handling", "Try-except and debugging",
              DifficultyLevel.INTERMEDIATE, ["functions"], 40, ["programming", "robustness"]),
        Topic("file_io", "File I/O", "Reading and writing files",
              DifficultyLevel.INTERMEDIATE, ["functions"], 45, ["programming", "io"]),
        Topic("modules", "Modules & Packages", "Importing and organizing code",
              DifficultyLevel.ADVANCED, ["oop", "file_io"], 50, ["programming", "architecture"]),
        Topic("decorators", "Decorators", "Advanced function decoration",
              DifficultyLevel.ADVANCED, ["functions"], 55, ["programming", "advanced"]),
        Topic("generators", "Generators", "Lazy evaluation and iterators",
              DifficultyLevel.ADVANCED, ["functions"], 50, ["programming", "advanced"]),
        Topic("async", "Async Programming", "Asynchronous programming patterns",
              DifficultyLevel.EXPERT, ["generators"], 60, ["programming", "concurrency"]),
    ]
    
    for topic in topics:
        graph.add_topic(topic)
    
    return graph