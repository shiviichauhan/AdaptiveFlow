from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import math
from .models import (
    LearnerState, InteractionEvent, InteractionType, 
    Topic, DifficultyLevel
)

class LearnerModel:
    def __init__(self):
        self.learner_states: Dict[str, LearnerState] = {}
        self.mastery_decay_rate = 0.95
        self.engagement_weights = {
            InteractionType.QUIZ_ATTEMPT: 0.3,
            InteractionType.VIDEO_WATCH: 0.2,
            InteractionType.VIDEO_REWATCH: 0.15,
            InteractionType.EXERCISE_ATTEMPT: 0.25,
            InteractionType.NOTE_TAKEN: 0.1,
        }
    
    def get_or_create_learner(self, learner_id: str) -> LearnerState:
        if learner_id not in self.learner_states:
            self.learner_states[learner_id] = LearnerState(
                learner_id=learner_id,
                last_activity=datetime.now()
            )
        return self.learner_states[learner_id]
    
    def update_learner_state(self, event: InteractionEvent) -> LearnerState:
        state = self.get_or_create_learner(event.learner_id)
        state.interaction_history.append(event)
        state.last_activity = event.timestamp
        
        if event.interaction_type == InteractionType.QUIZ_ATTEMPT:
            self._update_mastery_from_quiz(state, event)
        elif event.interaction_type == InteractionType.VIDEO_WATCH:
            self._update_engagement_from_watch(state, event)
        elif event.interaction_type == InteractionType.VIDEO_REWATCH:
            self._update_from_rewatch(state, event)
        elif event.interaction_type == InteractionType.TIME_SPENT:
            self._update_time_spent(state, event)
        
        self._calculate_engagement_score(state)
        self._identify_weak_strong_areas(state)
        
        return state
    
    def _update_mastery_from_quiz(self, state: LearnerState, event: InteractionEvent):
        topic_id = event.metadata.get("topic_id")
        if not topic_id:
            return
        
        current_mastery = state.topic_mastery.get(topic_id, 0.0)
        quiz_score = event.value
        
        updated_mastery = 0.7 * current_mastery + 0.3 * quiz_score
        state.topic_mastery[topic_id] = min(1.0, updated_mastery)
    
    def _update_engagement_from_watch(self, state: LearnerState, event: InteractionEvent):
        watch_duration = event.value
        expected_duration = event.metadata.get("expected_duration", 1)
        
        watch_ratio = min(watch_duration / expected_duration, 1.5)
        
        if watch_ratio >= 0.8:
            state.current_streak += 1
        elif watch_ratio < 0.3:
            state.current_streak = 0
    
    def _update_from_rewatch(self, state: LearnerState, event: InteractionEvent):
        topic_id = event.metadata.get("topic_id")
        if topic_id:
            current_mastery = state.topic_mastery.get(topic_id, 0.0)
            boost = 0.05 * (event.value / 60)
            state.topic_mastery[topic_id] = min(1.0, current_mastery + boost)
    
    def _update_time_spent(self, state: LearnerState, event: InteractionEvent):
        state.total_time_spent_minutes += int(event.value / 60)
    
    def _calculate_engagement_score(self, state: LearnerState):
        if not state.interaction_history:
            state.engagement_score = 0.5
            return
        
        recent_events = [
            e for e in state.interaction_history
            if (datetime.now() - e.timestamp).days <= 7
        ]
        
        if not recent_events:
            days_inactive = (datetime.now() - state.last_activity).days if state.last_activity else 7
            decay = math.exp(-0.1 * days_inactive)
            state.engagement_score *= decay
            return
        
        engagement = 0.0
        total_weight = 0.0
        
        for event in recent_events:
            weight = self.engagement_weights.get(event.interaction_type, 0.1)
            engagement += weight * event.value
            total_weight += weight
        
        if total_weight > 0:
            engagement /= total_weight
        
        streak_bonus = min(state.current_streak * 0.05, 0.3)
        state.engagement_score = min(1.0, engagement + streak_bonus)
    
    def _identify_weak_strong_areas(self, state: LearnerState):
        weak_threshold = 0.4
        strong_threshold = 0.7
        
        state.weak_areas = [
            topic_id for topic_id, mastery in state.topic_mastery.items()
            if mastery < weak_threshold
        ]
        
        state.strong_areas = [
            topic_id for topic_id, mastery in state.topic_mastery.items()
            if mastery >= strong_threshold
        ]
    
    def get_readiness_score(self, learner_id: str, topic_id: str, prerequisites: List[str]) -> float:
        state = self.get_or_create_learner(learner_id)
        
        if not prerequisites:
            return 1.0
        
        prereq_masteries = [
            state.topic_mastery.get(prereq, 0.0) for prereq in prerequisites
        ]
        
        return sum(prereq_masteries) / len(prereq_masteries)
    
    def suggest_difficulty_adjustment(self, learner_id: str) -> float:
        state = self.get_or_create_learner(learner_id)
        
        if not state.topic_mastery:
            return 0.0
        
        avg_mastery = sum(state.topic_mastery.values()) / len(state.topic_mastery)
        
        if avg_mastery > 0.8:
            return 0.2
        elif avg_mastery > 0.6:
            return 0.0
        elif avg_mastery > 0.4:
            return -0.1
        else:
            return -0.2
    
    def get_learning_velocity(self, learner_id: str) -> float:
        state = self.get_or_create_learner(learner_id)
        
        recent_quizzes = [
            e for e in state.interaction_history
            if e.interaction_type == InteractionType.QUIZ_ATTEMPT
            and (datetime.now() - e.timestamp).days <= 14
        ]
        
        if len(recent_quizzes) < 2:
            return 0.5
        
        scores = [e.value for e in recent_quizzes]
        
        if len(scores) >= 2:
            improvement = (scores[-1] - scores[0]) / len(scores)
            return min(1.0, max(0.0, 0.5 + improvement))
        
        return 0.5
    
    def predict_mastery_timeline(self, learner_id: str, topic_id: str, 
                                  target_mastery: float = 0.8) -> int:
        state = self.get_or_create_learner(learner_id)
        current_mastery = state.topic_mastery.get(topic_id, 0.0)
        
        if current_mastery >= target_mastery:
            return 0
        
        velocity = self.get_learning_velocity(learner_id)
        mastery_gap = target_mastery - current_mastery
        
        estimated_sessions = mastery_gap / (velocity * 0.1)
        
        return max(1, int(estimated_sessions))
    
    def get_learner_analytics(self, learner_id: str) -> Dict:
        state = self.get_or_create_learner(learner_id)
        
        return {
            "learner_id": learner_id,
            "overall_mastery": (
                sum(state.topic_mastery.values()) / len(state.topic_mastery)
                if state.topic_mastery else 0.0
            ),
            "engagement_score": state.engagement_score,
            "total_time_hours": state.total_time_spent_minutes / 60,
            "topics_mastered": len(state.strong_areas),
            "topics_weak": len(state.weak_areas),
            "current_streak": state.current_streak,
            "learning_velocity": self.get_learning_velocity(learner_id),
            "difficulty_preference": state.difficulty_preference.value
        }