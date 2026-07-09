"""Schemas for outgoing actual costs and provision projections."""
from datetime import date
from decimal import Decimal, InvalidOperation

from pydantic import Field, field_validator

from app.schemas.base import BaseSchema


class ActualCostCreate(BaseSchema):
    """Request body for recording a historic actual cost on an outgoing."""

    amount: str = Field(..., description="Actual cost for the period in GBP")
    cost_date: date = Field(..., description="Date the cost was incurred (period anchor)")

    @field_validator("amount", mode="before")
    @classmethod
    def validate_amount(cls, v: object) -> object:
        """Reject non-numeric amounts."""
        try:
            Decimal(str(v))
        except InvalidOperation as exc:
            raise ValueError("must be a valid number") from exc
        return v


class ActualCostItem(BaseSchema):
    """A recorded actual cost (one per renewal period)."""

    group_id: int
    account_id: int
    amount: str
    cost_date: str


class OutgoingProjection(BaseSchema):
    """Projected per-period cost for an outgoing, derived from actuals."""

    account_id: int
    projected_cost: str
    actuals_count: int
