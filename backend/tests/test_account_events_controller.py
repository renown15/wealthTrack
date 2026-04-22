from datetime import datetime

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy import select

from app.models.account import Account
from app.models.account_event import AccountEvent
from app.models.reference_data import ReferenceData


@pytest.mark.asyncio
async def test_list_account_events(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    account: Account,
    db_session,
):
    """Test retrieving the event timeline for an account."""
    result = await db_session.execute(
        select(ReferenceData).where(
            ReferenceData.class_key == "account_event_type",
            ReferenceData.reference_value == "Balance Update",
        )
    )
    event_type = result.scalar_one()
    event = AccountEvent(
        account_id=account.id,
        user_id=account.user_id,
        type_id=event_type.id,
        value="+250.00",
        created_at=datetime.utcnow(),
    )
    db_session.add(event)
    await db_session.flush()

    response = await client.get(
        f"/api/v1/accounts/{account.id}/events",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["eventType"] == event_type.reference_value


@pytest.mark.asyncio
async def test_list_account_events_not_found(
    client: AsyncClient, authenticated_headers: dict[str, str]
):
    """Request event timeline for a missing account."""
    response = await client.get(
        "/api/v1/accounts/99999/events",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_create_account_event(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    account: Account,
):
    """Test creating a new account event."""
    response = await client.post(
        f"/api/v1/accounts/{account.id}/events",
        headers=authenticated_headers,
        json={"event_type": "balance", "value": "500.00"},
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["accountId"] == account.id
    assert data["value"] == "500.00"


@pytest.mark.asyncio
async def test_create_account_event_not_found(
    client: AsyncClient, authenticated_headers: dict[str, str]
):
    """Test creating event for non-existent account."""
    response = await client.post(
        "/api/v1/accounts/99999/events",
        headers=authenticated_headers,
        json={"event_type": "balance", "value": "500.00"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_create_account_event_invalid_type(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    account: Account,
):
    """Test creating event with invalid event type."""
    response = await client.post(
        f"/api/v1/accounts/{account.id}/events",
        headers=authenticated_headers,
        json={"event_type": "invalid_type", "value": "500.00"},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_create_account_event_unauthorized(
    client: AsyncClient,
    account: Account,
):
    """Test creating event without authentication."""
    response = await client.post(
        f"/api/v1/accounts/{account.id}/events",
        json={"event_type": "balance", "value": "500.00"},
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
