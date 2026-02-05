"""
Controller for portfolio/dashboard endpoints.
"""
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.repositories.portfolio_repository import PortfolioRepository

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("", response_model=list[dict[str, Any]])
async def get_user_portfolio(
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """
    Get user's portfolio with all accounts, institutions, and latest balances.

    This is the primary endpoint for dashboard/portfolio views.
    Returns accounts with their associated institutions and current balances.
    """
    repo = PortfolioRepository(session)
    portfolio = await repo.get_user_portfolio(current_user.id)
    return portfolio
