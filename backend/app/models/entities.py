from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from app.schemas.user import UserRole
from app.schemas.question import QuestionType, Difficulty, Language, TimeLimit, QuestionStatus, McqOptionAdmin, TestCaseAdmin
from app.schemas.assessment import FullscreenMode, TabSwitchingMode, AssessmentStatus

@dataclass
class UserEntity:
    id: str
    email: str
    hashed_password: str
    name: str
    role: UserRole
    is_blocked: bool = False
    tab_switch_count: int = 0
    active_device_id: Optional[str] = None
    test_submitted: bool = False

@dataclass
class QuestionEntity:
    id: str
    title: str
    description: str
    question_type: QuestionType
    difficulty: Difficulty
    max_marks: int
    max_attempts: int
    allowed_languages: List[Language]
    enabled: bool
    run_enabled: bool
    time_limit_hours: int
    time_limit_minutes: int
    time_limit_seconds: int
    problem_statement: Optional[str] = None
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None
    faulty_code: Optional[Dict[str, str]] = None
    incomplete_code: Optional[Dict[str, str]] = None
    starter_code: Optional[Dict[str, str]] = None
    expected_solution: Optional[Dict[str, str]] = None
    error_type: Optional[str] = None
    options: List[Dict[str, Any]] = field(default_factory=list)
    test_cases: List[Dict[str, Any]] = field(default_factory=list)
    created_at: int = 0
    updated_at: int = 0

@dataclass
class AssessmentEntity:
    id: str
    title: str
    description: Optional[str]
    time_limit_hours: int
    time_limit_minutes: int
    time_limit_seconds: int
    overall_submit_threshold: Optional[int]
    fullscreen_mode: FullscreenMode
    tab_switching_mode: TabSwitchingMode
    status: AssessmentStatus
    question_ids: List[str]
    created_at: int = 0
    updated_at: int = 0

@dataclass
class QuestionAttemptProgress:
    question_id: str
    selected_language: Optional[str] = None
    code: Dict[str, str] = field(default_factory=dict)
    selected_option_id: Optional[str] = None
    attempts_used: int = 0
    earned_marks: int = 0
    status: QuestionStatus = QuestionStatus.NOT_STARTED
    question_started_at: Optional[int] = None
    question_expires_at: Optional[int] = None
    submitted_at: Optional[int] = None

@dataclass
class AssessmentAttemptEntity:
    id: str
    assessment_id: str
    student_id: str
    started_at: int
    expires_at: Optional[int]
    submitted_at: Optional[int] = None
    finalized: bool = False
    tab_switch_count: int = 0
    max_tab_switches: int = 3
    terminated_by_violations: bool = False
    question_progress: Dict[str, QuestionAttemptProgress] = field(default_factory=dict)

@dataclass
class EventEntity:
    id: str
    attempt_id: str
    event_type: str
    timestamp: int
    metadata: Dict[str, Any]
