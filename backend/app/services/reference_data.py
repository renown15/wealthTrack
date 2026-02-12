"""Reference data helpers for seeding baseline lookup rows."""
from typing import NamedTuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reference_data import ReferenceData


class ReferenceDataItem(NamedTuple):
    """Structured data for seeding reference data rows."""

    class_key: str
    reference_value: str
    sort_index: int

REFERENCE_DATA_ITEMS: list[ReferenceDataItem] = [
    # User types
    ReferenceDataItem(class_key="user_type", reference_value="User", sort_index=1),
    ReferenceDataItem(class_key="user_type", reference_value="SuperUser", sort_index=2),
    # Account types
    ReferenceDataItem(class_key="account_type", reference_value="Checking Account", sort_index=1),
    ReferenceDataItem(class_key="account_type", reference_value="Savings Account", sort_index=2),
    ReferenceDataItem(class_key="account_type", reference_value="Stocks ISA", sort_index=3),
    ReferenceDataItem(class_key="account_type", reference_value="SIPP", sort_index=4),
    ReferenceDataItem(class_key="account_type", reference_value="Credit Card", sort_index=5),
    # Account statuses
    ReferenceDataItem(class_key="account_status", reference_value="Active", sort_index=1),
    ReferenceDataItem(class_key="account_status", reference_value="Closed", sort_index=2),
    ReferenceDataItem(class_key="account_status", reference_value="Dormant", sort_index=3),
    # Event types
    ReferenceDataItem(class_key="account_event_type", reference_value="Balance Update", sort_index=1),
    ReferenceDataItem(class_key="account_event_type", reference_value="Interest", sort_index=2),
    ReferenceDataItem(class_key="account_event_type", reference_value="Dividend", sort_index=3),
    ReferenceDataItem(class_key="account_event_type", reference_value="Deposit", sort_index=4),
    ReferenceDataItem(class_key="account_event_type", reference_value="Withdrawal", sort_index=5),
    # Attribute types
    ReferenceDataItem(class_key="account_attribute_type", reference_value="Account Opened Date", sort_index=1),
    ReferenceDataItem(class_key="account_attribute_type", reference_value="Account Closed Date", sort_index=2),
    ReferenceDataItem(class_key="account_attribute_type", reference_value="Account Number", sort_index=3),
    ReferenceDataItem(class_key="account_attribute_type", reference_value="Sort Code", sort_index=4),
    ReferenceDataItem(class_key="account_attribute_type", reference_value="Roll / Ref Number", sort_index=5),
    ReferenceDataItem(class_key="account_attribute_type", reference_value="IBAN", sort_index=6),
    ReferenceDataItem(class_key="account_attribute_type", reference_value="Notes", sort_index=7),
    # Credential types
    ReferenceDataItem(class_key="credential_type", reference_value="Username", sort_index=1),
    ReferenceDataItem(class_key="credential_type", reference_value="Password", sort_index=2),
    ReferenceDataItem(class_key="credential_type", reference_value="Security Question", sort_index=3),
    ReferenceDataItem(class_key="credential_type", reference_value="Mother's Maiden Name", sort_index=4),
    ReferenceDataItem(class_key="credential_type", reference_value="Phone PIN", sort_index=5),
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
