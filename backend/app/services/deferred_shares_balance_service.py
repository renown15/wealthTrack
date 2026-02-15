"""Service for managing deferred shares balance snapshots."""

import logging
from datetime import datetime, date

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account_attribute import AccountAttribute
from app.models.account_event import AccountEvent
from app.models.reference_data import ReferenceData
from app.repositories.account_attribute_repository import AccountAttributeRepository

logger = logging.getLogger(__name__)


class DeferredSharesBalanceService:
    """Service for saving and managing deferred shares balance snapshots."""

    @staticmethod
    async def save_daily_balance(
        account_id: int,
        user_id: int,
        balance_value: float,
        session: AsyncSession,
        price: str | None = None,
    ) -> bool:
        """.
        Save deferred shares balance as account attribute.
        
        Only saves if no balance has been recorded for this account today.
        
        Args:
            account_id: Account ID
            user_id: User ID
            balance_value: Balance in pounds (float)
            session: Database session
            price: Optional price used in calculation (to be persisted)
            
        Returns:
            True if balance was saved, False if already saved today
        """
        try:
            # Convert balance to string with 2 decimal places
            balance_str = f"{balance_value:.2f}"
            
            # Get "Deferred Shares Balance" attribute type ID using the repository method
            repo = AccountAttributeRepository(session)
            attr_type_id = await repo.get_attribute_type_id("deferred_shares_balance")

            if not attr_type_id:
                logger.warning(
                    "[DeferredSharesBalanceService] 'Deferred Shares Balance' attribute type not found"
                )
                return False

            # Check if balance was already saved today
            today = date.today()
            today_start = datetime.combine(today, datetime.min.time())
            
            # Check if balance event already exists for today
            balance_event_stmt = select(AccountEvent).where(
                and_(
                    AccountEvent.account_id == account_id,
                    AccountEvent.user_id == user_id,
                    AccountEvent.created_at >= today_start,
                )
            ).order_by(AccountEvent.created_at.desc()).limit(1)
            balance_event_result = await session.execute(balance_event_stmt)
            existing_event = balance_event_result.scalar_one_or_none()

            if existing_event:
                logger.debug(
                    f"[DeferredSharesBalanceService] Balance event already saved today for "
                    f"account {account_id}: £{existing_event.value}"
                )
                return False
            
            # Create AccountEvent for the calculated balance
            # Get "Balance Update" event type ID
            event_type_stmt = select(ReferenceData.id).where(
                and_(
                    ReferenceData.class_key == "account_event_type",
                    ReferenceData.reference_value == "Balance Update",
                )
            )
            event_type_result = await session.execute(event_type_stmt)
            event_type_id = event_type_result.scalar_one_or_none()

            if not event_type_id:
                logger.warning(
                    "[DeferredSharesBalanceService] 'Balance Update' event type not found"
                )
                return False
            
            # Create the balance event
            balance_event = AccountEvent(
                account_id=account_id,
                user_id=user_id,
                type_id=event_type_id,
                value=balance_str,
            )
            session.add(balance_event)
            await session.flush()

            # Also save as an attribute for historical tracking
            await repo.set_attribute(
                account_id,
                user_id,
                attr_type_id,
                balance_str,
            )
            
            # Update price if provided
            if price:
                await repo.set_attribute_by_name(
                    account_id,
                    user_id,
                    "price",
                    price,
                )
            
            logger.info(
                f"[DeferredSharesBalanceService] Saved deferred shares balance for "
                f"account {account_id}: £{balance_str}"
            )
            return True

        except Exception as e:
            logger.error(
                f"[DeferredSharesBalanceService] Error saving balance for account {account_id}: {e}"
            )
            return False
