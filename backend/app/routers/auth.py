from fastapi import APIRouter, Depends, status
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserResponse
from app.models.entities import UserEntity
from app.services.auth_service import AuthService
from app.core.dependencies import get_auth_service, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(
    login_data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Authenticate Admin or Student and return JWT access token."""
    return auth_service.authenticate_user(login_data)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: UserEntity = Depends(get_current_user)):
    """Return currently authenticated user profile."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
    )

@router.post("/logout", status_code=status.HTTP_200_OK)
def logout(current_user: UserEntity = Depends(get_current_user)):
    """Logout current user session."""
    return {"message": "Successfully logged out"}
