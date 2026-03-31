"""Service for managing deferred cash balance snapshots."""

import logging
from datetime import date

from app.repositories.account_attribute_repository import AccountAttributeRepository

logger = logging.getLogger(__name__)


class DeferredCashBalanceService:
    """Service for saving and managing deferred cash balance snapshots."""

    def __init__(self, repo: AccountAttributeRepository) -> None:
        """Initialize with repository dependency."""
        self.repo = repo
        self.session = repo.session

    async def save_daily_balance(
        self,
        account_id: int,
        user_id: int,
        balance_value: float,
    ) -> bool:
        """
        Save deferred cash net balance as an account attribute (history only).

        Does NOT write to AccountEvent — the user's gross balance event is the
        source of truth. Writing net back to AccountEvent would cause double-taxation
        on the next portfolio load.

        Only saves if the attribute has not already been updated today.

        Returns:
            True if balance was saved, False if already saved today
        """
        try:
            balance_str = f"{balance_value:.2f}"

            attr_type_id = await self.repo.get_attribute_type_id("deferred_cash_balance")
            if not attr_type_id:
                logger.warning(
                    "[DeferredCashBalanceService] 'Deferred Cash Balance' attribute type not found"
                )
                return False

            # Check if already saved today using the attribute's updated_at
            today = date.today()
            existing_attr = await self.repo.get_attribute(account_id, user_id, attr_type_id)
            if existing_attr and existing_attr.updated_at.date() == today:
                logger.debug(
                    "[DeferredCashBalanceService] Already saved today: %s", account_id
                )
                return False

            await self.repo.set_attribute(account_id, user_id, attr_type_id, balance_str)

            msg = "Saved cash: account %s, value £%s" % (account_id, balance_str)  # pylint: disable=consider-using-f-string
            logger.info(msg)
            return True

        except (ValueError, KeyError, RuntimeError):
            msg = "Error saving: %s" % account_id  # pylint: disable=consider-using-f-string
            logger.error(msg, exc_info=True)
            return False
