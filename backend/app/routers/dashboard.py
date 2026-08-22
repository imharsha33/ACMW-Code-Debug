from fastapi import APIRouter, Depends
from app.schemas.dashboard import AdminDashboardMetrics, StudentDashboardMetrics
from app.schemas.user import UserRole
from app.models.entities import UserEntity
from app.repositories.base import (
    UserRepositoryInterface,
    AssessmentRepositoryInterface,
    QuestionRepositoryInterface,
    AttemptRepositoryInterface,
)
from app.services.submission_service import SubmissionService
from app.core.dependencies import (
    get_user_repo,
    get_assessment_repo,
    get_question_repo,
    get_attempt_repo,
    get_submission_service,
    get_current_user,
    require_roles,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/admin", response_model=AdminDashboardMetrics)
def get_admin_dashboard(
    user_repo: UserRepositoryInterface = Depends(get_user_repo),
    assessment_repo: AssessmentRepositoryInterface = Depends(get_assessment_repo),
    question_repo: QuestionRepositoryInterface = Depends(get_question_repo),
    attempt_repo: AttemptRepositoryInterface = Depends(get_attempt_repo),
    sub_service: SubmissionService = Depends(get_submission_service),
    admin_user: UserEntity = Depends(require_roles([UserRole.ADMIN])),
):
    """Admin Dashboard metrics generated from actual backend repository data."""
    all_users = user_repo.list_all()
    students_count = sum(1 for u in all_users if u.role == UserRole.STUDENT)

    assessments = assessment_repo.list_all()
    questions = question_repo.list_all()
    attempts = attempt_repo.list_all()

    recent_results = [sub_service.get_attempt_result(att.id) for att in attempts]

    return AdminDashboardMetrics(
        total_students=students_count,
        total_assessments=len(assessments),
        total_questions=len(questions),
        total_submissions=len(attempts),
        recent_results=recent_results,
    )

@router.get("/student", response_model=StudentDashboardMetrics)
def get_student_dashboard(
    assessment_repo: AssessmentRepositoryInterface = Depends(get_assessment_repo),
    attempt_repo: AttemptRepositoryInterface = Depends(get_attempt_repo),
    sub_service: SubmissionService = Depends(get_submission_service),
    current_user: UserEntity = Depends(get_current_user),
):
    """Student Dashboard metrics generated from actual backend repository data."""
    assessments = assessment_repo.list_all()
    student_attempts = attempt_repo.list_by_student(current_user.id)

    recent_results = [sub_service.get_attempt_result(att.id) for att in student_attempts]

    total_earned = sum(res.total_earned_marks for res in recent_results)
    total_max = sum(res.total_maximum_marks for res in recent_results)
    completed_count = sum(1 for res in recent_results if res.finalized)

    return StudentDashboardMetrics(
        total_assessments=len(assessments),
        completed_assessments=completed_count,
        total_earned_marks=total_earned,
        total_maximum_marks=total_max,
        recent_results=recent_results,
    )
