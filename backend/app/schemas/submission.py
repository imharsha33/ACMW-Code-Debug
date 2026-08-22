from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.question import Language, QuestionStatus

class CodeRunRequest(BaseModel):
    question_id: str
    attempt_id: str
    language: str
    source_code: str = Field(..., description="Student code to execute")
    input: Optional[str] = Field(default="", description="Input to pass to code")

class CodeRunResponse(BaseModel):
    status: str = Field(..., description="Success / Execution Error / Timeout")
    stdout: Optional[str] = ""
    stderr: Optional[str] = ""
    execution_time: Optional[str] = "0.01s"
    error: Optional[str] = None

class QuestionSubmissionRequest(BaseModel):
    language: Optional[str] = None
    code: Optional[str] = None
    selected_option_id: Optional[str] = None
    answer: Optional[str] = None

class QuestionSubmissionResponse(BaseModel):
    attempt_id: str
    question_id: str
    status: QuestionStatus
    earned_marks: int = Field(..., ge=0)
    maximum_marks: int = Field(..., ge=0)
    attempts_used: int = Field(..., ge=1)
    attempts_remaining: int = Field(..., ge=0)
    feedback: Optional[str] = None
