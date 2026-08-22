from typing import List, Optional
from pydantic import BaseModel, Field
from app.schemas.result import AssessmentResultResponse

class AdminDashboardMetrics(BaseModel):
    total_students: int = Field(..., ge=0)
    total_assessments: int = Field(..., ge=0)
    total_questions: int = Field(..., ge=0)
    total_submissions: int = Field(..., ge=0)
    recent_results: List[AssessmentResultResponse] = Field(default_factory=list)

class StudentDashboardMetrics(BaseModel):
    total_assessments: int = Field(..., ge=0)
    completed_assessments: int = Field(..., ge=0)
    total_earned_marks: int = Field(..., ge=0)
    total_maximum_marks: int = Field(..., ge=0)
    recent_results: List[AssessmentResultResponse] = Field(default_factory=list)
