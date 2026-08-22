from fastapi import APIRouter, Depends
from app.schemas.submission import QuestionSubmissionRequest, QuestionSubmissionResponse
from app.schemas.result import AssessmentResultResponse
from app.services.submission_service import SubmissionService
from app.core.dependencies import get_submission_service, get_current_user
from app.models.entities import UserEntity

router = APIRouter(prefix="/attempts", tags=["Submissions"])

@router.post("/{attempt_id}/questions/{question_id}/submit", response_model=QuestionSubmissionResponse)
def submit_question(
    attempt_id: str,
    question_id: str,
    sub: QuestionSubmissionRequest,
    sub_service: SubmissionService = Depends(get_submission_service),
    current_user: UserEntity = Depends(get_current_user),
):
    """Submit a question answer or code. Consumes an attempt."""
    return sub_service.submit_question(
        student_id=current_user.id,
        attempt_id=attempt_id,
        question_id=question_id,
        sub=sub,
    )

@router.post("/{attempt_id}/finalize", response_model=AssessmentResultResponse)
def finalize_assessment_attempt(
    attempt_id: str,
    sub_service: SubmissionService = Depends(get_submission_service),
    current_user: UserEntity = Depends(get_current_user),
):
    """Finalize overall assessment attempt and return student total score."""
    return sub_service.finalize_attempt(student_id=current_user.id, attempt_id=attempt_id)
