"""
Schemas for analytics endpoints.
"""
from pydantic import BaseModel


class BreakdownItem(BaseModel):
    """A labelled value for a breakdown chart."""
    label: str
    value: float


class PortfolioBreakdown(BaseModel):
    """Current portfolio breakdown by account type, institution and asset class."""
    by_type: list[BreakdownItem]
    by_institution: list[BreakdownItem]
    by_asset_class: list[BreakdownItem]
    total: float


class HistoryPoint(BaseModel):
    """Portfolio total value on a single day."""
    date: str        # "YYYY-MM-DD"
    total_value: float


class PortfolioHistory(BaseModel):
    """Daily portfolio value history from the earliest balance record to today."""
    baseline_date: str | None  # "YYYY-MM-DD" or null if not set
    history: list[HistoryPoint]
