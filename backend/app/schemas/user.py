"""
Pydantic schemas for user registration and authentication.
"""
from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas.base import BaseSchema


class UserRegistrationRequest(BaseSchema):
    """Schema for user registration request."""

    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1, max_length=100)


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
