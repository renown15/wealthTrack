"""Schemas for gift request/response validation."""
from datetime import date
from typing import Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class RecordGiftRequest(BaseSchema):
    """Request body for recording a gift on an account."""

    donor: str = Field(..., min_length=1, max_length=255)
    gift_date: date
    gift_value_gbp: str = Field(..., description="Monetary value of the gift in GBP")
    num_shares: Optional[str] = Field(None, description="Number of shares (shares accounts only)")


class RecordGiftResponse(BaseSchema):
    """Response after recording a gift."""

    group_id: int
    account_id: int
    donor: str
    gift_date: date
    gift_value_gbp: str
    num_shares: Optional[str] = None


class GiftSummary(BaseSchema):
    """A single gift with current IHT taper calculation."""

    group_id: int
    account_id: int
    account_name: str
    donor: str
    gift_date: date
    gift_value_gbp: str
    num_shares: Optional[str] = None
    years_elapsed: float
    iht_rate: str
    iht_exposure: str
