"""
Schemas for analytics endpoints.
"""
from pydantic import BaseModel


class BreakdownItem(BaseModel):
    """A labelled value for a breakdown chart."""
    label: str
    value: float


class PortfolioBreakdown(BaseModel):
    """Current portfolio breakdown by account type and institution."""
    by_type: list[BreakdownItem]
    by_institution: list[BreakdownItem]
    total: float


class HistoryPoint(BaseModel):
    """Portfolio total value on a single day."""
    date: str        # "YYYY-MM-DD"
    total_value: float


class PortfolioHistory(BaseModel):
    """Daily portfolio value history from the earliest balance record to today."""
    history: list[HistoryPoint]
