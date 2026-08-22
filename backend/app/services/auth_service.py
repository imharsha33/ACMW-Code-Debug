from typing import Optional
from app.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.exceptions import UnauthorizedException, BadRequestException
from app.schemas.user import UserRole
from app.schemas.auth import LoginRequest, TokenResponse
from app.models.entities import UserEntity
from app.repositories.base import UserRepositoryInterface

class AuthService:
    def __init__(self, user_repo: UserRepositoryInterface):
        self.user_repo = user_repo

    def authenticate_user(self, login_data: LoginRequest) -> TokenResponse:
        email = login_data.email.lower().strip()
        user = self.user_repo.get_by_email(email)

        # Handle Admin authentication dynamically if admin user not yet present
        if not user and email == settings.ADMIN_EMAIL.lower().strip():
            # Seed admin user
            admin_entity = UserEntity(
                id="user_admin",
                email=settings.ADMIN_EMAIL.lower().strip(),
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                name="Club Admin",
                role=UserRole.ADMIN,
            )
            user = self.user_repo.create(admin_entity)

        # If user is still not found, raise UnauthorizedException
        if not user:
            raise UnauthorizedException("Invalid email or password")

        # Verify password
        if not verify_password(login_data.password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")

        # Generate JWT token
        token_payload = {
            "sub": user.id,
            "email": user.email,
            "role": user.role,
        }
        token = create_access_token(data=token_payload)

        return TokenResponse(
            access_token=token,
            token_type="bearer",
            user={
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
            },
        )

    def get_user_by_id(self, user_id: str) -> Optional[UserEntity]:
        return self.user_repo.get_by_id(user_id)
