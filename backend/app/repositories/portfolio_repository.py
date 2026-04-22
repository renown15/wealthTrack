"""
Repository for portfolio data - accounts with balances and institutions.
"""
import logging
from typing import Any

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.account import Account
from app.models.account_document import AccountDocument
from app.models.account_event import AccountEvent
from app.models.reference_data import ReferenceData
from app.repositories.account_attribute_repository import AccountAttributeRepository
from app.repositories.account_processor import AccountProcessor
from app.repositories.institution_group_repository import InstitutionGroupRepository
from app.repositories.portfolio_builders import (
    build_attributes_dict,
    build_portfolio_item,
    fetch_target_prices,
)

logger = logging.getLogger(__name__)


class PortfolioRepository:
    """Handles portfolio read operations - accounts with current balances."""

    def __init__(self, session: AsyncSession):
        """Initialize with database session."""
        self.session = session

    async def get_user_portfolio(self, user_id: int) -> list[dict[str, Any]]:
        """
        Get all user accounts with latest balances and institutions.

        Uses batched queries to avoid N+1: total DB round-trips is O(1) regardless
        of account count (7 queries + optional price fetches for Deferred Shares/RSU).
        """
        # 1. All accounts with their institutions
        stmt = (
            select(Account)
            .where(Account.user_id == user_id)
            .options(selectinload(Account.institution))
            .order_by(Account.created_at.desc())
        )
        result = await self.session.execute(stmt)
        accounts = result.scalars().all()

        if not accounts:
            return []

        account_ids = [a.id for a in accounts]

        # 2. Latest Balance Update event per account
        # Only consider "Balance Update" events — not Win/Interest/Dividend which are
        # transactions, not balance snapshots.
        balance_update_type_stmt = select(ReferenceData.id).where(
            ReferenceData.class_key == "account_event_type",
            ReferenceData.reference_value == "Balance Update",
        )
        balance_update_type_id = (
            await self.session.execute(balance_update_type_stmt)
        ).scalar_one_or_none()

        max_created_subq = (
            select(
                AccountEvent.account_id,
                func.max(AccountEvent.created_at).label("max_created_at"),
            )
            .where(AccountEvent.account_id.in_(account_ids))
            .where(AccountEvent.type_id == balance_update_type_id)
            .group_by(AccountEvent.account_id)
            .subquery()
        )
        balance_stmt = select(AccountEvent).join(
            max_created_subq,
            (AccountEvent.account_id == max_created_subq.c.account_id)
            & (AccountEvent.created_at == max_created_subq.c.max_created_at),
        )
        balance_result = await self.session.execute(balance_stmt)
        balances_by_account: dict[int, AccountEvent] = {
            b.account_id: b for b in balance_result.scalars().all()
        }

        # 3. Event counts per account (one GROUP BY query instead of N queries)
        count_stmt = (
            select(
                AccountEvent.account_id,
                func.count(AccountEvent.id).label("cnt"),  # pylint: disable=not-callable
            )
            .where(AccountEvent.account_id.in_(account_ids))
            .where(AccountEvent.user_id == user_id)
            .group_by(AccountEvent.account_id)
        )
        count_result = await self.session.execute(count_stmt)
        event_counts: dict[int, int] = {row.account_id: row.cnt for row in count_result.all()}

        # 4. Account type labels (one IN query instead of N queries)
        type_ids = list({a.type_id for a in accounts})
        type_stmt = select(ReferenceData.id, ReferenceData.reference_value).where(
            ReferenceData.id.in_(type_ids)
        )
        type_result = await self.session.execute(type_stmt)
        types_by_id: dict[int, str] = {row.id: row.reference_value for row in type_result.all()}

        # 5. All attributes for all accounts (one IN query instead of N*26 queries)
        attr_repo = AccountAttributeRepository(self.session)
        all_raw_attrs = await attr_repo.get_all_attributes_for_accounts(account_ids, user_id)

        # 6. Institution group parents for all institutions (one IN query instead of N queries)
        institution_ids = [a.institution.id for a in accounts if a.institution]
        grp_repo = InstitutionGroupRepository(self.session)
        parents_by_institution = await grp_repo.get_parents_for_children(institution_ids, user_id)

        # 7. Event type labels for latest balances (one IN query instead of N queries)
        balance_type_ids = list({b.type_id for b in balances_by_account.values() if b.type_id})
        event_type_by_id: dict[int, str] = {}
        if balance_type_ids:
            event_type_stmt = select(ReferenceData.id, ReferenceData.reference_value).where(
                ReferenceData.id.in_(balance_type_ids)
            )
            event_type_result = await self.session.execute(event_type_stmt)
            event_type_by_id = {row.id: row.reference_value for row in event_type_result.all()}

        # Document counts per account (one GROUP BY query)
        doc_count_stmt = (
            select(AccountDocument.account_id, func.count(AccountDocument.id).label("cnt"))  # pylint: disable=not-callable
            .where(AccountDocument.account_id.in_(account_ids))
            .where(AccountDocument.user_id == user_id)
            .group_by(AccountDocument.account_id)
        )
        doc_count_result = await self.session.execute(doc_count_stmt)
        doc_counts: dict[int, int] = {row.account_id: row.cnt for row in doc_count_result.all()}

        target_prices_by_ticker = await fetch_target_prices(self.session)
        # Pass 1: run type-specific processors (may write new Balance Update events)
        # Processors must run before we build portfolio items so fresh balances are available.
        account_computed: dict[int, tuple[str, dict[str, Any], int, int]] = {}
        for account in accounts:
            old_balance = balances_by_account.get(account.id)
            account_type = types_by_id.get(account.type_id, "Unknown")
            event_count = event_counts.get(account.id, 0)
            doc_count = doc_counts.get(account.id, 0)
            attributes = build_attributes_dict(all_raw_attrs.get(account.id, {}))

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
            elif account_type == "Shares":
                attrs = {
                    "number_of_shares": attributes["number_of_shares"],
                    "underlying": attributes["underlying"],
                    "price": attributes["price"],
                    "purchase_price": attributes["purchase_price"],
                }
                attributes["price"] = await AccountProcessor.process_shares_account(
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
                    attr_repo, account.id, user_id, old_balance, self.session
                )
            account_computed[account.id] = (account_type, attributes, event_count, doc_count)

        # Re-fetch balances so processors' newly-written Balance Updates are visible.
        balances_by_account = {
            b.account_id: b for b in (await self.session.execute(balance_stmt)).scalars().all()
        }

        # Pass 2: build portfolio items with fresh balances
        portfolio: list[dict[str, Any]] = []
        for account in accounts:
            account_type, attributes, event_count, doc_count = account_computed[account.id]
            portfolio_data = {
                "account": account,
                "account_type": account_type,
                "attributes": attributes,
                "latest_balance": balances_by_account.get(account.id),
                "event_count": event_count,
                "doc_count": doc_count,
                "parents_by_institution": parents_by_institution,
                "event_type_by_id": event_type_by_id,
                "target_prices_by_ticker": target_prices_by_ticker,
            }
            portfolio_item = await build_portfolio_item(portfolio_data, self.session)
            portfolio.append(portfolio_item)

        return portfolio

    async def get_account_current_balance(self, account_id: int, user_id: int) -> str | None:
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
