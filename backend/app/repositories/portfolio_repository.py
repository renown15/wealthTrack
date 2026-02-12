"""
Repository for portfolio data - accounts with balances and institutions.
"""
from typing import Any, Optional

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.account import Account
from app.models.account_event import AccountEvent
from app.models.reference_data import ReferenceData
from app.repositories.account_attribute_repository import AccountAttributeRepository
from app.schemas.account import AccountResponse
from app.schemas.institution import InstitutionResponse


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
            .where(Account.user_id == user_id)
            .options(selectinload(Account.institution))
            .order_by(Account.created_at.desc())
        )
        result = await self.session.execute(stmt)
        accounts = result.scalars().all()

        # Enrich with latest balance for each
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
                select(ReferenceData.reference_value)
                .where(ReferenceData.id == account.type_id)
            )
            type_result = await self.session.execute(type_stmt)
            account_type = type_result.scalar_one_or_none() or 'Unknown'

            # Count related account events
            event_count_stmt = (
                select(func.count(AccountEvent.id))  # pylint: disable=not-callable
                .where(AccountEvent.account_id == account.id)
                .where(AccountEvent.user_id == user_id)
            )
            event_count_result = await self.session.execute(event_count_stmt)
            event_count = event_count_result.scalar_one() or 0

            # Get opened/closed dates from AccountAttribute
            attr_repo = AccountAttributeRepository(self.session)
            dates = await attr_repo.get_dates_for_account(account.id, user_id)
            banking_details = await attr_repo.get_banking_details_for_account(account.id, user_id)
            interest_rate = await attr_repo.get_attribute_by_name(account.id, user_id, "interest_rate")

            account_payload = AccountResponse.model_validate(account).model_dump(by_alias=True)
            # Add dates from AccountAttribute
            account_payload["openedAt"] = dates.get("openedAt")
            account_payload["closedAt"] = dates.get("closedAt")
            # Add banking details from AccountAttribute
            account_payload["accountNumber"] = banking_details.get("accountNumber")
            account_payload["sortCode"] = banking_details.get("sortCode")
            account_payload["rollRefNumber"] = banking_details.get("rollRefNumber")
            # Add interest rate from AccountAttribute
            account_payload["interestRate"] = interest_rate

            institution_payload = (
                InstitutionResponse.model_validate(account.institution).model_dump(by_alias=True)
                if account.institution
                else None
            )
            
            # Load parent institution if exists
            if institution_payload and account.institution:
                from app.repositories.institution_group_repository import InstitutionGroupRepository
                group_repo = InstitutionGroupRepository(self.session)
                parent_group = await group_repo.get_parent_for_child(account.institution.id, user_id)
                if parent_group:
                    institution_payload["parentId"] = parent_group.parent_institution_id

            # Build latest balance payload manually since we need to resolve type_id to event_type
            latest_balance_payload = None
            if latest_balance:
                # Look up event type name from ReferenceData
                event_type_stmt = (
                    select(ReferenceData.reference_value)
                    .where(ReferenceData.id == latest_balance.type_id)
                )
                event_type_result = await self.session.execute(event_type_stmt)
                event_type_name = event_type_result.scalar_one_or_none() or "Event"

                latest_balance_payload = {
                    "id": latest_balance.id,
                    "accountId": latest_balance.account_id,
                    "userId": latest_balance.user_id,
                    "eventType": event_type_name,
                    "value": latest_balance.value,
                    "createdAt": (
                        latest_balance.created_at.isoformat()
                        if latest_balance.created_at
                        else None
                    ),
                    "updatedAt": (
                        latest_balance.updated_at.isoformat()
                        if latest_balance.updated_at
                        else None
                    ),
                }

            portfolio_item: dict[str, Any] = {
                "account": account_payload,
                "institution": institution_payload,
                "latestBalance": latest_balance_payload,
                "accountType": account_type,
                "eventCount": event_count,
            }
            portfolio.append(portfolio_item)

        return portfolio

    async def get_account_current_balance(
        self, account_id: int, user_id: int
    ) -> Optional[str]:
        """Get the most recent balance value for an account."""
        stmt = (
            select(AccountEvent.value)
            .where(AccountEvent.account_id == account_id)
            .where(AccountEvent.user_id == user_id)
            .order_by(desc(AccountEvent.created_at))
            .limit(1)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
