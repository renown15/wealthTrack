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
    parent_id: Optional[int] = Field(
        None, description="Parent institution ID if part of a group"
    )
    institution_type: Optional[str] = Field(
        None,
        max_length=100,
        description="Type of institution (Bank, Building Society, HM Government, Fund Manager)",
    )


class InstitutionUpdate(BaseSchema):
    """Schema for updating an institution."""

    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Institution name")
    parent_id: Optional[int] = Field(
        None, description="Parent institution ID if part of a group"
    )
    institution_type: Optional[str] = Field(
        None,
        max_length=100,
        description="Type of institution (Bank, Building Society, HM Government, Fund Manager)",
    )


class InstitutionResponse(BaseSchema):
    """Schema for institution response."""

    id: int
    user_id: int
    name: str
    parent_id: Optional[int] = None
    institution_type: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
