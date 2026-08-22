from typing import List
from fastapi import APIRouter, Depends, status
from app.schemas.event import EventCreate, EventResponse
from app.services.event_service import EventService
from app.core.dependencies import get_event_service, get_current_user
from app.models.entities import UserEntity

router = APIRouter(prefix="/attempts", tags=["Events"])

@router.post("/{attempt_id}/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def record_event(
    attempt_id: str,
    event_in: EventCreate,
    event_service: EventService = Depends(get_event_service),
    current_user: UserEntity = Depends(get_current_user),
):
    """Log an assessment event (e.g. TAB_SWITCH, FULLSCREEN_ENTERED, etc.)."""
    return event_service.record_event(attempt_id, event_in)

@router.get("/{attempt_id}/events", response_model=List[EventResponse])
def list_events(
    attempt_id: str,
    event_service: EventService = Depends(get_event_service),
    current_user: UserEntity = Depends(get_current_user),
):
    """List all events recorded for an attempt."""
    return event_service.list_events_for_attempt(attempt_id)
