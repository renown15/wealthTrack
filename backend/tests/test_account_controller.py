"""Tests for account controller."""

import pytest
from fastapi import status
from httpx import AsyncClient

from app.models.account import Account
from app.models.institution import Institution
from app.models.user_profile import UserProfile


@pytest.mark.asyncio
async def test_get_all_accounts(
    client: AsyncClient, authenticated_headers: dict[str, str], user: UserProfile, account: Account
):
    """Test retrieving all accounts for a user."""
    response = await client.get(
        "/api/v1/accounts",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0  # type: ignore[arg-type]
    assert data[0]["userid"] == user.id


@pytest.mark.asyncio
async def test_get_account_by_id(
    client: AsyncClient, authenticated_headers: dict[str, str], account: Account
):
    """Test retrieving a specific account by ID."""
    response = await client.get(
        f"/api/v1/accounts/{account.id}",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["id"] == account.id
    assert data["name"] == account.name


@pytest.mark.asyncio
async def test_get_account_not_found(
    client: AsyncClient, authenticated_headers: dict[str, str]
):
    """Test retrieving a non-existent account."""
    response = await client.get(
        "/api/v1/accounts/99999",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_create_account(
    client: AsyncClient, authenticated_headers: dict[str, str], user: UserProfile,
    institution: Institution
):
    """Test creating a new account."""
    payload = {
        "institutionid": institution.id,
        "name": "New Checking Account",
        "typeid": 1,
        "statusid": 1,
    }
    response = await client.post(
        "/api/v1/accounts",
        json=payload,
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "New Checking Account"
    assert data["userid"] == user.id
    assert data["institutionid"] == institution.id


@pytest.mark.asyncio
async def test_create_account_unauthorized(client: AsyncClient):
    """Test creating an account without authentication."""
    payload = {
        "institutionid": 1,
        "name": "New Account",
        "typeid": 1,
        "statusid": 1,
    }
    response = await client.post(
        "/api/v1/accounts",
        json=payload,
    )
    assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


@pytest.mark.asyncio
async def test_update_account(
    client: AsyncClient, authenticated_headers: dict[str, str], account: Account
):
    """Test updating an account."""
    payload = {
        "name": "Updated Account Name",
    }
    response = await client.put(
        f"/api/v1/accounts/{account.id}",
        json=payload,
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Updated Account Name"
    assert data["id"] == account.id


@pytest.mark.asyncio
async def test_update_account_partial(
    client: AsyncClient, authenticated_headers: dict[str, str], account: Account
):
    """Test partially updating an account (only name)."""
    original_typeid = account.typeid
    payload = {"name": "New Name Only"}
    response = await client.put(
        f"/api/v1/accounts/{account.id}",
        json=payload,
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "New Name Only"
    assert data["typeid"] == original_typeid


@pytest.mark.asyncio
async def test_update_account_not_found(
    client: AsyncClient, authenticated_headers: dict[str, str]
):
    """Test updating a non-existent account."""
    payload = {"name": "Updated Name"}
    response = await client.put(
        "/api/v1/accounts/99999",
        json=payload,
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_delete_account(
    client: AsyncClient, authenticated_headers: dict[str, str], account: Account
):
    """Test deleting an account."""
    account_id = account.id
    response = await client.delete(
        f"/api/v1/accounts/{account_id}",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify account is deleted
    response = await client.get(
        f"/api/v1/accounts/{account_id}",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_delete_account_not_found(
    client: AsyncClient, authenticated_headers: dict[str, str]
):
    """Test deleting a non-existent account."""
    response = await client.delete(
        "/api/v1/accounts/99999",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_account_list_empty(
    client: AsyncClient, authenticated_headers: dict[str, str]
):
    """Test retrieving accounts when none exist."""
    # This test verifies the list endpoint works with no accounts
    response = await client.get(
        "/api/v1/accounts",
        headers=authenticated_headers,
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert isinstance(data, list)
