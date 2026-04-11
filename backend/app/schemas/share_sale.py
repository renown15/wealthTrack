"""Schemas for share sale request/response."""
from datetime import datetime
from typing import Any, Optional

from pydantic import Field, field_validator

from app.schemas.base import BaseSchema


class ShareSaleRequest(BaseSchema):
    """Request schema for recording a share sale."""

    shares_account_id: int = Field(..., description="Account ID of the Shares account")
    cash_account_id: int = Field(..., description="Account ID to receive proceeds")
    tax_liability_account_id: int = Field(..., description="Tax Liability account for CGT")
    shares_sold: str = Field(..., description="Number of shares sold")
    sale_price_per_share: str = Field(..., description="Sale price per share in pence")

    @field_validator("shares_sold", mode="before")
    @classmethod
    def coerce_shares_sold_to_str(cls, v: object) -> str:
        """Coerce shares_sold to string if received as number."""
        if isinstance(v, (int, float)):
            return str(int(v))
        return str(v)

    @field_validator("sale_price_per_share", mode="before")
    @classmethod
    def coerce_sale_price_to_str(cls, v: object) -> str:
        """Coerce sale_price_per_share to string if received as number."""
        if isinstance(v, (int, float)):
            return str(int(v))
        return str(v)


class ShareSaleSummaryEvent(BaseSchema):
    """A single event within a share sale group."""

    id: int
    account_id: int
    event_type: str
    value: Optional[str] = None
    created_at: datetime


class ShareSaleSummaryAttribute(BaseSchema):
    """A single attribute within a share sale group."""

    id: int
    account_id: int
    attribute_type: str
    value: Optional[str] = None


class ShareSaleSummary(BaseSchema):
    """Full detail of a recorded share sale, reconstructed from its event group."""

    group_id: int
    sold_at: datetime
    events: list[ShareSaleSummaryEvent]
    attributes: list[ShareSaleSummaryAttribute]
    # Derived fields extracted from events for convenient display
    shares_sold: Optional[str] = None
    proceeds: Optional[str] = None
    cgt: Optional[str] = None
    cash_new_balance: Optional[str] = None
    tax_new_balance: Optional[str] = None
    remaining_shares: Optional[str] = None
    # Stored as attributes in the group
    sale_price_pence: Optional[str] = None
    purchase_price_pence: Optional[str] = None
    capital_gain: Optional[str] = None
    cgt_rate: Optional[str] = None

    @classmethod
    def from_group(cls, group: dict[str, Any]) -> "ShareSaleSummary":
        """Build a ShareSaleSummary from an event_group_repository result dict."""
        events = [ShareSaleSummaryEvent(**e) for e in group["events"]]
        attributes = [ShareSaleSummaryAttribute(**a) for a in group["attributes"]]

        def _event_val(event_type: str) -> Optional[str]:
            for e in events:
                if e.event_type == event_type:
                    return e.value
            return None

        def _attr_val(attr_type: str) -> Optional[str]:
            for a in attributes:
                if a.attribute_type == attr_type:
                    return a.value
            return None

        # Identify cash vs tax Balance Update by finding the Deposit and Liability account IDs
        deposit_account_id = next(
            (e.account_id for e in events if e.event_type == "Deposit"), None
        )
        liability_account_id = next(
            (e.account_id for e in events if e.event_type == "Capital Gains Tax"), None
        )
        balance_events = [e for e in events if e.event_type == "Balance Update"]
        cash_balance = next(
            (e.value for e in balance_events if e.account_id == deposit_account_id), None
        )
        tax_balance = next(
            (e.value for e in balance_events if e.account_id == liability_account_id), None
        )

        return cls(
            group_id=group["group_id"],
            sold_at=group["created_at"],
            events=events,
            attributes=attributes,
            shares_sold=_event_val("Share Sale"),
            proceeds=_event_val("Deposit"),
            cgt=_event_val("Liability"),
            cash_new_balance=cash_balance,
            tax_new_balance=tax_balance,
            remaining_shares=_attr_val("Number of Shares"),
            sale_price_pence=_attr_val("Sale Price Per Share"),
            purchase_price_pence=_attr_val("Purchase Price Per Share"),
            capital_gain=_attr_val("Capital Gain"),
            cgt_rate=_attr_val("CGT Rate"),
        )


class ShareSaleResponse(BaseSchema):
    """Response schema after recording a share sale."""

    shares_sold: str
    sale_price_per_share: str
    proceeds: str
    purchase_price_per_share: str
    capital_gain: str
    cgt_rate: str
    cgt: str
    remaining_shares: Optional[str] = None
    cash_new_balance: str
    tax_liability_new_balance: str
