"""
Schemas for the portfolio/dashboard response.
"""
from typing import Any, Optional

from app.schemas.base import BaseSchema


class PortfolioResponse(BaseSchema):
    """Schema describing the portfolio payload returned to the frontend."""

    items: list[Any]
    total_value: float
    account_count: int
    last_price_update: Optional[str] = None  # ISO format datetime string
