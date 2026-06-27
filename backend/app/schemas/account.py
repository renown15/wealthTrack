"""
Schemas for account request/response validation.
"""
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import Optional

from pydantic import Field, field_validator

from app.schemas.base import BaseSchema

_NUMERIC_FIELDS = (
    "interest_rate",
    "fixed_bonus_rate",
    "number_of_shares",
    "price",
    "purchase_price",
    "pension_monthly_payment",
    "encumbrance",
    "monthly_cost",
)


def _check_numeric(v: object) -> object:
    if v is None or v == "":
        return v
    try:
        Decimal(str(v))
    except InvalidOperation as exc:
        raise ValueError("must be a valid number") from exc
    return v


class AccountOwnershipTransferRequest(BaseSchema):
    """Schema for transferring account ownership to a family member."""

    target_user_id: int = Field(..., description="UserProfile ID of the new owner")


class AccountCreate(BaseSchema):
    """Schema for creating an account."""

    institution_id: int = Field(..., description="Institution ID")
    name: str = Field(..., min_length=1, max_length=255, description="Account name")
    type_id: int = Field(default=1, description="Account type ID")
    status_id: int = Field(default=1, description="Account status ID")
    account_number: Optional[str] = Field(None, max_length=255, description="Account number")
    sort_code: Optional[str] = Field(None, max_length=255, description="Sort code/Account number")
    roll_ref_number: Optional[str] = Field(None, max_length=255, description="Roll / Ref number")
    interest_rate: Optional[str] = Field(None, max_length=255, description="Interest rate")
    fixed_bonus_rate: Optional[str] = Field(
        None, max_length=255, description="Fixed/Bonus interest rate"
    )
    fixed_bonus_rate_end_date: Optional[str] = Field(
        None, max_length=255, description="Fixed/Bonus rate end date"
    )
    release_date: Optional[str] = Field(
        None, max_length=255, description="Release date for deferred accounts"
    )
    number_of_shares: Optional[str] = Field(
        None, max_length=255, description="Number of shares for deferred shares accounts"
    )
    underlying: Optional[str] = Field(
        None, max_length=255, description="Underlying for deferred shares accounts"
    )
    price: Optional[str] = Field(None, max_length=255, description="Price in pence")
    purchase_price: Optional[str] = Field(
        None, max_length=255, description="Purchase price in pence"
    )
    pension_monthly_payment: Optional[str] = Field(
        None, max_length=255, description="Monthly pension payment amount"
    )
    asset_class: Optional[str] = Field(
        None, max_length=255, description="Asset class (Cash, Single Stock, Equity Index)"
    )
    encumbrance: Optional[str] = Field(
        None, max_length=255, description="Temporary encumbrance amount"
    )
    tax_year: Optional[str] = Field(
        None, max_length=10, description="Tax year (e.g. 2024/25) for Tax Liability accounts"
    )
    renewal_date: Optional[str] = Field(None, max_length=255, description="Renewal date")
    monthly_cost: Optional[str] = Field(None, max_length=255, description="Monthly cost")

    @field_validator(*_NUMERIC_FIELDS, mode="before")
    @classmethod
    def validate_numeric_strings(cls, v: object) -> object:
        return _check_numeric(v)


class AccountUpdate(BaseSchema):
    """Schema for updating an account."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    institution_id: Optional[int] = None
    type_id: Optional[int] = None
    status_id: Optional[int] = None
    account_number: Optional[str] = Field(None, max_length=255, description="Account number")
    sort_code: Optional[str] = Field(None, max_length=255, description="Sort code/Account number")
    roll_ref_number: Optional[str] = Field(None, max_length=255, description="Roll / Ref number")
    interest_rate: Optional[str] = Field(None, max_length=255, description="Interest rate")
    fixed_bonus_rate: Optional[str] = Field(
        None, max_length=255, description="Fixed/Bonus interest rate"
    )
    fixed_bonus_rate_end_date: Optional[str] = Field(
        None, max_length=255, description="Fixed/Bonus rate end date"
    )
    release_date: Optional[str] = Field(
        None, max_length=255, description="Release date for deferred accounts"
    )
    number_of_shares: Optional[str] = Field(
        None, max_length=255, description="Number of shares for deferred shares accounts"
    )
    underlying: Optional[str] = Field(
        None, max_length=255, description="Underlying for deferred shares accounts"
    )
    price: Optional[str] = Field(None, max_length=255, description="Price in pence")
    purchase_price: Optional[str] = Field(
        None, max_length=255, description="Purchase price in pence"
    )
    pension_monthly_payment: Optional[str] = Field(
        None, max_length=255, description="Monthly pension payment amount"
    )
    asset_class: Optional[str] = Field(
        None, max_length=255, description="Asset class (Cash, Single Stock, Equity Index)"
    )
    encumbrance: Optional[str] = Field(
        None, max_length=255, description="Temporary encumbrance amount"
    )
    new_gross_balance: Optional[str] = Field(
        None,
        max_length=255,
        description="New gross balance when re-applying encumbrance after balance edit",
    )
    tax_year: Optional[str] = Field(
        None, max_length=10, description="Tax year for Tax Liability accounts"
    )
    renewal_date: Optional[str] = Field(None, max_length=255, description="Renewal date")
    monthly_cost: Optional[str] = Field(None, max_length=255, description="Monthly cost")

    @field_validator(*_NUMERIC_FIELDS, mode="before")
    @classmethod
    def validate_numeric_strings(cls, v: object) -> object:
        return _check_numeric(v)


class AccountTransferRequest(BaseSchema):
    """Request body for the close-and-transfer operation."""

    target_account_id: int = Field(..., description="Target account to receive the balance")


class AccountResponse(BaseSchema):
    """Schema for account response."""

    id: int
    user_id: int
    institution_id: int
    name: str
    type_id: int
    status_id: int
    account_number: Optional[str] = None
    sort_code: Optional[str] = None
    roll_ref_number: Optional[str] = None
    interest_rate: Optional[str] = None
    fixed_bonus_rate: Optional[str] = None
    fixed_bonus_rate_end_date: Optional[str] = None
    release_date: Optional[str] = None
    number_of_shares: Optional[str] = None
    underlying: Optional[str] = None
    price: Optional[str] = None
    purchase_price: Optional[str] = None
    pension_monthly_payment: Optional[str] = None
    asset_class: Optional[str] = None
    encumbrance: Optional[str] = None
    unencumbered_balance: Optional[str] = None
    tax_year: Optional[str] = None
    renewal_date: Optional[str] = None
    monthly_cost: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
