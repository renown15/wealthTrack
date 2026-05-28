"""Schemas for Family request/response validation."""
from datetime import datetime
from typing import Any, Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class FamilyCreate(BaseSchema):
    """Schema for creating a family."""

    name: str = Field(..., min_length=1, max_length=255)


class FamilyUpdate(BaseSchema):
    """Schema for renaming a family."""

    name: str = Field(..., min_length=1, max_length=255)


class AddMemberRequest(BaseSchema):
    """Schema for adding a member to a family by user account ID."""

    account_id: int


class FamilyMemberResponse(BaseSchema):
    """Response schema for a family member."""

    id: int
    account_id: int
    first_name: str
    last_name: str
    email: str

    model_config = {"from_attributes": True}


class FamilyResponse(BaseSchema):
    """Response schema for a family with its members."""

    id: int
    name: str
    owner_id: int
    is_owner: bool
    members: list[FamilyMemberResponse] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserSummaryResponse(BaseSchema):
    """Minimal user info for the available-members list."""

    id: int
    first_name: str
    last_name: str
    email: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm(cls, obj: Any) -> "UserSummaryResponse":
        return cls(
            id=obj.id,
            first_name=obj.first_name,
            last_name=obj.last_name,
            email=obj.email,
        )
