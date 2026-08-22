from enum import Enum
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from typing import Optional

class UserRole(str, Enum):
    ADMIN = "ADMIN"
    STUDENT = "STUDENT"

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: UserRole

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserResponse(UserBase):
    id: str
    is_blocked: bool = False
    tab_switch_count: int = 0
    active_device_id: Optional[str] = None
    test_submitted: bool = False

    model_config = ConfigDict(from_attributes=True)


class StudentCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=4)

