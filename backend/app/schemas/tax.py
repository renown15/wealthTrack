"""
Schemas for tax period, return, and document endpoints.
"""
from datetime import date, datetime
from typing import Optional

from pydantic import Field, model_validator

from app.schemas.base import BaseSchema


class TaxPeriodCreate(BaseSchema):
    """Create a new tax period."""

    name: str = Field(..., min_length=1, max_length=255)
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def end_after_start(self) -> "TaxPeriodCreate":
        """Validate end_date is after start_date."""
        if self.end_date <= self.start_date:
            raise ValueError("end_date must be after start_date")
        return self


class TaxPeriodUpdate(BaseSchema):
    """Update editable fields on a tax period (currently the commentary)."""

    commentary: Optional[str] = None


class TaxPeriodResponse(BaseSchema):
    """Tax period response."""

    id: int
    user_id: int
    name: str
    start_date: date
    end_date: date
    commentary: Optional[str] = None
    account_group_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaxReturnUpsert(BaseSchema):
    """Upsert tax return values for an account in a period."""

    income: Optional[float] = None
    capital_gain: Optional[float] = None
    tax_taken_off: Optional[float] = None
    # Free-text label/comment, stored as the account's "Notes" attribute
    comment: Optional[str] = Field(default=None, max_length=500)


class TaxScopeUpdate(BaseSchema):
    """Set or clear the scope override and note for an account in a period."""

    # tax_scope_status reference value (e.g. "Out of Scope"); None clears the override
    scope: Optional[str] = None
    note: Optional[str] = Field(default=None, max_length=500)


class TaxReturnResponse(BaseSchema):
    """Tax return response."""

    id: int
    account_id: int
    tax_period_id: int
    income: Optional[float] = None
    capital_gain: Optional[float] = None
    tax_taken_off: Optional[float] = None  # tax withheld at source (currently always 0)
    tax_due: Optional[float] = None  # estimated tax owed (CGT + dividend provision)
    scope: Optional[str] = None  # resolved tax_scope_status value; None = derived
    note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaxDocumentResponse(BaseSchema):
    """Tax document metadata response (no file_data)."""

    id: int
    tax_return_id: int
    filename: str
    description: Optional[str] = None
    content_type: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TaxDocumentLibraryItem(BaseSchema):
    """A tax document with its account and period labels (hub-level library)."""

    id: int
    tax_return_id: int
    filename: str
    description: Optional[str] = None
    content_type: Optional[str] = None
    created_at: datetime
    account_name: str
    period_name: str


class EligibleAccountResponse(BaseSchema):
    """An account eligible for inclusion in a tax period."""

    account_id: int
    account_name: str
    account_type: str
    institution_name: Optional[str] = None
    interest_rate: Optional[str] = None
    account_status: Optional[str] = None
    account_number: Optional[str] = None
    sort_code: Optional[str] = None
    roll_ref_number: Optional[str] = None
    eligibility_reason: str  # "interest_bearing" | "sold_in_period" | "in_scope"
    event_count: int = 0
    first_balance_date: Optional[date] = None
    comment: Optional[str] = None  # account "Notes" attribute; free-text label
    tax_return: Optional[TaxReturnResponse] = None
    documents: list[TaxDocumentResponse] = Field(default_factory=list)


class TaxPeriodAccountsResponse(BaseSchema):
    """Two-section response for eligible accounts in a tax period."""

    account_group_id: Optional[int] = None
    in_scope: list[EligibleAccountResponse] = Field(default_factory=list)
    eligible: list[EligibleAccountResponse] = Field(default_factory=list)
    tax_free: list[EligibleAccountResponse] = Field(default_factory=list)
    not_in_scope: list[EligibleAccountResponse] = Field(default_factory=list)
