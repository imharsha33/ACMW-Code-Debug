from typing import Callable, List, Optional
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from app.core.exceptions import UnauthorizedException, ForbiddenException
from app.core.security import decode_access_token
from app.schemas.user import UserRole, UserResponse
from app.models.entities import UserEntity
from app.repositories.temporary_repository import (
    TemporaryUserRepository,
    TemporaryQuestionRepository,
    TemporaryAssessmentRepository,
    TemporaryAttemptRepository,
    TemporaryEventRepository,
)
from app.services.auth_service import AuthService
from app.services.question_service import QuestionService
from app.services.assessment_service import AssessmentService
from app.services.execution_service import ExecutionService
from app.services.evaluation_service import EvaluationService
from app.services.submission_service import SubmissionService
from app.services.event_service import EventService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Repository singletons / instances for DI
_user_repo = TemporaryUserRepository()
_question_repo = TemporaryQuestionRepository()
_assessment_repo = TemporaryAssessmentRepository()
_attempt_repo = TemporaryAttemptRepository()
_event_repo = TemporaryEventRepository()

def get_user_repo() -> TemporaryUserRepository:
    return _user_repo

def get_question_repo() -> TemporaryQuestionRepository:
    return _question_repo

def get_assessment_repo() -> TemporaryAssessmentRepository:
    return _assessment_repo

def get_attempt_repo() -> TemporaryAttemptRepository:
    return _attempt_repo

def get_event_repo() -> TemporaryEventRepository:
    return _event_repo

# Service providers
def get_auth_service(user_repo=Depends(get_user_repo)) -> AuthService:
    return AuthService(user_repo)

def get_question_service(q_repo=Depends(get_question_repo)) -> QuestionService:
    return QuestionService(q_repo)

def get_assessment_service(a_repo=Depends(get_assessment_repo)) -> AssessmentService:
    return AssessmentService(a_repo)

def get_execution_service() -> ExecutionService:
    return ExecutionService()

def get_evaluation_service(exec_svc=Depends(get_execution_service)) -> EvaluationService:
    return EvaluationService(exec_svc)

def get_submission_service(
    att_repo=Depends(get_attempt_repo),
    ass_repo=Depends(get_assessment_repo),
    q_repo=Depends(get_question_repo),
    u_repo=Depends(get_user_repo),
    eval_svc=Depends(get_evaluation_service),
) -> SubmissionService:
    return SubmissionService(att_repo, ass_repo, q_repo, u_repo, eval_svc)

def get_event_service(
    evt_repo=Depends(get_event_repo),
    att_repo=Depends(get_attempt_repo),
) -> EventService:
    return EventService(evt_repo, att_repo)

# Authentication & Authorization Dependencies
def get_current_user(
    token: str = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> UserEntity:
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise UnauthorizedException("Invalid or expired authentication token")

    user_id = payload["sub"]
    user = auth_service.get_user_by_id(user_id)
    if not user:
        raise UnauthorizedException("User not found")
    return user

def require_roles(allowed_roles: List[UserRole]):
    def role_checker(current_user: UserEntity = Depends(get_current_user)) -> UserEntity:
        if current_user.role not in allowed_roles:
            raise ForbiddenException(f"Role '{current_user.role}' does not have access to this resource")
        return current_user
    return role_checker
