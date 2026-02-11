"""Tests for reference data services and controller endpoints."""
from sqlalchemy import delete, func, select

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reference_data import ReferenceData
from app.services.reference_data import (
    REFERENCE_DATA_ITEMS,
    list_reference_data_by_class,
    seed_reference_data,
)


@pytest.mark.asyncio
async def test_list_reference_data_by_class_returns_matching_rows(
    db_session: AsyncSession,
) -> None:
    """Ensure we return exact and prefixed class rows ordered by sort index."""
    additional = ReferenceData(
        class_key="account_type",
        reference_value="All Account Types",
        sort_index=0,
    )
    db_session.add(additional)
    await db_session.flush()
    await db_session.commit()

    entries = await list_reference_data_by_class(db_session, "account_type")

    assert entries[0].class_key == "account_type"
    assert entries[0].sort_index == 0
    assert all(entry.class_key.startswith("account_type") for entry in entries)
    assert sorted(entries, key=lambda value: (value.sort_index, value.reference_value)) == entries


@pytest.mark.asyncio
async def test_seed_reference_data_inserts_missing_rows(db_session: AsyncSession) -> None:
    """Seeding creates rows that are missing and stays idempotent."""
    await db_session.execute(delete(ReferenceData))
    await db_session.commit()

    await seed_reference_data(db_session)
    count_result = await db_session.execute(select(func.count(ReferenceData.id)))
    assert count_result.scalar_one() == len(REFERENCE_DATA_ITEMS)

    await seed_reference_data(db_session)
    second_count = await db_session.execute(select(func.count(ReferenceData.id)))
    assert second_count.scalar_one() == len(REFERENCE_DATA_ITEMS)


@pytest.mark.asyncio
async def test_reference_data_endpoint_returns_payload(client: AsyncClient) -> None:
    """The endpoint returns reference rows for a known class."""
    response = await client.get("/api/v1/reference-data/account_type")
    assert response.status_code == 200

    payload = response.json()
    assert payload

    class_keys = [item["classKey"] for item in payload]
    assert all(key.startswith("account_type") for key in class_keys)
    assert "account_type:checking" in class_keys

    ordered = sorted(
        payload,
        key=lambda value: (value["sortIndex"], value["referenceValue"]),
    )
    assert ordered == payload


@pytest.mark.asyncio
async def test_reference_data_endpoint_handles_missing_class(client: AsyncClient) -> None:
    """Missing reference classes return an empty list rather than an error."""
    response = await client.get("/api/v1/reference-data/nonexistent_class")
    assert response.status_code == 200
    assert response.json() == []
