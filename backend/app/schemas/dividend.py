"""Schemas for dividend recording."""
from datetime import date
from typing import Optional

from app.schemas.base import BaseSchema


class RecordDividendRequest(BaseSchema):
    """Request body for recording a dividend payment."""

    amount: str
    payment_date: date


class RecordDividendResponse(BaseSchema):
    """Response after recording a dividend."""

    group_id: int
    account_id: int
    amount: str
    payment_date: date
    tax_provision: Optional[str] = None
    tax_account_id: Optional[int] = None
