"""Schemas for share sale request/response."""
from typing import Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class ShareSaleRequest(BaseSchema):
    """Request schema for recording a share sale."""

    shares_account_id: int = Field(..., description="Account ID of the Shares account")
    cash_account_id: int = Field(..., description="Account ID to receive proceeds")
    tax_liability_account_id: int = Field(..., description="Tax Liability account for CGT")
    shares_sold: str = Field(..., description="Number of shares sold")
    sale_price_per_share: str = Field(..., description="Sale price per share in pence")


class ShareSaleResponse(BaseSchema):
    """Response schema after recording a share sale."""

    shares_sold: str
    sale_price_per_share: str
    proceeds: str
    purchase_price_per_share: str
    cgt: str
    remaining_shares: Optional[str]
    cash_new_balance: str
    tax_liability_new_balance: str
