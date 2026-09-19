from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum

class DifficultyLevel(Enum):
    BEGINNER = 1
    ELEMENTARY = 2
    INTERMEDIATE = 3
    ADVANCED = 4
    EXPERT = 5

class InteractionType(Enum):
    QUIZ_ATTEMPT = "quiz_attempt"
    VIDEO_WATCH = "video_watch"
    VIDEO_REWATCH = "video_rewatch"
    PAUSE = "pause"
    SEEK = "seek"
    NOTE_TAKEN = "note_taken"
    EXERCISE_ATTEMPT = "exercise_attempt"
    TIME_SPENT = "time_spent"

@dataclass
class Topic:
    id: str
    name: str
    description: str
    difficulty: DifficultyLevel
    prerequisites: List[str] = field(default_factory=list)
    estimated_duration_minutes: int = 30
    tags: List[str] = field(default_factory=list)
    mastery_threshold: float = 0.7

@dataclass
class LearningItem:
    id: str
    topic_id: str
    title: str
    content_type: str  # video, quiz, exercise, reading
    duration_minutes: int
    difficulty: DifficultyLevel
    order: int = 0

@dataclass
class InteractionEvent:
    learner_id: str
    item_id: str
    interaction_type: InteractionType
    timestamp: datetime
    value: float  # 0-1 for scores, seconds for time
    metadata: Dict = field(default_factory=dict)

@dataclass
class LearnerState:
    learner_id: str
    topic_mastery: Dict[str, float] = field(default_factory=dict)
    engagement_score: float = 0.5
    current_streak: int = 0
    total_time_spent_minutes: int = 0
    last_activity: Optional[datetime] = None
    weak_areas: List[str] = field(default_factory=list)
    strong_areas: List[str] = field(default_factory=list)
    difficulty_preference: DifficultyLevel = DifficultyLevel.INTERMEDIATE
    interaction_history: List[InteractionEvent] = field(default_factory=list)

@dataclass
class Recommendation:
    item: LearningItem
    score: float  # 0-1 recommendation confidence
    reason: str
    difficulty_adjustment: float = 0.0

@dataclass
class EvaluationMetrics:
    completion_rate: float
    mastery_achievement: float
    engagement_score: float
    time_efficiency: float
    difficulty_appropriateness: float
    retention_rate: float