"""
Schemas for account request/response validation.
"""
from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class AccountCreate(BaseSchema):
    """Schema for creating an account."""

    institution_id: int = Field(..., description="Institution ID")
    name: str = Field(..., min_length=1, max_length=255, description="Account name")
    type_id: int = Field(default=1, description="Account type ID")
    status_id: int = Field(default=1, description="Account status ID")


class AccountUpdate(BaseSchema):
    """Schema for updating an account."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type_id: Optional[int] = None
    status_id: Optional[int] = None


class AccountResponse(BaseSchema):
    """Schema for account response."""

    id: int
    user_id: int
    institution_id: int
    name: str
    type_id: int
    status_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
