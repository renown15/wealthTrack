"""
Schemas for account event responses.
"""
from datetime import datetime
from typing import Optional

from app.schemas.base import BaseSchema


class AccountEventCreate(BaseSchema):
    """Schema for creating a new account event."""

    event_type: str
    value: str


class AccountEventResponse(BaseSchema):
    """Schema representing a single account event or attribute for API responses."""

    id: int
    account_id: int
    user_id: int
    event_type: str
    value: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    source: str = "event"  # "event" or "attribute"
