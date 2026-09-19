from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import math
from .models import (
    LearnerState, InteractionEvent, Recommendation,
    EvaluationMetrics, InteractionType
)
from .knowledge_graph import KnowledgeGraph
from .learner_model import LearnerModel

class EvaluationSystem:
    def __init__(self, knowledge_graph: KnowledgeGraph, learner_model: LearnerModel):
        self.kg = knowledge_graph
        self.learner_model = learner_model
        self.recommendation_log: List[Dict] = []
        self.outcome_log: List[Dict] = []
    
    def log_recommendation(self, learner_id: str, recommendations: List[Recommendation], 
                          timestamp: datetime = None):
        self.recommendation_log.append({
            "learner_id": learner_id,
            "recommendations": [r.item.id for r in recommendations],
            "scores": [r.score for r in recommendations],
            "timestamp": timestamp or datetime.now()
        })
    
    def log_outcome(self, learner_id: str, item_id: str, completed: bool, 
                   score: Optional[float] = None, timestamp: datetime = None):
        self.outcome_log.append({
            "learner_id": learner_id,
            "item_id": item_id,
            "completed": completed,
            "score": score,
            "timestamp": timestamp or datetime.now()
        })
    
    def calculate_completion_rate(self, learner_id: str, 
                                  time_window_days: int = 30) -> float:
        cutoff = datetime.now() - timedelta(days=time_window_days)
        
        recommendations = [
            r for r in self.recommendation_log
            if r["learner_id"] == learner_id and r["timestamp"] >= cutoff
        ]
        
        if not recommendations:
            return 0.0
        
        total_recommended = sum(len(r["recommendations"]) for r in recommendations)
        
        completed_items = set()
        for outcome in self.outcome_log:
            if (outcome["learner_id"] == learner_id and 
                outcome["completed"] and 
                outcome["timestamp"] >= cutoff):
                completed_items.add(outcome["item_id"])
        
        completed_count = 0
        for rec in recommendations:
            for item_id in rec["recommendations"]:
                if item_id in completed_items:
                    completed_count += 1
        
        return completed_count / total_recommended if total_recommended > 0 else 0.0
    
    def calculate_mastery_achievement(self, learner_id: str) -> float:
        state = self.learner_model.get_or_create_learner(learner_id)
        
        if not state.topic_mastery:
            return 0.0
        
        mastered_count = sum(
            1 for mastery in state.topic_mastery.values()
            if mastery >= 0.7
        )
        
        return mastered_count / len(state.topic_mastery)
    
    def calculate_engagement_score(self, learner_id: str, 
                                   time_window_days: int = 7) -> float:
        state = self.learner_model.get_or_create_learner(learner_id)
        
        cutoff = datetime.now() - timedelta(days=time_window_days)
        recent_interactions = [
            e for e in state.interaction_history
            if e.timestamp >= cutoff
        ]
        
        if not recent_interactions:
            return 0.0
        
        interaction_weights = {
            InteractionType.QUIZ_ATTEMPT: 3,
            InteractionType.EXERCISE_ATTEMPT: 3,
            InteractionType.VIDEO_WATCH: 2,
            InteractionType.VIDEO_REWATCH: 1,
            InteractionType.NOTE_TAKEN: 1,
        }
        
        weighted_sum = sum(
            interaction_weights.get(e.interaction_type, 1) * e.value
            for e in recent_interactions
        )
        
        max_possible = len(recent_interactions) * 3
        
        return min(1.0, weighted_sum / max_possible) if max_possible > 0 else 0.0
    
    def calculate_time_efficiency(self, learner_id: str) -> float:
        state = self.learner_model.get_or_create_learner(learner_id)
        
        if not state.topic_mastery or state.total_time_spent_minutes == 0:
            return 0.0
        
        mastery_per_hour = (
            sum(state.topic_mastery.values()) / 
            (state.total_time_spent_minutes / 60)
        )
        
        return min(1.0, mastery_per_hour)
    
    def calculate_difficulty_appropriateness(self, learner_id: str) -> float:
        state = self.learner_model.get_or_create_learner(learner_id)
        
        quiz_events = [
            e for e in state.interaction_history
            if e.interaction_type == InteractionType.QUIZ_ATTEMPT
        ]
        
        if not quiz_events:
            return 0.5
        
        appropriate_count = 0
        for event in quiz_events:
            score = event.value
            if 0.4 <= score <= 0.8:
                appropriate_count += 1
        
        return appropriate_count / len(quiz_events)
    
    def calculate_retention_rate(self, learner_id: str, 
                                 time_window_days: int = 30) -> float:
        state = self.learner_model.get_or_create_learner(learner_id)
        
        cutoff = datetime.now() - timedelta(days=time_window_days)
        
        topic_first_seen = {}
        for event in state.interaction_history:
            topic = event.metadata.get("topic_id")
            if topic and event.timestamp < cutoff:
                if topic not in topic_first_seen:
                    topic_first_seen[topic] = event.timestamp
        
        if not topic_first_seen:
            return 0.0
        
        retained_count = 0
        for topic, first_seen in topic_first_seen.items():
            days_elapsed = (datetime.now() - first_seen).days
            expected_retention = math.exp(-0.03 * days_elapsed)
            
            current_mastery = state.topic_mastery.get(topic, 0.0)
            
            if current_mastery >= expected_retention * 0.5:
                retained_count += 1
        
        return retained_count / len(topic_first_seen)
    
    def evaluate_recommendation_strategy(self, learner_id: str) -> EvaluationMetrics:
        return EvaluationMetrics(
            completion_rate=self.calculate_completion_rate(learner_id),
            mastery_achievement=self.calculate_mastery_achievement(learner_id),
            engagement_score=self.calculate_engagement_score(learner_id),
            time_efficiency=self.calculate_time_efficiency(learner_id),
            difficulty_appropriateness=self.calculate_difficulty_appropriateness(learner_id),
            retention_rate=self.calculate_retention_rate(learner_id)
        )
    
    def evaluate_all_learners(self) -> Dict[str, EvaluationMetrics]:
        learner_ids = set()
        for rec in self.recommendation_log:
            learner_ids.add(rec["learner_id"])
        for outcome in self.outcome_log:
            learner_ids.add(outcome["learner_id"])
        
        evaluations = {}
        for learner_id in learner_ids:
            evaluations[learner_id] = self.evaluate_recommendation_strategy(learner_id)
        
        return evaluations
    
    def get_aggregate_metrics(self) -> Dict:
        all_evaluations = self.evaluate_all_learners()
        
        if not all_evaluations:
            return {
                "average_completion_rate": 0.0,
                "average_mastery_achievement": 0.0,
                "average_engagement_score": 0.0,
                "average_time_efficiency": 0.0,
                "average_difficulty_appropriateness": 0.0,
                "average_retention_rate": 0.0,
                "total_learners": 0
            }
        
        metrics = [
            "completion_rate", "mastery_achievement", "engagement_score",
            "time_efficiency", "difficulty_appropriateness", "retention_rate"
        ]
        
        averages = {}
        for metric in metrics:
            values = [getattr(e, metric) for e in all_evaluations.values()]
            averages[f"average_{metric}"] = sum(values) / len(values)
        
        averages["total_learners"] = len(all_evaluations)
        
        return averages
    
    def get_recommendation_accuracy(self, learner_id: str) -> float:
        learner_recs = [
            r for r in self.recommendation_log
            if r["learner_id"] == learner_id
        ]
        
        if not learner_recs:
            return 0.0
        
        accurate_count = 0
        total_count = 0
        
        for rec in learner_recs:
            rec_time = rec["timestamp"]
            
            subsequent_outcomes = [
                o for o in self.outcome_log
                if (o["learner_id"] == learner_id and 
                    o["timestamp"] > rec_time and
                    o["timestamp"] <= rec_time + timedelta(days=7))
            ]
            
            for item_id in rec["recommendations"]:
                outcome = next(
                    (o for o in subsequent_outcomes if o["item_id"] == item_id),
                    None
                )
                if outcome and outcome["completed"]:
                    accurate_count += 1
                total_count += 1
        
        return accurate_count / total_count if total_count > 0 else 0.0
    
    def get_evaluation_report(self, learner_id: str = None) -> Dict:
        if learner_id:
            metrics = self.evaluate_recommendation_strategy(learner_id)
            accuracy = self.get_recommendation_accuracy(learner_id)
            
            return {
                "learner_id": learner_id,
                "metrics": {
                    "completion_rate": metrics.completion_rate,
                    "mastery_achievement": metrics.mastery_achievement,
                    "engagement_score": metrics.engagement_score,
                    "time_efficiency": metrics.time_efficiency,
                    "difficulty_appropriateness": metrics.difficulty_appropriateness,
                    "retention_rate": metrics.retention_rate
                },
                "recommendation_accuracy": accuracy,
                "overall_score": (
                    metrics.completion_rate * 0.2 +
                    metrics.mastery_achievement * 0.25 +
                    metrics.engagement_score * 0.2 +
                    metrics.time_efficiency * 0.15 +
                    metrics.retention_rate * 0.2
                )
            }
        else:
            return {
                "aggregate_metrics": self.get_aggregate_metrics(),
                "total_recommendations": len(self.recommendation_log),
                "total_outcomes": len(self.outcome_log)
            }