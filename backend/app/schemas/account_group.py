"""
Schemas for account group request/response validation.
"""
from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class AccountGroupCreate(BaseSchema):
    """Schema for creating an account group."""

    name: str = Field(..., min_length=1, max_length=255, description="Account group name")


class AccountGroupUpdate(BaseSchema):
    """Schema for updating an account group."""

    name: str = Field(..., min_length=1, max_length=255, description="Account group name")


class AccountGroupMemberResponse(BaseSchema):
    """Schema for account group member response."""

    id: int
    account_group_id: int
    account_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AccountGroupResponse(BaseSchema):
    """Schema for account group response."""

    id: int
    user_id: int
    name: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    members: Optional[list[AccountGroupMemberResponse]] = None

    class Config:
        from_attributes = True
