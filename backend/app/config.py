from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Coding & Debugging Club Platform Backend"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "super-secret-jwt-key-for-dev-environment-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    ADMIN_EMAIL: str = "acmw@kare.klu.in"
    ADMIN_PASSWORD: str = "acmw@2026w"
    
    STUDENT_EMAIL: str = "student@klu.in"
    STUDENT_PASSWORD: str = "student@2026w"

    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://herizon-code-debug.web.app",
        "https://herizon-code-debug.firebaseapp.com",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.strip() == "*":
                return ["*"]
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
