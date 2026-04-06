"""
Schemas for tax period, return, and document endpoints.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class TaxPeriodCreate(BaseSchema):
    """Create a new tax period."""

    name: str = Field(..., min_length=1, max_length=255)
    start_date: date
    end_date: date


class TaxPeriodResponse(BaseSchema):
    """Tax period response."""

    id: int
    user_id: int
    name: str
    start_date: date
    end_date: date
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaxReturnUpsert(BaseSchema):
    """Upsert tax return values for an account in a period."""

    income: Optional[float] = None
    capital_gain: Optional[float] = None
    tax_taken_off: Optional[float] = None


class TaxReturnResponse(BaseSchema):
    """Tax return response."""

    id: int
    account_id: int
    tax_period_id: int
    income: Optional[float] = None
    capital_gain: Optional[float] = None
    tax_taken_off: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaxDocumentResponse(BaseSchema):
    """Tax document metadata response (no file_data)."""

    id: int
    tax_return_id: int
    filename: str
    content_type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class EligibleAccountResponse(BaseSchema):
    """An account eligible for inclusion in a tax period."""

    account_id: int
    account_name: str
    account_type: str
    institution_name: Optional[str] = None
    interest_rate: Optional[str] = None
    account_status: Optional[str] = None
    eligibility_reason: str  # "interest_bearing" | "sold_in_period"
    event_count: int = 0
    tax_return: Optional[TaxReturnResponse] = None
    documents: list[TaxDocumentResponse] = Field(default_factory=list)
