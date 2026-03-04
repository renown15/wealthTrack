"""
Schemas for account request/response validation.
"""
from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class AccountCreate(BaseSchema):
    """Schema for creating an account."""

    institution_id: int = Field(..., description="Institution ID")
    name: str = Field(..., min_length=1, max_length=255, description="Account name")
    type_id: int = Field(default=1, description="Account type ID")
    status_id: int = Field(default=1, description="Account status ID")
    account_number: Optional[str] = Field(
        None, max_length=255, description="Account number"
    )
    sort_code: Optional[str] = Field(
        None, max_length=255, description="Sort code/Account number"
    )
    roll_ref_number: Optional[str] = Field(
        None, max_length=255, description="Roll / Ref number"
    )
    interest_rate: Optional[str] = Field(
        None, max_length=255, description="Interest rate"
    )
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
    price: Optional[str] = Field(
        None, max_length=255, description="Price in pence"
    )
    purchase_price: Optional[str] = Field(
        None, max_length=255, description="Purchase price in pence"
    )
    pension_monthly_payment: Optional[str] = Field(
        None, max_length=255, description="Monthly pension payment amount"
    )
    asset_class: Optional[str] = Field(
        None, max_length=255, description="Asset class (Cash, Single Stock, Equity Index)"
    )


class AccountUpdate(BaseSchema):
    """Schema for updating an account."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type_id: Optional[int] = None
    status_id: Optional[int] = None
    account_number: Optional[str] = Field(
        None, max_length=255, description="Account number"
    )
    sort_code: Optional[str] = Field(
        None, max_length=255, description="Sort code/Account number"
    )
    roll_ref_number: Optional[str] = Field(
        None, max_length=255, description="Roll / Ref number"
    )
    interest_rate: Optional[str] = Field(
        None, max_length=255, description="Interest rate"
    )
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
    price: Optional[str] = Field(
        None, max_length=255, description="Price in pence"
    )
    purchase_price: Optional[str] = Field(
        None, max_length=255, description="Purchase price in pence"
    )
    pension_monthly_payment: Optional[str] = Field(
        None, max_length=255, description="Monthly pension payment amount"
    )
    asset_class: Optional[str] = Field(
        None, max_length=255, description="Asset class (Cash, Single Stock, Equity Index)"
    )


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
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
