"""Tests for account dates controller."""

import pytest
from fastapi import status
from httpx import AsyncClient

from app.models.account import Account
from app.models.user_profile import UserProfile


@pytest.mark.asyncio
async def test_update_account_dates_set_opened(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    account: Account,
):
    """Test setting the opened date on an account."""
    response = await client.put(
        f"/api/v1/accounts/{account.id}/dates",
        headers=authenticated_headers,
        json={"opened_at": "2024-01-15"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["accountId"] == account.id
    assert data["openedAt"] == "2024-01-15"


@pytest.mark.asyncio
async def test_update_account_dates_set_closed(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    account: Account,
):
    """Test setting the closed date on an account."""
    response = await client.put(
        f"/api/v1/accounts/{account.id}/dates",
        headers=authenticated_headers,
        json={"closed_at": "2024-12-31"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["accountId"] == account.id
    assert data["closedAt"] == "2024-12-31"


@pytest.mark.asyncio
async def test_update_account_dates_set_both(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    account: Account,
):
    """Test setting both opened and closed dates."""
    response = await client.put(
        f"/api/v1/accounts/{account.id}/dates",
        headers=authenticated_headers,
        json={"opened_at": "2020-06-01", "closed_at": "2024-06-01"},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["accountId"] == account.id
    assert data["openedAt"] == "2020-06-01"
    assert data["closedAt"] == "2024-06-01"


@pytest.mark.asyncio
async def test_update_account_dates_clear_date(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    account: Account,
):
    """Test clearing a date by sending empty string."""
    # First set a date
    await client.put(
        f"/api/v1/accounts/{account.id}/dates",
        headers=authenticated_headers,
        json={"opened_at": "2024-01-15"},
    )

    # Now clear it
    response = await client.put(
        f"/api/v1/accounts/{account.id}/dates",
        headers=authenticated_headers,
        json={"opened_at": ""},
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["openedAt"] is None


@pytest.mark.asyncio
async def test_update_account_dates_not_found(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
):
    """Test updating dates for non-existent account."""
    response = await client.put(
        "/api/v1/accounts/99999/dates",
        headers=authenticated_headers,
        json={"opened_at": "2024-01-15"},
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_update_account_dates_unauthorized(
    client: AsyncClient,
    account: Account,
):
    """Test updating dates without authentication."""
    response = await client.put(
        f"/api/v1/accounts/{account.id}/dates",
        json={"opened_at": "2024-01-15"},
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
