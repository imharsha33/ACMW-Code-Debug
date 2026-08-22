from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.question import QuestionStatus

class QuestionResultResponse(BaseModel):
    question_id: str
    question_title: str
    earned_marks: int = Field(..., ge=0)
    maximum_marks: int = Field(..., ge=0)
    attempts_used: int = Field(..., ge=0)
    status: QuestionStatus

class AssessmentResultResponse(BaseModel):
    attempt_id: str
    assessment_id: str
    assessment_title: str
    student_id: str
    student_name: str
    student_email: str
    total_earned_marks: int = Field(..., ge=0, description="Total score earned across questions")
    total_maximum_marks: int = Field(..., ge=0, description="Total score possible across questions")
    percentage: float = Field(..., ge=0.0, le=100.0)
    finalized: bool
    started_at: Optional[int] = None
    submitted_at: Optional[int] = None
    tab_switch_count: int = 0
    question_results: List[QuestionResultResponse] = Field(default_factory=list)
