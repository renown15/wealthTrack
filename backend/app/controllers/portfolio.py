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
from app.schemas.portfolio import PortfolioResponse

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("", response_model=PortfolioResponse)
async def get_user_portfolio(
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Get user's portfolio with all accounts, institutions, and latest balances.

    This is the primary endpoint for dashboard/portfolio views.
    Returns accounts with their associated institutions and current balances.
    """
    repo = PortfolioRepository(session)
    items = await repo.get_user_portfolio(current_user.id)
    total_value = 0.0
    last_price_update = None
    for item in items:
        # Get the latest balance value from the portfolio item
        balance = item.get("latestBalance")
        if not balance:
            continue
        value = balance.get("value")
        if value is None:
            continue
        try:
            val = float(value)
            # Negate Tax Liability accounts (they are liabilities, not assets)
            if item.get("accountType") == "Tax Liability":
                val = -val
            total_value += val
        except (TypeError, ValueError):
            continue
        
        # Track the latest price update across all accounts
        account = item.get("account", {})
        if account.get("updatedAt"):
            if last_price_update is None or account.get("updatedAt") > last_price_update:
                last_price_update = account.get("updatedAt")
    
    return {
        "items": items,
        "total_value": total_value,
        "account_count": len(items),
        "last_price_update": last_price_update.isoformat() if last_price_update else None,
    }
