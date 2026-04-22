"""
Repository for TaxReturn CRUD/upsert operations.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tax_return import TaxReturn


class TaxReturnRepository:
    """Handles TaxReturn database operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_for_account_period(
        self, user_id: int, account_id: int, tax_period_id: int
    ) -> Optional[TaxReturn]:
        """Get a tax return for a specific account and period."""
        stmt = select(TaxReturn).where(
            TaxReturn.user_id == user_id,
            TaxReturn.account_id == account_id,
            TaxReturn.tax_period_id == tax_period_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(self, return_id: int, user_id: int) -> Optional[TaxReturn]:
        """Get a tax return by ID, scoped to the user."""
        stmt = select(TaxReturn).where(
            TaxReturn.id == return_id,
            TaxReturn.user_id == user_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_for_period(self, user_id: int, tax_period_id: int) -> list[TaxReturn]:
        """Get all tax returns for a period."""
        stmt = select(TaxReturn).where(
            TaxReturn.user_id == user_id,
            TaxReturn.tax_period_id == tax_period_id,
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def upsert(
        self,
        user_id: int,
        account_id: int,
        tax_period_id: int,
        income: Optional[float],
        capital_gain: Optional[float],
        tax_taken_off: Optional[float],
    ) -> TaxReturn:
        """Create or update a tax return, replacing all values."""
        existing = await self.get_for_account_period(user_id, account_id, tax_period_id)
        now = datetime.utcnow()
        if existing:
            existing.income = income
            existing.capital_gain = capital_gain
            existing.tax_taken_off = tax_taken_off
            existing.updated_at = now
            await self.session.flush()
            await self.session.refresh(existing)
            return existing

        return await self._create(
            user_id, account_id, tax_period_id, income, capital_gain, tax_taken_off, now
        )

    async def get_or_create(
        self,
        user_id: int,
        account_id: int,
        tax_period_id: int,
        income: Optional[float] = None,
        capital_gain: Optional[float] = None,
        tax_taken_off: Optional[float] = None,
    ) -> TaxReturn:
        """Get existing tax return or create if absent. Never overwrites saved user data."""
        existing = await self.get_for_account_period(user_id, account_id, tax_period_id)
        if existing:
            return existing
        return await self._create(
            user_id,
            account_id,
            tax_period_id,
            income,
            capital_gain,
            tax_taken_off,
            datetime.utcnow(),
        )

    async def _create(
        self,
        user_id: int,
        account_id: int,
        tax_period_id: int,
        income: Optional[float],
        capital_gain: Optional[float],
        tax_taken_off: Optional[float],
        now: datetime,
    ) -> TaxReturn:
        tax_return = TaxReturn()
        tax_return.user_id = user_id
        tax_return.account_id = account_id
        tax_return.tax_period_id = tax_period_id
        tax_return.income = income
        tax_return.capital_gain = capital_gain
        tax_return.tax_taken_off = tax_taken_off
        tax_return.created_at = now
        tax_return.updated_at = now
        self.session.add(tax_return)
        await self.session.flush()
        await self.session.refresh(tax_return)
        return tax_return
