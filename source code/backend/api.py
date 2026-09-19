from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
import uvicorn
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.models import (
    Topic, LearningItem, InteractionEvent, LearnerState,
    DifficultyLevel, InteractionType
)
from backend.knowledge_graph import KnowledgeGraph, create_sample_knowledge_graph
from backend.learner_model import LearnerModel
from backend.recommendation_engine import RecommendationEngine
from backend.evaluation import EvaluationSystem

app = FastAPI(title="AdaptiveFlow API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    LearningItem("item_015", "error_handling", "Error Handling Quiz", "quiz", 15, DifficultyLevel.INTERMEDIATE, 2),
    LearningItem("item_016", "file_io", "Reading & Writing Files", "video", 30, DifficultyLevel.INTERMEDIATE, 1),
    LearningItem("item_017", "modules", "Importing Modules", "video", 20, DifficultyLevel.ADVANCED, 1),
    LearningItem("item_018", "modules", "Modules Practice", "exercise", 25, DifficultyLevel.ADVANCED, 2),
    LearningItem("item_019", "decorators", "Function Decorators", "video", 35, DifficultyLevel.ADVANCED, 1),
    LearningItem("item_020", "decorators", "Decorators Quiz", "quiz", 15, DifficultyLevel.ADVANCED, 2),
]

for item in learning_items:
    engine.add_learning_item(item)

learner_id = "learner_001"
from datetime import timedelta
import random

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
    (InteractionType.QUIZ_ATTEMPT, "item_015", 0.55, {"topic_id": "error_handling"}),
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


@app.get("/")
async def root():
    return {"message": "AdaptiveFlow API", "version": "1.0.0"}


@app.get("/api/v1/learners/{lid}/state")
async def get_learner_state(lid: str):
    state = learner_model.get_or_create_learner(lid)
    return {
        "learner_id": lid,
        "topic_mastery": state.topic_mastery,
        "engagement_score": state.engagement_score,
        "current_streak": state.current_streak,
        "total_time_spent_minutes": state.total_time_spent_minutes,
        "weak_areas": state.weak_areas,
        "strong_areas": state.strong_areas,
        "difficulty_preference": state.difficulty_preference.value,
        "last_activity": state.last_activity.isoformat() if state.last_activity else None,
    }


@app.post("/api/v1/learners/{lid}/events")
async def log_event(lid: str, event: InteractionEvent):
    event.learner_id = lid
    if not event.timestamp:
        event.timestamp = datetime.now()
    learner_model.update_learner_state(event)
    return {"status": "recorded", "learner_id": lid}


@app.get("/api/v1/learners/{lid}/recommendations")
async def get_recommendations(lid: str, count: int = 5):
    recs = engine.get_recommendations(lid, count)
    return [
        {
            "item_id": r.item.id,
            "topic_id": r.item.topic_id,
            "title": r.item.title,
            "content_type": r.item.content_type,
            "score": round(r.score, 2),
            "reason": r.reason,
            "difficulty_adjustment": r.difficulty_adjustment,
            "duration": r.item.duration_minutes,
        }
        for r in recs
    ]


@app.get("/api/v1/learners/{lid}/path/{target_topic}")
async def get_personalized_path(lid: str, target_topic: str):
    path = engine.get_personalized_path(lid, target_topic)
    return {
        "target_topic": target_topic,
        "path": [
            {
                "item_id": item.id,
                "title": item.title,
                "content_type": item.content_type,
                "duration": item.duration_minutes,
                "order": item.order,
                "topic_id": item.topic_id,
            }
            for item in path
        ],
        "estimated_total_minutes": sum(item.duration_minutes for item in path),
    }


@app.get("/api/v1/learners/{lid}/metrics")
async def get_metrics(lid: str):
    metrics = evaluation.evaluate_recommendation_strategy(lid)
    return {
        "completion_rate": round(metrics.completion_rate, 2),
        "mastery_achievement": round(metrics.mastery_achievement, 2),
        "engagement_score": round(metrics.engagement_score, 2),
        "time_efficiency": round(metrics.time_efficiency, 2),
        "difficulty_appropriateness": round(metrics.difficulty_appropriateness, 2),
        "retention_rate": round(metrics.retention_rate, 2),
    }


@app.get("/api/v1/learners/{lid}/analytics")
async def get_analytics(lid: str):
    analytics = learner_model.get_learner_analytics(lid)
    return analytics


@app.get("/api/v1/learners/{lid}/activity")
async def get_activity(lid: str):
    state = learner_model.get_or_create_learner(lid)
    recent = sorted(state.interaction_history, key=lambda e: e.timestamp, reverse=True)[:10]
    return [
        {
            "time": e.timestamp.isoformat(),
            "type": e.interaction_type.value,
            "item_id": e.item_id,
            "value": e.value,
            "topic_id": e.metadata.get("topic_id", ""),
        }
        for e in recent
    ]


@app.post("/api/v1/learners/{lid}/outcomes")
async def log_outcome(lid: str, item_id: str, completed: bool, score: float = 0.0):
    evaluation.log_outcome(lid, item_id, completed, score)
    return {"status": "recorded"}


@app.get("/api/v1/topics")
async def get_topics():
    return [
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "difficulty": t.difficulty.value,
            "prerequisites": t.prerequisites,
            "estimated_duration_minutes": t.estimated_duration_minutes,
            "tags": t.tags,
        }
        for t in kg.topics.values()
    ]


@app.get("/api/v1/topics/{topic_id}")
async def get_topic(topic_id: str):
    if topic_id not in kg.topics:
        raise HTTPException(status_code=404, detail="Topic not found")
    t = kg.topics[topic_id]
    return {
        "id": t.id,
        "name": t.name,
        "description": t.description,
        "difficulty": t.difficulty.value,
        "prerequisites": t.prerequisites,
        "estimated_duration_minutes": t.estimated_duration_minutes,
        "tags": t.tags,
    }


@app.get("/api/v1/topics/{topic_id}/prerequisites")
async def get_prerequisites(topic_id: str):
    prereqs = kg.get_prerequisites(topic_id)
    return {"topic_id": topic_id, "prerequisites": prereqs}


@app.get("/api/v1/topics/{topic_id}/dependents")
async def get_dependents(topic_id: str):
    dependents = kg.get_dependents(topic_id)
    return {"topic_id": topic_id, "dependents": dependents}


@app.get("/api/v1/topics/path")
async def get_topic_path(from_topic: str, to_topic: str):
    path = kg.get_learning_path(from_topic, to_topic)
    return {"from": from_topic, "to": to_topic, "path": path}


@app.get("/api/v1/items")
async def get_items():
    return [
        {
            "id": item.id,
            "topic_id": item.topic_id,
            "title": item.title,
            "content_type": item.content_type,
            "duration_minutes": item.duration_minutes,
            "difficulty": item.difficulty.value,
            "order": item.order,
        }
        for item in engine.learning_items.values()
    ]


@app.get("/api/v1/items/{item_id}")
async def get_item(item_id: str):
    if item_id not in engine.learning_items:
        raise HTTPException(status_code=404, detail="Item not found")
    item = engine.learning_items[item_id]
    return {
        "id": item.id,
        "topic_id": item.topic_id,
        "title": item.title,
        "content_type": item.content_type,
        "duration_minutes": item.duration_minutes,
        "difficulty": item.difficulty.value,
        "order": item.order,
    }


@app.get("/api/v1/graph")
async def get_knowledge_graph():
    return {
        "topics": [
            {
                "id": t.id,
                "name": t.name,
                "difficulty": t.difficulty.value,
                "prerequisites": t.prerequisites,
            }
            for t in kg.topics.values()
        ],
        "stats": kg.get_topic_stats(),
    }


@app.get("/api/v1/evaluation/{lid}")
async def get_evaluation(lid: str):
    report = evaluation.get_evaluation_report(lid)
    return report


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)