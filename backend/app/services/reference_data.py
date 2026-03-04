"""Reference data helpers for seeding baseline lookup rows.

This is the single source of truth for all reference data in the system.

When adding new reference data:
1. Add the item(s) to REFERENCE_DATA_ITEMS below.
2. Run ``scripts/seed-db.py`` (or ``make seed-db``) against the target database.

Do NOT add seed-only Alembic migrations — those belong here.
DDL changes (new tables, columns, indexes) still go in Alembic migrations.
"""
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
    # -----------------------------------------------------------------------
    # User types
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="user_type", reference_value="User", sort_index=1),
    ReferenceDataItem(class_key="user_type", reference_value="SuperUser", sort_index=2),
    # -----------------------------------------------------------------------
    # Account types
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="account_type", reference_value="Current Account", sort_index=1),
    ReferenceDataItem(class_key="account_type", reference_value="Savings Account", sort_index=2),
    ReferenceDataItem(class_key="account_type", reference_value="Cash ISA", sort_index=3),
    ReferenceDataItem(class_key="account_type", reference_value="Fixed Rate ISA", sort_index=4),
    ReferenceDataItem(class_key="account_type", reference_value="Stocks ISA", sort_index=5),
    ReferenceDataItem(
        class_key="account_type", reference_value="Fixed / Bonus Rate Saver", sort_index=6
    ),
    ReferenceDataItem(class_key="account_type", reference_value="Premium Bonds", sort_index=7),
    ReferenceDataItem(
        class_key="account_type", reference_value="Deferred DC Pension", sort_index=8
    ),
    ReferenceDataItem(
        class_key="account_type", reference_value="Deferred DB Pension", sort_index=9
    ),
    ReferenceDataItem(class_key="account_type", reference_value="Deferred Cash", sort_index=10),
    ReferenceDataItem(class_key="account_type", reference_value="Deferred Shares", sort_index=11),
    ReferenceDataItem(class_key="account_type", reference_value="RSU", sort_index=12),
    ReferenceDataItem(
        class_key="account_type", reference_value="Trust Bank Account", sort_index=13
    ),
    ReferenceDataItem(
        class_key="account_type", reference_value="Trust Stocks Investment Account", sort_index=14
    ),
    # -----------------------------------------------------------------------
    # Account statuses
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="account_status", reference_value="Active", sort_index=1),
    ReferenceDataItem(class_key="account_status", reference_value="Closed", sort_index=2),
    # -----------------------------------------------------------------------
    # Account event types
    # -----------------------------------------------------------------------
    ReferenceDataItem(
        class_key="account_event_type", reference_value="Balance Update", sort_index=1
    ),
    ReferenceDataItem(class_key="account_event_type", reference_value="Interest", sort_index=2),
    ReferenceDataItem(class_key="account_event_type", reference_value="Dividend", sort_index=3),
    ReferenceDataItem(class_key="account_event_type", reference_value="Win", sort_index=4),
    # -----------------------------------------------------------------------
    # Account attribute types
    # -----------------------------------------------------------------------
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Account Opened Date", sort_index=1
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Account Closed Date", sort_index=2
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Account Number", sort_index=3
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Sort Code", sort_index=4
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Roll / Ref Number", sort_index=5
    ),
    ReferenceDataItem(class_key="account_attribute_type", reference_value="Notes", sort_index=6),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Interest Rate", sort_index=7
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Fixed Bonus Rate", sort_index=8
    ),
    ReferenceDataItem(
        class_key="account_attribute_type",
        reference_value="Fixed Bonus Rate End Date",
        sort_index=9,
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Release Date", sort_index=10
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Number of Shares", sort_index=11
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Underlying", sort_index=12
    ),
    ReferenceDataItem(class_key="account_attribute_type", reference_value="Price", sort_index=13),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Purchase Price", sort_index=14
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Deferred Shares Balance", sort_index=15
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Deferred Cash Balance", sort_index=16
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="RSU Balance", sort_index=17
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Pension Monthly Payment", sort_index=18
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Asset Class", sort_index=19
    ),
    # -----------------------------------------------------------------------
    # Asset class values
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="asset_class", reference_value="Cash", sort_index=1),
    ReferenceDataItem(class_key="asset_class", reference_value="Single Stock", sort_index=2),
    ReferenceDataItem(class_key="asset_class", reference_value="Equity Index", sort_index=3),
    # -----------------------------------------------------------------------
    # Credential types
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="credential_type", reference_value="Username", sort_index=1),
    ReferenceDataItem(class_key="credential_type", reference_value="Password", sort_index=2),
    ReferenceDataItem(class_key="credential_type", reference_value="Phone PIN", sort_index=3),
    ReferenceDataItem(
        class_key="credential_type", reference_value="Security Question", sort_index=4
    ),
    ReferenceDataItem(
        class_key="credential_type", reference_value="Mother's Maiden Name", sort_index=5
    ),
    ReferenceDataItem(
        class_key="credential_type", reference_value="Childhood freind", sort_index=6
    ),
    ReferenceDataItem(
        class_key="credential_type", reference_value="Middle name of eldest child", sort_index=7
    ),
    ReferenceDataItem(class_key="credential_type", reference_value="Memorable Date", sort_index=8),
    ReferenceDataItem(class_key="credential_type", reference_value="Memorable Name", sort_index=9),
    ReferenceDataItem(
        class_key="credential_type", reference_value="Memorable Place", sort_index=10
    ),
    ReferenceDataItem(
        class_key="credential_type", reference_value="Secret Word", sort_index=11
    ),
    # -----------------------------------------------------------------------
    # Institution types
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="institution_type", reference_value="Bank", sort_index=1),
    ReferenceDataItem(
        class_key="institution_type", reference_value="Building Society", sort_index=2
    ),
    ReferenceDataItem(class_key="institution_type", reference_value="HM Government", sort_index=3),
    ReferenceDataItem(class_key="institution_type", reference_value="Fund Manager", sort_index=4),
    ReferenceDataItem(
        class_key="institution_type", reference_value="Pensions Provider", sort_index=5
    ),
    ReferenceDataItem(
        class_key="institution_type", reference_value="Share Registrar", sort_index=6
    ),
    # -----------------------------------------------------------------------
    # Analytics baseline date
    # -----------------------------------------------------------------------
        ReferenceDataItem(
        class_key="analytics_baseline_date", reference_value="", sort_index=0
    ),
    # -----------------------------------------------------------------------
    # Deposit insurance limit (FSCS limit in GBP)
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="deposit_insurance_limit", reference_value="125000", sort_index=1),
    # -----------------------------------------------------------------------
    # Pension calculation assumptions
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="life_expectancy", reference_value="36", sort_index=1),
    ReferenceDataItem(class_key="annuity_assumption_rate", reference_value="0.075", sort_index=1),
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
