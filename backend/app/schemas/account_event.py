"""
Schemas for account event responses.
"""
from datetime import datetime
from typing import Optional

from app.schemas.base import BaseSchema


class AccountEventResponse(BaseSchema):
    """Schema representing a single account event for API responses."""

    id: int
    account_id: int
    user_id: int
    event_type: str
    value: Optional[str] = None
    created_at: datetime
