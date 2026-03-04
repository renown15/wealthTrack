"""
Controller for analytics endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.repositories.analytics_repository import AnalyticsRepository
from app.schemas.analytics import HistoryPoint, PortfolioBreakdown, PortfolioHistory

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/breakdown", response_model=PortfolioBreakdown)
async def get_portfolio_breakdown(
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> PortfolioBreakdown:
    """Current portfolio breakdown by account type and institution."""
    repo = AnalyticsRepository(session)
    data = await repo.get_portfolio_breakdown(current_user.id)
    return PortfolioBreakdown(**data)


@router.get("/portfolio-history", response_model=PortfolioHistory)
async def get_portfolio_history(
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> PortfolioHistory:
    """
    Daily portfolio value from the earliest balance record to today.
    Each account's balance carries forward unchanged until the next record is written.
    Returns baseline_date (from reference data) for UI date range selection.
    Range filtering is done client-side.
    """
    repo = AnalyticsRepository(session)
    data = await repo.get_portfolio_history(current_user.id)
    return PortfolioHistory(
        baseline_date=data.get("baseline_date"),
        history=[HistoryPoint(**p) for p in data.get("history", [])],
    )
