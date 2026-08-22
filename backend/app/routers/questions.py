from typing import List, Union
from fastapi import APIRouter, Depends, Body, status
from app.schemas.question import (
    QuestionCreate,
    QuestionUpdate,
    QuestionAdminResponse,
    QuestionStudentResponse,
)
from app.schemas.user import UserRole
from app.models.entities import UserEntity
from app.services.question_service import QuestionService
from app.core.dependencies import (
    get_question_service,
    get_current_user,
    require_roles,
)

router = APIRouter(prefix="/questions", tags=["Questions"])

@router.post("", response_model=QuestionAdminResponse, status_code=status.HTTP_201_CREATED)
def create_question(
    q_in: QuestionCreate,
    q_service: QuestionService = Depends(get_question_service),
    admin_user: UserEntity = Depends(require_roles([UserRole.ADMIN])),
):
    """Create a new question (Admin only)."""
    return q_service.create_question(q_in)

@router.get("", response_model=List[Union[QuestionAdminResponse, QuestionStudentResponse]])
def list_questions(
    q_service: QuestionService = Depends(get_question_service),
    current_user: UserEntity = Depends(get_current_user),
):
    """List all questions. Admin receives complete details; Student receives scrubbed details."""
    return q_service.list_questions(user_role=current_user.role)

@router.get("/{question_id}", response_model=Union[QuestionAdminResponse, QuestionStudentResponse])
def get_question(
    question_id: str,
    q_service: QuestionService = Depends(get_question_service),
    current_user: UserEntity = Depends(get_current_user),
):
    """Get question details. Scrubbed if requested by Student."""
    return q_service.get_question_by_id(question_id, user_role=current_user.role)

@router.put("/{question_id}", response_model=QuestionAdminResponse)
def update_question(
    question_id: str,
    q_update: QuestionUpdate,
    q_service: QuestionService = Depends(get_question_service),
    admin_user: UserEntity = Depends(require_roles([UserRole.ADMIN])),
):
    """Update a question (Admin only)."""
    return q_service.update_question(question_id, q_update)

@router.delete("/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    question_id: str,
    q_service: QuestionService = Depends(get_question_service),
    admin_user: UserEntity = Depends(require_roles([UserRole.ADMIN])),
):
    """Delete a question (Admin only)."""
    q_service.delete_question(question_id)
    return None

@router.patch("/{question_id}/status", response_model=QuestionAdminResponse)
def patch_question_status(
    question_id: str,
    enabled: bool = Body(..., embed=True),
    q_service: QuestionService = Depends(get_question_service),
    admin_user: UserEntity = Depends(require_roles([UserRole.ADMIN])),
):
    """Toggle enabled status for a question (Admin only)."""
    return q_service.set_status(question_id, enabled=enabled)
