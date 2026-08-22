from typing import List
from fastapi import APIRouter, Depends, Body, status
from app.schemas.assessment import AssessmentCreate, AssessmentUpdate, AssessmentResponse, AssessmentStatus
from app.schemas.result import AssessmentResultResponse
from app.schemas.user import UserRole
from app.models.entities import UserEntity, AssessmentAttemptEntity
from app.services.assessment_service import AssessmentService
from app.services.submission_service import SubmissionService
from app.core.dependencies import (
    get_assessment_service,
    get_submission_service,
    get_current_user,
    require_roles,
)

router = APIRouter(prefix="/assessments", tags=["Assessments"])

@router.post("", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
def create_assessment(
    a_in: AssessmentCreate,
    a_service: AssessmentService = Depends(get_assessment_service),
    admin_user: UserEntity = Depends(require_roles([UserRole.ADMIN])),
):
    """Create a new assessment (Admin only)."""
    return a_service.create_assessment(a_in)

@router.get("", response_model=List[AssessmentResponse])
def list_assessments(
    a_service: AssessmentService = Depends(get_assessment_service),
    current_user: UserEntity = Depends(get_current_user),
):
    """List all assessments."""
    return a_service.list_assessments()

@router.get("/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(
    assessment_id: str,
    a_service: AssessmentService = Depends(get_assessment_service),
    current_user: UserEntity = Depends(get_current_user),
):
    """Get assessment details."""
    return a_service.get_assessment_by_id(assessment_id)

@router.put("/{assessment_id}", response_model=AssessmentResponse)
def update_assessment(
    assessment_id: str,
    a_update: AssessmentUpdate,
    a_service: AssessmentService = Depends(get_assessment_service),
    admin_user: UserEntity = Depends(require_roles([UserRole.ADMIN])),
):
    """Update assessment settings (Admin only)."""
    return a_service.update_assessment(assessment_id, a_update)

@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assessment(
    assessment_id: str,
    a_service: AssessmentService = Depends(get_assessment_service),
    admin_user: UserEntity = Depends(require_roles([UserRole.ADMIN])),
):
    """Delete assessment (Admin only)."""
    a_service.delete_assessment(assessment_id)
    return None

@router.patch("/{assessment_id}/status", response_model=AssessmentResponse)
def patch_assessment_status(
    assessment_id: str,
    status_val: AssessmentStatus = Body(..., embed=True, alias="status"),
    a_service: AssessmentService = Depends(get_assessment_service),
    admin_user: UserEntity = Depends(require_roles([UserRole.ADMIN])),
):
    """Update assessment status (Admin only)."""
    return a_service.set_status(assessment_id, status=status_val)

@router.post("/{assessment_id}/start")
def start_assessment(
    assessment_id: str,
    sub_service: SubmissionService = Depends(get_submission_service),
    current_user: UserEntity = Depends(get_current_user),
):
    """Start assessment attempt session for student."""
    attempt = sub_service.get_or_create_attempt(current_user.id, assessment_id)
    return {
        "attempt_id": attempt.id,
        "assessment_id": attempt.assessment_id,
        "started_at": attempt.started_at,
        "expires_at": attempt.expires_at,
    }
