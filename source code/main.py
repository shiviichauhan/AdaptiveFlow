from datetime import datetime, timedelta
import random
from backend.models import (
    Topic, LearningItem, InteractionEvent, DifficultyLevel, InteractionType
)
from backend.knowledge_graph import KnowledgeGraph, create_sample_knowledge_graph
from backend.learner_model import LearnerModel
from backend.recommendation_engine import RecommendationEngine
from backend.evaluation import EvaluationSystem

def main():
    print("=" * 60)
    print("   AdaptiveFlow - Personalized Learning Path System")
    print("=" * 60)
    
    kg = create_sample_knowledge_graph()
    learner_model = LearnerModel()
    engine = RecommendationEngine(kg, learner_model)
    evaluation = EvaluationSystem(kg, learner_model)
    
    learning_items = [
        LearningItem("item_001", "python_basics", "Introduction to Python", "video", 30, DifficultyLevel.BEGINNER, 1),
        LearningItem("item_002", "python_basics", "Python Setup Quiz", "quiz", 10, DifficultyLevel.BEGINNER, 2),
        LearningItem("item_003", "variables", "Understanding Variables", "video", 25, DifficultyLevel.BEGINNER, 1),
        LearningItem("item_004", "variables", "Variables Practice", "exercise", 20, DifficultyLevel.BEGINNER, 2),
        LearningItem("item_005", "control_flow", "If Statements & Loops", "video", 35, DifficultyLevel.ELEMENTARY, 1),
        LearningItem("item_006", "control_flow", "Control Flow Quiz", "quiz", 15, DifficultyLevel.ELEMENTARY, 2),
        LearningItem("item_007", "functions", "Functions Explained", "video", 30, DifficultyLevel.ELEMENTARY, 1),
        LearningItem("item_008", "functions", "Function Practice", "exercise", 25, DifficultyLevel.ELEMENTARY, 2),
        LearningItem("item_009", "data_structures", "Lists & Arrays", "video", 40, DifficultyLevel.INTERMEDIATE, 1),
        LearningItem("item_010", "data_structures", "Dictionary Deep Dive", "video", 35, DifficultyLevel.INTERMEDIATE, 2),
        LearningItem("item_011", "data_structures", "Data Structures Quiz", "quiz", 20, DifficultyLevel.INTERMEDIATE, 3),
        LearningItem("item_012", "oop", "Classes & Objects", "video", 45, DifficultyLevel.INTERMEDIATE, 1),
        LearningItem("item_013", "oop", "OOP Practice", "exercise", 30, DifficultyLevel.INTERMEDIATE, 2),
        LearningItem("item_014", "error_handling", "Try-Except Blocks", "video", 25, DifficultyLevel.INTERMEDIATE, 1),
        LearningItem("item_015", "file_io", "Reading & Writing Files", "video", 30, DifficultyLevel.INTERMEDIATE, 1),
        LearningItem("item_016", "modules", "Importing Modules", "video", 20, DifficultyLevel.ADVANCED, 1),
        LearningItem("item_017", "decorators", "Function Decorators", "video", 35, DifficultyLevel.ADVANCED, 1),
    ]
    
    for item in learning_items:
        engine.add_learning_item(item)
    
    learner_id = "learner_001"
    
    print("\n[1] Simulating Learner Interactions...")
    print("-" * 40)
    
    base_time = datetime.now() - timedelta(days=14)
    
    interactions = [
        (InteractionType.VIDEO_WATCH, "item_001", 1800, {"topic_id": "python_basics"}),
        (InteractionType.QUIZ_ATTEMPT, "item_002", 0.9, {"topic_id": "python_basics"}),
        (InteractionType.VIDEO_WATCH, "item_003", 1500, {"topic_id": "variables"}),
        (InteractionType.QUIZ_ATTEMPT, "item_004", 0.85, {"topic_id": "variables"}),
        (InteractionType.VIDEO_WATCH, "item_005", 2100, {"topic_id": "control_flow"}),
        (InteractionType.VIDEO_REWATCH, "item_005", 1200, {"topic_id": "control_flow"}),
        (InteractionType.QUIZ_ATTEMPT, "item_006", 0.72, {"topic_id": "control_flow"}),
        (InteractionType.VIDEO_WATCH, "item_007", 1800, {"topic_id": "functions"}),
        (InteractionType.QUIZ_ATTEMPT, "item_008", 0.65, {"topic_id": "functions"}),
        (InteractionType.VIDEO_WATCH, "item_009", 2400, {"topic_id": "data_structures"}),
        (InteractionType.VIDEO_REWATCH, "item_009", 1800, {"topic_id": "data_structures"}),
        (InteractionType.QUIZ_ATTEMPT, "item_011", 0.45, {"topic_id": "data_structures"}),
        (InteractionType.VIDEO_WATCH, "item_012", 2700, {"topic_id": "oop"}),
        (InteractionType.QUIZ_ATTEMPT, "item_013", 0.3, {"topic_id": "oop"}),
        (InteractionType.VIDEO_WATCH, "item_014", 1500, {"topic_id": "error_handling"}),
        (InteractionType.QUIZ_ATTEMPT, "item_014", 0.55, {"topic_id": "error_handling"}),
    ]
    
    for i, (int_type, item_id, value, metadata) in enumerate(interactions):
        event = InteractionEvent(
            learner_id=learner_id,
            item_id=item_id,
            interaction_type=int_type,
            timestamp=base_time + timedelta(days=i // 2, hours=random.randint(9, 20)),
            value=value,
            metadata=metadata
        )
        learner_model.update_learner_state(event)
    
    print(f"   Processed {len(interactions)} interactions for {learner_id}")
    
    print("\n[2] Learner State Analysis")
    print("-" * 40)
    
    analytics = learner_model.get_learner_analytics(learner_id)
    print(f"   Overall Mastery: {analytics['overall_mastery']:.1%}")
    print(f"   Engagement Score: {analytics['engagement_score']:.1%}")
    print(f"   Learning Velocity: {analytics['learning_velocity']:.2f}")
    print(f"   Topics Mastered: {analytics['topics_mastered']}")
    print(f"   Weak Areas: {analytics['topics_weak']}")
    print(f"   Current Streak: {analytics['current_streak']} days")
    
    print("\n[3] Generating Recommendations")
    print("-" * 40)
    
    recommendations = engine.get_recommendations(learner_id, num_recommendations=5)
    
    for i, rec in enumerate(recommendations, 1):
        print(f"   {i}. {rec.item.title}")
        print(f"      Topic: {rec.item.topic_id} | Type: {rec.item.content_type}")
        print(f"      Score: {rec.score:.1%} | Reason: {rec.reason}")
        print()
    
    evaluation.log_recommendation(learner_id, recommendations)
    
    print("\n[4] Knowledge Graph Analysis")
    print("-" * 40)
    
    stats = kg.get_topic_stats()
    print(f"   Total Topics: {stats['total_topics']}")
    print(f"   Topics with Prerequisites: {stats['topics_with_prerequisites']}")
    
    topo_order = kg.get_topological_order()
    print(f"   Learning Order: {' -> '.join(topo_order[:5])}...")
    
    path = kg.get_learning_path("python_basics", "decorators")
    print(f"   Path to Decorators: {' -> '.join(path)}")
    
    print("\n[5] Evaluation Metrics")
    print("-" * 40)
    
    metrics = evaluation.evaluate_recommendation_strategy(learner_id)
    print(f"   Completion Rate: {metrics.completion_rate:.1%}")
    print(f"   Mastery Achievement: {metrics.mastery_achievement:.1%}")
    print(f"   Engagement Score: {metrics.engagement_score:.1%}")
    print(f"   Time Efficiency: {metrics.time_efficiency:.2f}")
    print(f"   Difficulty Appropriateness: {metrics.difficulty_appropriateness:.1%}")
    print(f"   Retention Rate: {metrics.retention_rate:.1%}")
    
    print("\n[6] Personalized Path Recommendation")
    print("-" * 40)
    
    target_topic = "oop"
    personal_path = engine.get_personalized_path(learner_id, target_topic)
    
    print(f"   Target: {target_topic}")
    print(f"   Recommended Path:")
    for item in personal_path:
        print(f"     - {item.title} ({item.content_type})")
    
    print("\n[7] Difficulty Adjustment")
    print("-" * 40)
    
    test_item = learning_items[8]
    adjusted = engine.adjust_difficulty_for_item(test_item, learner_id)
    print(f"   Original: {test_item.title} (Level {test_item.difficulty.value})")
    print(f"   Adjusted: {adjusted.title} (Level {adjusted.difficulty.value})")
    
    print("\n" + "=" * 60)
    print("   System Summary")
    print("=" * 60)
    print(f"   [OK] Knowledge Graph: {stats['total_topics']} topics mapped")
    print(f"   [OK] Learner Model: Tracking {len(learner_model.learner_states)} learners")
    print(f"   [OK] Recommendations: {len(recommendations)} items generated")
    print(f"   [OK] Evaluation: All metrics calculated")
    print("\n   Dashboard available at: frontend/index.html")
    print("   LMS Integration Plan: docs/LMS_INTEGRATION_PLAN.md")
    print("=" * 60)

if __name__ == "__main__":
    main()