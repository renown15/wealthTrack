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
    assert all(key == "account_type" for key in class_keys)
    reference_values = [item["referenceValue"] for item in payload]
    assert "Checking Account" in reference_values

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


@pytest.mark.asyncio
async def test_list_all_reference_data_endpoint(client: AsyncClient) -> None:
    """GET /api/v1/reference-data returns all reference data entries."""
    response = await client.get("/api/v1/reference-data")
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert len(payload) > 0
    assert all("classKey" in item for item in payload)


@pytest.mark.asyncio
async def test_create_reference_data_endpoint(client: AsyncClient) -> None:
    """POST /api/v1/reference-data creates a new reference data entry."""
    payload = {
        "classKey": "test_class",
        "referenceValue": "test_value",
        "sortIndex": 1,
    }
    response = await client.post("/api/v1/reference-data", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["classKey"] == "test_class"
    assert data["referenceValue"] == "test_value"
    assert data["sortIndex"] == 1
    assert "id" in data


@pytest.mark.asyncio
async def test_update_reference_data_endpoint(client: AsyncClient) -> None:
    """PUT /api/v1/reference-data/{id} updates an existing entry."""
    # Create an entry first
    create_payload = {
        "classKey": "test_class_update",
        "referenceValue": "original_value",
        "sortIndex": 0,
    }
    create_response = await client.post("/api/v1/reference-data", json=create_payload)
    assert create_response.status_code == 201
    entry_id = create_response.json()["id"]

    # Update it
    update_payload = {
        "classKey": "test_class_update",
        "referenceValue": "updated_value",
        "sortIndex": 2,
    }
    update_response = await client.put(
        f"/api/v1/reference-data/{entry_id}",
        json=update_payload,
    )
    assert update_response.status_code == 200
    data = update_response.json()
    assert data["referenceValue"] == "updated_value"
    assert data["sortIndex"] == 2


@pytest.mark.asyncio
async def test_update_reference_data_not_found(client: AsyncClient) -> None:
    """PUT /api/v1/reference-data/{id} returns 404 when entry doesn't exist."""
    update_payload = {
        "classKey": "test_class",
        "referenceValue": "value",
    }
    response = await client.put(
        "/api/v1/reference-data/99999",
        json=update_payload,
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_reference_data_endpoint(client: AsyncClient) -> None:
    """DELETE /api/v1/reference-data/{id} deletes an entry."""
    # Create an entry
    create_payload = {
        "classKey": "test_class_delete",
        "referenceValue": "value_to_delete",
    }
    create_response = await client.post("/api/v1/reference-data", json=create_payload)
    assert create_response.status_code == 201
    entry_id = create_response.json()["id"]

    # Delete it
    delete_response = await client.delete(f"/api/v1/reference-data/{entry_id}")
    assert delete_response.status_code == 204

    # Verify it's gone (list all and check)
    list_response = await client.get("/api/v1/reference-data")
    all_entries = list_response.json()
    assert not any(item["id"] == entry_id for item in all_entries)


@pytest.mark.asyncio
async def test_delete_reference_data_not_found(client: AsyncClient) -> None:
    """DELETE /api/v1/reference-data/{id} returns 404 when entry doesn't exist."""
    response = await client.delete("/api/v1/reference-data/99999")
    assert response.status_code == 404

