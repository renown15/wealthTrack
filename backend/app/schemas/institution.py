"""
Schemas for institution request/response validation.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class InstitutionCreate(BaseModel):
    """Schema for creating an institution."""

    name: str = Field(..., min_length=1, max_length=255, description="Institution name")


class InstitutionUpdate(BaseModel):
    """Schema for updating an institution."""

    name: str = Field(..., min_length=1, max_length=255, description="Institution name")


class InstitutionResponse(BaseModel):
    """Schema for institution response."""

    id: int
    userid: int
    name: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
