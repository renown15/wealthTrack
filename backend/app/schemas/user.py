"""
Pydantic schemas for user registration and authentication.
"""
from datetime import datetime

from pydantic import EmailStr, Field, field_validator

from app.schemas.base import BaseSchema


class UserRegistrationRequest(BaseSchema):
    """Schema for user registration request."""

    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8, max_length=100)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Validate password strength."""
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserResponse(BaseSchema):
    """Schema for user response."""

    id: int
    email: str
    first_name: str = Field(..., validation_alias="first_name")
    last_name: str = Field(..., validation_alias="last_name")
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseSchema):
    """Schema for authentication token response."""

    access_token: str
    token_type: str = Field(default="bearer")


class UserLoginRequest(BaseSchema):
    """Schema for user login request."""

    email: EmailStr
    password: str
