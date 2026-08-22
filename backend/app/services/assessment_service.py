import time
from typing import List, Optional
from app.core.exceptions import NotFoundException, BadRequestException
from app.models.entities import AssessmentEntity
from app.repositories.base import AssessmentRepositoryInterface
from app.schemas.assessment import (
    AssessmentCreate,
    AssessmentUpdate,
    AssessmentResponse,
    AssessmentStatus,
    TimeLimit,
)

class AssessmentService:
    def __init__(self, assessment_repo: AssessmentRepositoryInterface):
        self.assessment_repo = assessment_repo

    def create_assessment(self, a_in: AssessmentCreate) -> AssessmentResponse:
        now = int(time.time() * 1000)
        a_id = f"assessment_{now}_{int(hash(a_in.title) & 0xffff)}"

        entity = AssessmentEntity(
            id=a_id,
            title=a_in.title,
            description=a_in.description,
            time_limit_hours=a_in.overall_time_limit.hours,
            time_limit_minutes=a_in.overall_time_limit.minutes,
            time_limit_seconds=a_in.overall_time_limit.seconds,
            overall_submit_threshold=a_in.overall_submit_threshold,
            fullscreen_mode=a_in.fullscreen_mode,
            tab_switching_mode=a_in.tab_switching_mode,
            status=a_in.status,
            question_ids=a_in.question_ids,
            created_at=now,
            updated_at=now,
        )

        saved = self.assessment_repo.create(entity)
        return self._to_response(saved)

    def get_assessment_by_id(self, assessment_id: str) -> AssessmentResponse:
        entity = self.assessment_repo.get_by_id(assessment_id)
        if not entity:
            raise NotFoundException(f"Assessment {assessment_id} not found")
        return self._to_response(entity)

    def list_assessments(self) -> List[AssessmentResponse]:
        entities = self.assessment_repo.list_all()
        return [self._to_response(e) for e in entities]

    def update_assessment(self, assessment_id: str, a_update: AssessmentUpdate) -> AssessmentResponse:
        existing = self.assessment_repo.get_by_id(assessment_id)
        if not existing:
            raise NotFoundException(f"Assessment {assessment_id} not found")

        data_dict = a_update.model_dump(exclude_unset=True)
        if "overall_time_limit" in data_dict and data_dict["overall_time_limit"] is not None:
            tl = data_dict["overall_time_limit"]
            data_dict["time_limit_hours"] = tl.get("hours", 0)
            data_dict["time_limit_minutes"] = tl.get("minutes", 0)
            data_dict["time_limit_seconds"] = tl.get("seconds", 0)
            del data_dict["overall_time_limit"]

        updated = self.assessment_repo.update(assessment_id, data_dict)
        return self._to_response(updated)

    def delete_assessment(self, assessment_id: str) -> bool:
        if not self.assessment_repo.get_by_id(assessment_id):
            raise NotFoundException(f"Assessment {assessment_id} not found")
        return self.assessment_repo.delete(assessment_id)

    def set_status(self, assessment_id: str, status: AssessmentStatus) -> AssessmentResponse:
        updated = self.assessment_repo.update(assessment_id, {"status": status})
        if not updated:
            raise NotFoundException(f"Assessment {assessment_id} not found")
        return self._to_response(updated)

    def _to_response(self, entity: AssessmentEntity) -> AssessmentResponse:
        return AssessmentResponse(
            id=entity.id,
            title=entity.title,
            description=entity.description,
            overall_time_limit=TimeLimit(
                hours=entity.time_limit_hours,
                minutes=entity.time_limit_minutes,
                seconds=entity.time_limit_seconds,
            ),
            overall_submit_threshold=entity.overall_submit_threshold,
            fullscreen_mode=entity.fullscreen_mode,
            tab_switching_mode=entity.tab_switching_mode,
            status=entity.status,
            question_ids=entity.question_ids,
            createdAt=entity.created_at,
            updatedAt=entity.updated_at,
        )
