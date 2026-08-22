import time
from typing import List
from app.core.exceptions import NotFoundException
from app.models.entities import EventEntity
from app.schemas.event import EventCreate, EventResponse, EventType
from app.repositories.base import EventRepositoryInterface, AttemptRepositoryInterface

class EventService:
    def __init__(
        self,
        event_repo: EventRepositoryInterface,
        attempt_repo: AttemptRepositoryInterface,
    ):
        self.event_repo = event_repo
        self.attempt_repo = attempt_repo

    def record_event(self, attempt_id: str, event_in: EventCreate) -> EventResponse:
        now = int(time.time() * 1000)
        ts = event_in.timestamp if event_in.timestamp else now
        event_id = f"evt_{now}_{int(hash(event_in.event_type) & 0xffff)}"

        attempt = self.attempt_repo.get_by_id(attempt_id)
        if attempt:
            if event_in.event_type == EventType.TAB_SWITCH:
                attempt.tab_switch_count += 1
                if attempt.tab_switch_count >= attempt.max_tab_switches:
                    attempt.terminated_by_violations = True
                self.attempt_repo.update(
                    attempt.id,
                    {
                        "tab_switch_count": attempt.tab_switch_count,
                        "terminated_by_violations": attempt.terminated_by_violations,
                    },
                )

        entity = EventEntity(
            id=event_id,
            attempt_id=attempt_id,
            event_type=event_in.event_type,
            timestamp=ts,
            metadata=event_in.metadata or {},
        )

        saved = self.event_repo.create(entity)
        return EventResponse(
            id=saved.id,
            attempt_id=saved.attempt_id,
            event_type=saved.event_type,
            timestamp=saved.timestamp,
            metadata=saved.metadata,
        )

    def list_events_for_attempt(self, attempt_id: str) -> List[EventResponse]:
        events = self.event_repo.list_by_attempt(attempt_id)
        return [
            EventResponse(
                id=e.id,
                attempt_id=e.attempt_id,
                event_type=e.event_type,
                timestamp=e.timestamp,
                metadata=e.metadata,
            )
            for e in events
        ]
