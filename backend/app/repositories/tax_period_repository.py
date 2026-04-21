"""
Repository for TaxPeriod CRUD operations.
"""
from datetime import date, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tax_period import TaxPeriod


class TaxPeriodRepository:
    """Handles TaxPeriod database operations."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_for_user(self, user_id: int) -> list[TaxPeriod]:
        """Return all tax periods for a user ordered by start_date descending."""
        stmt = (
            select(TaxPeriod)
            .where(TaxPeriod.user_id == user_id)
            .order_by(TaxPeriod.start_date.desc())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, period_id: int, user_id: int) -> TaxPeriod | None:
        """Get a tax period by ID, scoped to the user."""
        stmt = select(TaxPeriod).where(
            TaxPeriod.id == period_id,
            TaxPeriod.user_id == user_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(
        self,
        user_id: int,
        name: str,
        start_date: date,
        end_date: date,
        account_group_id: int | None = None,
    ) -> TaxPeriod:
        """Create and persist a new tax period."""
        period = TaxPeriod()
        period.user_id = user_id
        period.name = name
        period.start_date = start_date
        period.end_date = end_date
        period.account_group_id = account_group_id
        period.created_at = datetime.utcnow()
        period.updated_at = datetime.utcnow()
        self.session.add(period)
        await self.session.flush()
        await self.session.refresh(period)
        return period

    async def delete(self, period: TaxPeriod) -> None:
        """Delete a tax period (cascades to returns and documents)."""
        await self.session.delete(period)
        await self.session.flush()
