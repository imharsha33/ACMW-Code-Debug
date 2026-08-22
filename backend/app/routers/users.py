from typing import List, Optional
from fastapi import APIRouter, Depends
from app.schemas.user import UserResponse, UserRole, StudentCreate
from app.models.entities import UserEntity
from app.repositories.base import UserRepositoryInterface
from app.core.dependencies import get_user_repo, require_roles, get_current_user
from app.core.exceptions import NotFoundException, BadRequestException
from app.core.security import get_password_hash
import uuid

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("", response_model=UserResponse)
def create_student(
    student_data: StudentCreate,
    user_repo: UserRepositoryInterface = Depends(get_user_repo),
    admin_user: UserEntity = Depends(require_roles([UserRole.ADMIN])),
):
    """Create a new student account (Admin only)."""
    email = student_data.email.lower().strip()
    existing_user = user_repo.get_by_email(email)
    if existing_user:
        raise BadRequestException(f"User with email {email} already exists")

    name = email.split("@")[0].replace(".", " ").title()
    new_user = UserEntity(
        id=f"user_{uuid.uuid4().hex[:8]}",
        email=email,
        hashed_password=get_password_hash(student_data.password),
        name=name,
        role=UserRole.STUDENT,
    )
    created_user = user_repo.create(new_user)
    return UserResponse(
        id=created_user.id,
        email=created_user.email,
        name=created_user.name,
        role=created_user.role,
        is_blocked=created_user.is_blocked,
        tab_switch_count=created_user.tab_switch_count,
        active_device_id=created_user.active_device_id,
        test_submitted=created_user.test_submitted,
    )

@router.get("", response_model=List[UserResponse])
def list_users(
    user_repo: UserRepositoryInterface = Depends(get_user_repo),
    admin_user: UserEntity = Depends(require_roles([UserRole.ADMIN])),
):
    """List all registered users (Admin only)."""
    users = user_repo.list_all()
    return [
        UserResponse(
            id=u.id,
            email=u.email,
            name=u.name,
            role=u.role,
            is_blocked=u.is_blocked,
            tab_switch_count=u.tab_switch_count,
            active_device_id=u.active_device_id,
            test_submitted=u.test_submitted,
        )
        for u in users
    ]

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    user_repo: UserRepositoryInterface = Depends(get_user_repo),
    current_user: UserEntity = Depends(get_current_user),
):
    """Get user details by ID."""
    u = user_repo.get_by_id(user_id)
    if not u:
        raise NotFoundException(f"User {user_id} not found")
    return UserResponse(
        id=u.id,
        email=u.email,
        name=u.name,
        role=u.role,
        is_blocked=u.is_blocked,
        tab_switch_count=u.tab_switch_count,
        active_device_id=u.active_device_id,
        test_submitted=u.test_submitted,
    )

from pydantic import BaseModel
class UserStatusUpdate(BaseModel):
    is_blocked: Optional[bool] = None
    tab_switch_count: Optional[int] = None
    active_device_id: Optional[str] = None
    test_submitted: Optional[bool] = None

@router.put("/{email}/status", response_model=UserResponse)
def update_user_status(
    email: str,
    status_data: UserStatusUpdate,
    user_repo: UserRepositoryInterface = Depends(get_user_repo),
    current_user: UserEntity = Depends(get_current_user),
):
    """Update a user's block status, tab switches, active device ID, or exam submitted status."""
    # Allow admin or the user themselves to update
    if current_user.role != UserRole.ADMIN and current_user.email.lower().strip() != email.lower().strip():
        raise ForbiddenException("You do not have permission to update this user's status")
    
    data = {k: v for k, v in status_data.model_dump().items() if v is not None}
    updated = user_repo.update(email, data)
    if not updated:
        raise NotFoundException(f"User {email} not found")
    
    return UserResponse(
        id=updated.id,
        email=updated.email,
        name=updated.name,
        role=updated.role,
        is_blocked=updated.is_blocked,
        tab_switch_count=updated.tab_switch_count,
        active_device_id=updated.active_device_id,
        test_submitted=updated.test_submitted,
    )

@router.post("/{email}/reset", response_model=UserResponse)
def reset_user_status(
    email: str,
    user_repo: UserRepositoryInterface = Depends(get_user_repo),
    admin_user: UserEntity = Depends(require_roles([UserRole.ADMIN])),
):
    """Reset a student's proctoring violations and block status (Admin only)."""
    data = {
        "is_blocked": False,
        "tab_switch_count": 0,
    }
    updated = user_repo.update(email, data)
    if not updated:
        raise NotFoundException(f"User {email} not found")
    
    return UserResponse(
        id=updated.id,
        email=updated.email,
        name=updated.name,
        role=updated.role,
        is_blocked=updated.is_blocked,
        tab_switch_count=updated.tab_switch_count,
        active_device_id=updated.active_device_id,
        test_submitted=updated.test_submitted,
    )
