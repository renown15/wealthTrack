"""Reference data service — seed and query lookup rows."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reference_data import ReferenceData
from app.services.reference_data_items import REFERENCE_DATA_ITEMS, ReferenceDataItem

__all__ = [
    "ReferenceDataItem",
    "REFERENCE_DATA_ITEMS",
    "seed_reference_data",
    "list_reference_data_by_class",
]


async def seed_reference_data(session: AsyncSession) -> None:
    """Ensure all reference data rows exist in the database (idempotent)."""
    inserted = 0
    for entry in REFERENCE_DATA_ITEMS:
        statement = select(ReferenceData).where(
            ReferenceData.class_key == entry.class_key,
            ReferenceData.reference_value == entry.reference_value,
        )
        existing = (await session.execute(statement)).scalars().first()
        if existing:
            continue

        row = ReferenceData()
        row.class_key = entry.class_key
        row.reference_value = entry.reference_value
        row.sort_index = entry.sort_index
        session.add(row)
        inserted += 1

    if inserted:
        await session.commit()


async def list_reference_data_by_class(
    session: AsyncSession, class_key: str
) -> list[ReferenceData]:
    """Return all reference data rows that belong to the supplied class."""
    statement = (
        select(ReferenceData)
        .where(ReferenceData.class_key == class_key)
        .order_by(
            ReferenceData.sort_index,
            ReferenceData.reference_value,
        )
    )
    result = await session.execute(statement)
    return list(result.scalars().all())
