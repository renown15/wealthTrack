"""
Repository for portfolio data - accounts with balances and institutions.
"""
import logging
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
from app.services.price_service import PriceService
from app.services.deferred_shares_balance_service import DeferredSharesBalanceService
from app.services.deferred_cash_balance_service import DeferredCashBalanceService
from app.services.rsu_balance_service import RSUBalanceService
from app.utils.deferred_shares_calculator import calculate_deferred_shares_balance_safe, calculate_deferred_cash_balance_safe, calculate_rsu_balance_safe

logger = logging.getLogger(__name__)


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
            banking_details = await attr_repo.get_banking_details_for_account(
                account.id, user_id
            )
            interest_rate = await attr_repo.get_attribute_by_name(
                account.id, user_id, "interest_rate"
            )
            fixed_bonus_rate = await attr_repo.get_attribute_by_name(
                account.id, user_id, "fixed_bonus_rate"
            )
            fixed_bonus_rate_end_date = await attr_repo.get_attribute_by_name(
                account.id, user_id, "fixed_bonus_rate_end_date"
            )
            release_date = await attr_repo.get_attribute_by_name(
                account.id, user_id, "release_date"
            )
            number_of_shares = await attr_repo.get_attribute_by_name(
                account.id, user_id, "number_of_shares"
            )
            underlying = await attr_repo.get_attribute_by_name(
                account.id, user_id, "underlying"
            )
            
            # Fetch price for deferred shares from Yahoo Finance
            price = await attr_repo.get_attribute_by_name(
                account.id, user_id, "price"
            )
            purchase_price = await attr_repo.get_attribute_by_name(
                account.id, user_id, "purchase_price"
            )
            
            logger.debug(
                f"[PortfolioRepository] Account {account.name} ({account_type}): "
                f"shares={number_of_shares}, underlying={underlying}, price={price}, purchase_price={purchase_price}"
            )
            
            if account_type == "Deferred Shares" and underlying:
                # Try to fetch fresh price from Yahoo Finance
                fresh_price = await PriceService.fetch_price(underlying)
                if fresh_price:
                    # Update database with fresh price
                    await attr_repo.set_attribute_by_name(
                        account.id, user_id, "price", fresh_price
                    )
                    price = fresh_price
                
                # Calculate and save deferred shares balance daily
                if number_of_shares and price and purchase_price:
                    calculated_balance = calculate_deferred_shares_balance_safe(
                        number_of_shares, price, purchase_price
                    )
                    if calculated_balance is not None:
                        await DeferredSharesBalanceService.save_daily_balance(
                            account.id, user_id, calculated_balance, self.session, price
                        )
            
            # Handle RSU accounts
            if account_type == "RSU" and underlying:
                # Try to fetch fresh price from Yahoo Finance
                fresh_price = await PriceService.fetch_price(underlying)
                if fresh_price:
                    # Update database with fresh price
                    await attr_repo.set_attribute_by_name(
                        account.id, user_id, "price", fresh_price
                    )
                    price = fresh_price
                
                # Calculate and save RSU balance daily (net amount after 47% tax)
                if number_of_shares and price:
                    calculated_balance = calculate_rsu_balance_safe(
                        number_of_shares, price
                    )
                    if calculated_balance is not None:
                        await RSUBalanceService.save_daily_balance(
                            account.id, user_id, calculated_balance, self.session, price
                        )
            
            # Handle Deferred Cash accounts
            if account_type == "Deferred Cash" and latest_balance and latest_balance.value:
                # Calculate deferred cash balance with 47% discount
                try:
                    balance_in_pence = int(float(latest_balance.value) * 100)
                    calculated_balance = calculate_deferred_cash_balance_safe(str(balance_in_pence))
                    if calculated_balance is not None:
                        await DeferredCashBalanceService.save_daily_balance(
                            account.id, user_id, calculated_balance, self.session
                        )
                except (ValueError, TypeError) as e:
                    logger.warning(
                        f"[PortfolioRepository] Failed to calculate deferred cash balance for "
                        f"account {account.id}: {e}"
                    )

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
            # Add fixed/bonus rate from AccountAttribute
            account_payload["fixedBonusRate"] = fixed_bonus_rate
            account_payload["fixedBonusRateEndDate"] = fixed_bonus_rate_end_date
            # Add deferred account fields from AccountAttribute
            account_payload["releaseDate"] = release_date
            account_payload["numberOfShares"] = number_of_shares
            account_payload["underlying"] = underlying
            account_payload["price"] = price
            account_payload["purchasePrice"] = purchase_price

            institution_payload = (
                InstitutionResponse.model_validate(account.institution).model_dump(
                    by_alias=True
                )
                if account.institution
                else None
            )

            # Load parent institution if exists
            if institution_payload and account.institution:
                from app.repositories.institution_group_repository import (
                    InstitutionGroupRepository,
                )

                group_repo = InstitutionGroupRepository(self.session)
                parent_group = await group_repo.get_parent_for_child(
                    account.institution.id, user_id
                )
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
