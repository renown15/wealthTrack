"""
Repository for portfolio data - accounts with balances and institutions.
"""
import logging
from typing import Any

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.account import Account
from app.models.account_event import AccountEvent
from app.models.reference_data import ReferenceData
from app.repositories.account_attribute_repository import AccountAttributeRepository
from app.repositories.account_processor import AccountProcessor
from app.repositories.portfolio_builders import build_portfolio_item

logger = logging.getLogger(__name__)


class PortfolioRepository:
    """Handles portfolio read operations - accounts with current balances."""

    def __init__(self, session: AsyncSession):
        """Initialize with database session."""
        self.session = session

    async def _fetch_account_attributes(
        self, attr_repo: AccountAttributeRepository, account_id: int, user_id: int
    ) -> dict[str, Any]:
        """Fetch all account attributes."""
        get_attr = attr_repo.get_attribute_by_name
        return {
            "dates": await attr_repo.get_dates_for_account(account_id, user_id),
            "banking_details": await attr_repo.get_banking_details_for_account(
                account_id, user_id
            ),
            "interest_rate": await get_attr(account_id, user_id, "interest_rate"),
            "fixed_bonus_rate": await get_attr(
                account_id, user_id, "fixed_bonus_rate"
            ),
            "fixed_bonus_rate_end_date": await get_attr(
                account_id, user_id, "fixed_bonus_rate_end_date"
            ),
            "release_date": await get_attr(account_id, user_id, "release_date"),
            "number_of_shares": await get_attr(
                account_id, user_id, "number_of_shares"
            ),
            "underlying": await get_attr(account_id, user_id, "underlying"),
            "price": await get_attr(account_id, user_id, "price"),
            "purchase_price": await get_attr(
                account_id, user_id, "purchase_price"
            ),
        }

    async def get_user_portfolio(self, user_id: int) -> list[dict[str, Any]]:
        """
        Get all user accounts with latest balances and institutions.

        Returns list of dicts with account, institution, and latest balance info.
        """
        stmt = (
            select(Account)
            .where(Account.user_id == user_id)
            .options(selectinload(Account.institution))
            .order_by(Account.created_at.desc())
        )
        result = await self.session.execute(stmt)
        accounts = result.scalars().all()

        portfolio: list[dict[str, Any]] = []
        for account in accounts:
            # Get latest balance event
            balance_stmt = (
                select(AccountEvent)
                .where(AccountEvent.account_id == account.id)
                .order_by(desc(AccountEvent.created_at))
                .limit(1)
            )
            balance_result = await self.session.execute(balance_stmt)
            latest_balance = balance_result.scalar_one_or_none()

            # Get readable account type label
            type_stmt = (
                select(ReferenceData.reference_value).where(
                    ReferenceData.id == account.type_id
                )
            )
            type_result = await self.session.execute(type_stmt)
            account_type = type_result.scalar_one_or_none() or "Unknown"

            # Count related account events
            event_count_stmt = (
                select(func.count(AccountEvent.id))  # pylint: disable=not-callable
                .where(AccountEvent.account_id == account.id)
                .where(AccountEvent.user_id == user_id)
            )
            event_count_result = await self.session.execute(event_count_stmt)
            event_count = event_count_result.scalar_one() or 0

            # Get all account attributes
            attr_repo = AccountAttributeRepository(self.session)
            attributes = await self._fetch_account_attributes(
                attr_repo, account.id, user_id
            )

            # Process account type-specific logic
            if account_type == "Deferred Shares":
                attrs = {
                    "number_of_shares": attributes["number_of_shares"],
                    "underlying": attributes["underlying"],
                    "price": attributes["price"],
                    "purchase_price": attributes["purchase_price"],
                }
                attributes["price"] = await AccountProcessor.process_deferred_shares_account(
                    attr_repo, account.id, user_id, attrs, self.session
                )
            elif account_type == "RSU":
                attrs = {
                    "number_of_shares": attributes["number_of_shares"],
                    "underlying": attributes["underlying"],
                    "price": attributes["price"],
                }
                attributes["price"] = await AccountProcessor.process_rsu_account(
                    attr_repo, account.id, user_id, attrs, self.session
                )
            elif account_type == "Deferred Cash":
                await AccountProcessor.process_deferred_cash_account(
                    attr_repo, account.id, user_id, latest_balance, self.session
                )

            # Build and add portfolio item
            portfolio_data = {
                "account": account,
                "account_type": account_type,
                "attributes": attributes,
                "latest_balance": latest_balance,
                "event_count": event_count,
            }
            portfolio_item = await build_portfolio_item(portfolio_data, self.session)
            portfolio.append(portfolio_item)

        return portfolio

    async def get_account_current_balance(
        self, account_id: int, user_id: int
    ) -> str | None:
        """Get current balance for an account."""
        stmt = (
            select(AccountEvent.value)
            .where(AccountEvent.account_id == account_id)
            .where(AccountEvent.user_id == user_id)
            .order_by(desc(AccountEvent.created_at))
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
