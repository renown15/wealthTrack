"""Account processing for portfolio calculations."""

import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account_event import AccountEvent
from app.repositories.account_attribute_repository import AccountAttributeRepository
from app.services.deferred_cash_balance_service import DeferredCashBalanceService
from app.services.deferred_shares_balance_service import DeferredSharesBalanceService
from app.services.price_service import get_price_service
from app.services.rsu_balance_service import RSUBalanceService
from app.services.shares_balance_service import SharesBalanceService
from app.utils.deferred_shares_calculator import (
    calculate_deferred_cash_balance_safe,
    calculate_deferred_shares_balance_safe,
    calculate_rsu_balance_safe,
)

logger = logging.getLogger(__name__)


class AccountProcessor:
    """Handles account-type-specific processing for portfolio calculations."""

    @staticmethod
    async def process_deferred_shares_account(
        attr_repo: "AccountAttributeRepository",
        account_id: int,
        user_id: int,
        attrs: dict[str, str],
        _session: AsyncSession,
    ) -> str:
        """Process deferred shares account and return updated price."""
        number_of_shares = attrs["number_of_shares"]
        underlying = attrs["underlying"]
        price = attrs["price"]
        purchase_price = attrs["purchase_price"]

        if not underlying:
            return price

        price_service = await get_price_service()
        fresh_price = await price_service.fetch_price(underlying)
        if fresh_price:
            await attr_repo.set_attribute_by_name(account_id, user_id, "price", fresh_price)
            price = fresh_price

        if number_of_shares and price and purchase_price:
            calc = calculate_deferred_shares_balance_safe(number_of_shares, price, purchase_price)
            if calc is not None:
                service = DeferredSharesBalanceService(attr_repo)
                await service.save_daily_balance(account_id, user_id, calc, price)

        return price

    @staticmethod
    async def process_rsu_account(
        attr_repo: "AccountAttributeRepository",
        account_id: int,
        user_id: int,
        attrs: dict[str, str],
        _session: AsyncSession,
    ) -> str:
        """Process RSU account and return updated price."""
        number_of_shares = attrs["number_of_shares"]
        underlying = attrs["underlying"]
        price = attrs["price"]

        if not underlying:
            return price

        price_service = await get_price_service()
        fresh_price = await price_service.fetch_price(underlying)
        if fresh_price:
            await attr_repo.set_attribute_by_name(account_id, user_id, "price", fresh_price)
            price = fresh_price

        if number_of_shares and price:
            calc = calculate_rsu_balance_safe(number_of_shares, price)
            if calc is not None:
                service = RSUBalanceService(attr_repo)
                await service.save_daily_balance(account_id, user_id, calc, price)

        return price

    @staticmethod
    async def process_shares_account(
        attr_repo: "AccountAttributeRepository",
        account_id: int,
        user_id: int,
        attrs: dict[str, str],
        _session: AsyncSession,
    ) -> str:
        """Process Shares account and return updated price."""
        number_of_shares = attrs["number_of_shares"]
        underlying = attrs["underlying"]
        price = attrs["price"]
        purchase_price = attrs["purchase_price"]

        if not underlying:
            return price

        price_service = await get_price_service()
        fresh_price = await price_service.fetch_price(underlying)
        if fresh_price:
            await attr_repo.set_attribute_by_name(account_id, user_id, "price", fresh_price)
            price = fresh_price

        if number_of_shares and price and purchase_price:
            calc = calculate_deferred_shares_balance_safe(number_of_shares, price, purchase_price)
            if calc is not None:
                service = SharesBalanceService(attr_repo)
                await service.save_daily_balance(account_id, user_id, calc, price)

        return price

    @staticmethod
    async def process_deferred_cash_account(
        attr_repo: "AccountAttributeRepository",
        account_id: int,
        user_id: int,
        balance: Optional[AccountEvent],
        _session: AsyncSession,
    ) -> None:
        """Process deferred cash account."""
        if not balance or not balance.value:
            return

        try:
            balance_in_pence = int(float(balance.value) * 100)
            calculated_balance = calculate_deferred_cash_balance_safe(str(balance_in_pence))
            if calculated_balance is not None:
                service = DeferredCashBalanceService(attr_repo)
                await service.save_daily_balance(account_id, user_id, calculated_balance)
        except (ValueError, TypeError) as e:
            msg = f"Cash calc failed: {account_id}, {e}"
            logger.warning(msg, exc_info=True)
