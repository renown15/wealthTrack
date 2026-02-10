"""Reference data helpers for seeding baseline lookup rows."""
from typing import NamedTuple

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reference_data import ReferenceData


class ReferenceDataItem(NamedTuple):
    """Structured data for seeding reference data rows."""

    class_key: str
    reference_value: str
    sort_index: int

REFERENCE_DATA_ITEMS: list[ReferenceDataItem] = [
    # User types
    ReferenceDataItem(
        class_key="user_type:user",
        reference_value="User",
        sort_index=1,
    ),
    ReferenceDataItem(
        class_key="user_type:superuser",
        reference_value="SuperUser",
        sort_index=2,
    ),
    # Account types
    ReferenceDataItem(
        class_key="account_type:checking",
        reference_value="Checking Account",
        sort_index=1,
    ),
    ReferenceDataItem(
        class_key="account_type:savings",
        reference_value="Savings Account",
        sort_index=2,
    ),
    ReferenceDataItem(
        class_key="account_type:stocks_isa",
        reference_value="Stocks ISA",
        sort_index=3,
    ),
    ReferenceDataItem(
        class_key="account_type:sipp",
        reference_value="SIPP",
        sort_index=4,
    ),
    ReferenceDataItem(
        class_key="account_type:credit_card",
        reference_value="Credit Card",
        sort_index=5,
    ),

    # Account statuses
    ReferenceDataItem(
        class_key="account_status:active",
        reference_value="Active",
        sort_index=1,
    ),
    ReferenceDataItem(
        class_key="account_status:closed",
        reference_value="Closed",
        sort_index=2,
    ),
    ReferenceDataItem(
        class_key="account_status:dormant",
        reference_value="Dormant",
        sort_index=3,
    ),

    # Event types
    ReferenceDataItem(
        class_key="event_type:balance_update",
        reference_value="Balance Update",
        sort_index=1,
    ),
    ReferenceDataItem(
        class_key="event_type:transaction",
        reference_value="Transaction",
        sort_index=2,
    ),
    ReferenceDataItem(
        class_key="event_type:fee",
        reference_value="Fee",
        sort_index=3,
    ),

    # Attribute types
    ReferenceDataItem(
        class_key="attribute_type:interest_rate",
        reference_value="Interest Rate",
        sort_index=1,
    ),
    ReferenceDataItem(
        class_key="attribute_type:overdraft_limit",
        reference_value="Overdraft Limit",
        sort_index=2,
    ),
    ReferenceDataItem(
        class_key="attribute_type:credit_limit",
        reference_value="Credit Limit",
        sort_index=3,
    ),
]


async def seed_reference_data(session: AsyncSession) -> None:
    """Ensure the baseline reference data exists in the database."""
    inserted = 0
    for entry in REFERENCE_DATA_ITEMS:
        target_class_key = entry.class_key
        target_value = entry.reference_value
        statement = select(ReferenceData).where(
            ReferenceData.class_key == target_class_key,
            ReferenceData.reference_value == target_value,
        )
        existing = (await session.execute(statement)).scalars().first()
        if existing:
            continue

        reference_entry = ReferenceData()
        reference_entry.class_key = target_class_key
        reference_entry.reference_value = target_value
        reference_entry.sort_index = entry.sort_index

        session.add(reference_entry)
        inserted += 1

    if inserted:
        await session.commit()


async def list_reference_data_by_class(
    session: AsyncSession, class_key: str
) -> list[ReferenceData]:
    """Return all reference data rows that belong to the supplied class."""
    prefix = f"{class_key}:"
    statement = (
        select(ReferenceData)
        .where(
            or_(
                ReferenceData.class_key == class_key,
                ReferenceData.class_key.startswith(prefix),
            )
        )
        .order_by(
            ReferenceData.sort_index,
            ReferenceData.reference_value,
        )
    )
    result = await session.execute(statement)
    return list(result.scalars().all())
