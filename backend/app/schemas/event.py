from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

class EventType(str, Enum):
    ASSESSMENT_STARTED = "ASSESSMENT_STARTED"
    QUESTION_OPENED = "QUESTION_OPENED"
    RUN_CLICKED = "RUN_CLICKED"
    QUESTION_SUBMITTED = "QUESTION_SUBMITTED"
    TAB_SWITCH = "TAB_SWITCH"
    FULLSCREEN_ENTERED = "FULLSCREEN_ENTERED"
    FULLSCREEN_EXITED = "FULLSCREEN_EXITED"
    ASSESSMENT_SUBMITTED = "ASSESSMENT_SUBMITTED"
    ASSESSMENT_EXPIRED = "ASSESSMENT_EXPIRED"

class EventCreate(BaseModel):
    event_type: EventType
    timestamp: Optional[int] = Field(default=None, description="Event timestamp in milliseconds")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)

class EventResponse(BaseModel):
    id: str
    attempt_id: str
    event_type: EventType
    timestamp: int
    metadata: Dict[str, Any]
