"""
Schemas for institution request/response validation.
"""
from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class InstitutionCreate(BaseSchema):
    """Schema for creating an institution."""

    name: str = Field(..., min_length=1, max_length=255, description="Institution name")


class InstitutionUpdate(BaseSchema):
    """Schema for updating an institution."""

    name: str = Field(..., min_length=1, max_length=255, description="Institution name")


class InstitutionResponse(BaseSchema):
    """Schema for institution response."""

    id: int
    user_id: int
    name: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
