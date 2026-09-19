from typing import List, Dict, Optional, Tuple
from datetime import datetime
from .models import (
    LearnerState, LearningItem, Recommendation, 
    Topic, DifficultyLevel, InteractionType
)
from .knowledge_graph import KnowledgeGraph
from .learner_model import LearnerModel

class RecommendationEngine:
    def __init__(self, knowledge_graph: KnowledgeGraph, learner_model: LearnerModel):
        self.kg = knowledge_graph
        self.learner_model = learner_model
        self.learning_items: Dict[str, LearningItem] = {}
        
        self.weights = {
            "readiness": 0.3,
            "mastery_gap": 0.25,
            "engagement": 0.2,
            "difficulty_match": 0.15,
            "recency": 0.1
        }
    
    def add_learning_item(self, item: LearningItem):
        self.learning_items[item.id] = item
    
    def get_recommendations(self, learner_id: str, num_recommendations: int = 5) -> List[Recommendation]:
        state = self.learner_model.get_or_create_learner(learner_id)
        candidates = self._get_candidate_items(state)
        
        scored_candidates = []
        for item in candidates:
            score, reason, difficulty_adj = self._score_candidate(state, item)
            scored_candidates.append((item, score, reason, difficulty_adj))
        
        scored_candidates.sort(key=lambda x: x[1], reverse=True)
        
        recommendations = []
        for item, score, reason, diff_adj in scored_candidates[:num_recommendations]:
            recommendations.append(Recommendation(
                item=item,
                score=score,
                reason=reason,
                difficulty_adjustment=diff_adj
            ))
        
        return recommendations
    
    def _get_candidate_items(self, state: LearnerState) -> List[LearningItem]:
        candidates = []
        
        for item in self.learning_items.values():
            if self._is_item_accessible(state, item):
                candidates.append(item)
        
        if not candidates:
            candidates = list(self.learning_items.values())
        
        return candidates
    
    def _is_item_accessible(self, state: LearnerState, item: LearningItem) -> bool:
        topic = self.kg.topics.get(item.topic_id)
        if not topic:
            return True
        
        prerequisites = self.kg.get_prerequisites(item.topic_id)
        
        if not prerequisites:
            return True
        
        for prereq in prerequisites:
            mastery = state.topic_mastery.get(prereq, 0.0)
            if mastery < 0.5:
                return False
        
        return True
    
    def _score_candidate(self, state: LearnerState, item: LearningItem) -> Tuple[float, str, float]:
        topic = self.kg.topics.get(item.topic_id)
        if not topic:
            return 0.5, "No topic information", 0.0
        
        readiness_score = self._calculate_readiness_score(state, item)
        mastery_gap_score = self._calculate_mastery_gap_score(state, item)
        engagement_score = self._calculate_engagement_score(state, item)
        difficulty_score = self._calculate_difficulty_score(state, item)
        recency_score = self._calculate_recency_score(state, item)
        
        total_score = (
            self.weights["readiness"] * readiness_score +
            self.weights["mastery_gap"] * mastery_gap_score +
            self.weights["engagement"] * engagement_score +
            self.weights["difficulty_match"] * difficulty_score +
            self.weights["recency"] * recency_score
        )
        
        reason = self._generate_reason(
            readiness_score, mastery_gap_score, engagement_score, 
            difficulty_score, item, state
        )
        
        difficulty_adj = self.learner_model.suggest_difficulty_adjustment(state.learner_id)
        
        return total_score, reason, difficulty_adj
    
    def _calculate_readiness_score(self, state: LearnerState, item: LearningItem) -> float:
        topic = self.kg.topics.get(item.topic_id)
        if not topic:
            return 0.5
        
        prerequisites = self.kg.get_prerequisites(item.topic_id)
        return self.learner_model.get_readiness_score(
            state.learner_id, item.topic_id, prerequisites
        )
    
    def _calculate_mastery_gap_score(self, state: LearnerState, item: LearningItem) -> float:
        current_mastery = state.topic_mastery.get(item.topic_id, 0.0)
        target_mastery = 0.8
        
        gap = target_mastery - current_mastery
        
        if gap <= 0:
            return 0.2
        elif gap >= 0.5:
            return 1.0
        else:
            return gap * 2
    
    def _calculate_engagement_score(self, state: LearnerState, item: LearningItem) -> float:
        base_engagement = state.engagement_score
        
        topic_interactions = [
            e for e in state.interaction_history
            if e.metadata.get("topic_id") == item.topic_id
        ]
        
        if topic_interactions:
            recent_interactions = [
                e for e in topic_interactions
                if (datetime.now() - e.timestamp).days <= 7
            ]
            if recent_interactions:
                return min(1.0, base_engagement + 0.2)
        
        return base_engagement
    
    def _calculate_difficulty_score(self, state: LearnerState, item: LearningItem) -> float:
        current_difficulty = item.difficulty.value
        preferred_difficulty = state.difficulty_preference.value
        
        difficulty_diff = abs(current_difficulty - preferred_difficulty)
        
        if difficulty_diff == 0:
            return 1.0
        elif difficulty_diff == 1:
            return 0.7
        elif difficulty_diff == 2:
            return 0.4
        else:
            return 0.2
    
    def _calculate_recency_score(self, state: LearnerState, item: LearningItem) -> float:
        topic_interactions = [
            e for e in state.interaction_history
            if e.metadata.get("topic_id") == item.topic_id
        ]
        
        if not topic_interactions:
            return 0.8
        
        last_interaction = max(topic_interactions, key=lambda e: e.timestamp)
        days_since = (datetime.now() - last_interaction.timestamp).days
        
        if days_since <= 1:
            return 0.3
        elif days_since <= 7:
            return 0.6
        elif days_since <= 30:
            return 0.8
        else:
            return 1.0
    
    def _generate_reason(self, readiness: float, mastery_gap: float, 
                         engagement: float, difficulty: float,
                         item: LearningItem, state: LearnerState) -> str:
        reasons = []
        
        if readiness > 0.8:
            reasons.append("prerequisites mastered")
        
        if mastery_gap > 0.7:
            current = state.topic_mastery.get(item.topic_id, 0.0)
            reasons.append(f"needs improvement ({current:.0%} mastery)")
        
        if difficulty > 0.8:
            reasons.append("matches your level")
        
        if engagement > 0.7:
            reasons.append("high engagement topic")
        
        if not reasons:
            reasons.append("recommended for progression")
        
        return "; ".join(reasons)
    
    def get_personalized_path(self, learner_id: str, target_topic_id: str) -> List[LearningItem]:
        state = self.learner_model.get_or_create_learner(learner_id)
        
        prerequisites = self.kg.get_all_prerequisites(target_topic_id)
        
        weak_prereqs = [
            p for p in prerequisites
            if state.topic_mastery.get(p, 0.0) < 0.6
        ]
        
        path_items = []
        
        for prereq in weak_prereqs:
            items = [
                item for item in self.learning_items.values()
                if item.topic_id == prereq
            ]
            path_items.extend(sorted(items, key=lambda x: x.order))
        
        target_items = [
            item for item in self.learning_items.values()
            if item.topic_id == target_topic_id
        ]
        path_items.extend(sorted(target_items, key=lambda x: x.order))
        
        return path_items
    
    def adjust_difficulty_for_item(self, item: LearningItem, learner_id: str) -> LearningItem:
        state = self.learner_model.get_or_create_learner(learner_id)
        adjustment = self.learner_model.suggest_difficulty_adjustment(learner_id)
        
        new_difficulty_value = item.difficulty.value + adjustment
        new_difficulty_value = max(1, min(5, new_difficulty_value))
        
        adjusted_item = LearningItem(
            id=item.id,
            topic_id=item.topic_id,
            title=item.title,
            content_type=item.content_type,
            duration_minutes=item.duration_minutes,
            difficulty=DifficultyLevel(int(new_difficulty_value)),
            order=item.order
        )
        
        return adjusted_item
    
    def get_engine_analytics(self) -> Dict:
        return {
            "total_learning_items": len(self.learning_items),
            "total_topics": len(self.kg.topics),
            "weight_configuration": self.weights
        }