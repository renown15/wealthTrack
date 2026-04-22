"""Service for managing Shares balance snapshots."""

import logging
from datetime import date, datetime

from sqlalchemy import and_, select

from app.models.account_event import AccountEvent
from app.models.reference_data import ReferenceData
from app.repositories.account_attribute_repository import AccountAttributeRepository

logger = logging.getLogger(__name__)


class SharesBalanceService:
    """Service for saving and managing Shares balance snapshots."""

    def __init__(self, repo: AccountAttributeRepository) -> None:
        """Initialize with repository dependency."""
        self.repo = repo
        self.session = repo.session

    async def save_daily_balance(
        self,
        account_id: int,
        user_id: int,
        balance_value: float,
        price: str | None = None,
    ) -> bool:
        """
        Save Shares balance as account attribute.

        Only saves if no balance has been recorded for this account today.

        Args:
            account_id: Account ID
            user_id: User ID
            balance_value: Balance in pounds (float)
            price: Optional price used in calculation (to be persisted)

        Returns:
            True if balance was saved, False if already saved today
        """
        try:
            balance_str = f"{balance_value:.2f}"

            attr_type_id = await self.repo.get_attribute_type_id("shares_balance")

            if not attr_type_id:
                logger.warning("[SharesBalanceService] 'Shares Balance' attribute type not found")
                return False

            today = date.today()
            today_start = datetime.combine(today, datetime.min.time())

            balance_event_stmt = (
                select(AccountEvent)
                .where(
                    and_(
                        AccountEvent.account_id == account_id,
                        AccountEvent.user_id == user_id,
                        AccountEvent.created_at >= today_start,
                    )
                )
                .order_by(AccountEvent.created_at.desc())
                .limit(1)
            )
            balance_event_result = await self.session.execute(balance_event_stmt)
            existing_event = balance_event_result.scalar_one_or_none()

            if existing_event:
                msg = "Balance saved: %s, £%s" % (account_id, existing_event.value)  # pylint: disable=consider-using-f-string
                logger.debug(msg)
                return False

            event_type_stmt = select(ReferenceData.id).where(
                and_(
                    ReferenceData.class_key == "account_event_type",
                    ReferenceData.reference_value == "Balance Update",
                )
            )
            event_type_result = await self.session.execute(event_type_stmt)
            event_type_id = event_type_result.scalar_one_or_none()

            if not event_type_id:
                logger.warning("[SharesBalanceService] 'Balance Update' event type not found")
                return False

            balance_event = AccountEvent(  # type: ignore[call-arg]
                account_id=account_id,
                user_id=user_id,
                type_id=event_type_id,
                value=balance_str,
            )
            self.session.add(balance_event)
            await self.session.flush()

            await self.repo.set_attribute(
                account_id,
                user_id,
                attr_type_id,
                balance_str,
            )

            if price:
                await self.repo.set_attribute_by_name(
                    account_id,
                    user_id,
                    "price",
                    price,
                )

            msg = "Saved shares: account %s, value £%s" % (account_id, balance_str)  # pylint: disable=consider-using-f-string
            logger.info(msg)
            return True

        except (ValueError, KeyError, RuntimeError):
            msg = "Error saving balance: account %s" % account_id  # pylint: disable=consider-using-f-string
            logger.error(msg, exc_info=True)
            return False
