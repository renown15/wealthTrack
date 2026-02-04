"""
Repository for portfolio data - accounts with balances and institutions.
"""
from typing import Any, Optional

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.account import Account
from app.models.account_event import AccountEvent


class PortfolioRepository:
    """Handles portfolio read operations - accounts with current balances."""

    def __init__(self, session: AsyncSession):
        """Initialize with database session."""
        self.session = session

    async def get_user_portfolio(self, user_id: int) -> list[dict[str, Any]]:
        """
        Get all user accounts with latest balances and institutions.

        Returns list of dicts with account, institution, and latest balance info.
        """
        # Get all accounts with institutions
        stmt = (
            select(Account)
            .where(Account.userid == user_id)
            .options(selectinload(Account.institution))
            .order_by(Account.created_at.desc())
        )
        result = await self.session.execute(stmt)
        accounts = result.scalars().all()

        # Enrich with latest balance for each
        portfolio = []
        for account in accounts:
            # Get latest balance event
            balance_stmt = (
                select(AccountEvent)
                .where(AccountEvent.accountid == account.id)
                .order_by(desc(AccountEvent.created_at))
                .limit(1)
            )
            balance_result = await self.session.execute(balance_stmt)
            latest_balance = balance_result.scalar_one_or_none()

            portfolio.append(
                {
                    "account": account,
                    "institution": account.institution,
                    "latest_balance": latest_balance,
                }
            )

        return portfolio

    async def get_account_current_balance(
        self, account_id: int, user_id: int
    ) -> Optional[str]:
        """Get the most recent balance value for an account."""
        stmt = (
            select(AccountEvent.value)
            .where(AccountEvent.accountid == account_id)
            .where(AccountEvent.userid == user_id)
            .order_by(desc(AccountEvent.created_at))
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
