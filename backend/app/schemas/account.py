"""
Schemas for account request/response validation.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AccountCreate(BaseModel):
    """Schema for creating an account."""

    institutionid: int = Field(..., description="Institution ID")
    name: str = Field(..., min_length=1, max_length=255, description="Account name")
    typeid: int = Field(default=1, description="Account type ID")
    statusid: int = Field(default=1, description="Account status ID")


class AccountUpdate(BaseModel):
    """Schema for updating an account."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    typeid: Optional[int] = None
    statusid: Optional[int] = None


class AccountResponse(BaseModel):
    """Schema for account response."""

    id: int
    userid: int
    institutionid: int
    name: str
    typeid: int
    statusid: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
