from typing import List
from fastapi import APIRouter, Depends
from app.schemas.result import AssessmentResultResponse
from app.schemas.user import UserRole
from app.models.entities import UserEntity
from app.repositories.base import AttemptRepositoryInterface
from app.services.submission_service import SubmissionService
from app.core.dependencies import (
    get_attempt_repo,
    get_submission_service,
    get_current_user,
    require_roles,
)
from app.core.exceptions import ForbiddenException

router = APIRouter(prefix="/results", tags=["Results"])

@router.get("/me", response_model=List[AssessmentResultResponse])
def get_my_results(
    attempt_repo: AttemptRepositoryInterface = Depends(get_attempt_repo),
    sub_service: SubmissionService = Depends(get_submission_service),
    current_user: UserEntity = Depends(get_current_user),
):
    """Get authenticated student's results."""
    attempts = attempt_repo.list_by_student(current_user.id)
    return [sub_service.get_attempt_result(att.id) for att in attempts]

@router.get("/student/{student_id}", response_model=List[AssessmentResultResponse])
def get_student_results(
    student_id: str,
    attempt_repo: AttemptRepositoryInterface = Depends(get_attempt_repo),
    sub_service: SubmissionService = Depends(get_submission_service),
    current_user: UserEntity = Depends(get_current_user),
):
    """Get results for a specific student (Admin or self)."""
    if current_user.role != UserRole.ADMIN and current_user.id != student_id:
        raise ForbiddenException("You cannot view results for another student")

    attempts = attempt_repo.list_by_student(student_id)
    return [sub_service.get_attempt_result(att.id) for att in attempts]

@router.get("/assessment/{assessment_id}", response_model=List[AssessmentResultResponse])
def get_assessment_results(
    assessment_id: str,
    attempt_repo: AttemptRepositoryInterface = Depends(get_attempt_repo),
    sub_service: SubmissionService = Depends(get_submission_service),
    admin_user: UserEntity = Depends(require_roles([UserRole.ADMIN])),
):
    """Get all student results for a given assessment (Admin only)."""
    attempts = attempt_repo.list_by_assessment(assessment_id)
    return [sub_service.get_attempt_result(att.id) for att in attempts]
