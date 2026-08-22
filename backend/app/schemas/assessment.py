from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, model_validator, ConfigDict
from app.schemas.question import TimeLimit


class FullscreenMode(str, Enum):
    DISABLED = "DISABLED"
    OPTIONAL = "OPTIONAL"
    REQUIRED = "REQUIRED"

class TabSwitchingMode(str, Enum):
    DISABLED = "DISABLED"
    WARN = "WARN"
    RESTRICT_FLAG = "RESTRICT_FLAG"

class AssessmentStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"

class AssessmentBase(BaseModel):
    title: str = Field(..., description="Title or name of assessment")
    description: Optional[str] = None
    overall_time_limit: TimeLimit = Field(default_factory=TimeLimit)
    overall_submit_threshold: Optional[int] = Field(
        default=10,
        ge=0,
        description="Threshold minutes before expiration when Overall Submit button appears",
    )
    fullscreen_mode: FullscreenMode = FullscreenMode.REQUIRED
    tab_switching_mode: TabSwitchingMode = TabSwitchingMode.RESTRICT_FLAG
    status: AssessmentStatus = AssessmentStatus.DRAFT
    question_ids: List[str] = Field(default_factory=list, description="Ordered list of question IDs")

    @model_validator(mode="after")
    def validate_submit_threshold(self):
        total_seconds = self.overall_time_limit.to_seconds()
        if self.overall_submit_threshold is not None and total_seconds > 0:
            threshold_seconds = self.overall_submit_threshold * 60
            if threshold_seconds > total_seconds:
                raise ValueError("overall_submit_threshold cannot exceed overall_time_limit")
        return self

class AssessmentCreate(AssessmentBase):
    pass

class AssessmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    overall_time_limit: Optional[TimeLimit] = None
    overall_submit_threshold: Optional[int] = Field(None, ge=0)
    fullscreen_mode: Optional[FullscreenMode] = None
    tab_switching_mode: Optional[TabSwitchingMode] = None
    status: Optional[AssessmentStatus] = None
    question_ids: Optional[List[str]] = None

    @model_validator(mode="after")
    def validate_submit_threshold(self):
        if self.overall_time_limit is not None and self.overall_submit_threshold is not None:
            total_seconds = self.overall_time_limit.to_seconds()
            threshold_seconds = self.overall_submit_threshold * 60
            if threshold_seconds > total_seconds:
                raise ValueError("overall_submit_threshold cannot exceed overall_time_limit")
        return self

class AssessmentResponse(AssessmentBase):
    id: str
    createdAt: int
    updatedAt: int

    model_config = ConfigDict(from_attributes=True)


