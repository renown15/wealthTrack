"""Integration tests for the close-and-transfer endpoint."""
import pytest
from fastapi import status
from httpx import AsyncClient

from app.models.account import Account
from app.models.institution import Institution


async def _create_account(
    client: AsyncClient,
    headers: dict[str, str],
    institution: Institution,
    name: str = "Target Account",
) -> int:
    resp = await client.post(
        "/api/v1/accounts",
        headers=headers,
        json={"name": name, "institutionId": institution.id, "typeId": 1, "statusId": 1},
    )
    assert resp.status_code == status.HTTP_201_CREATED
    return resp.json()["id"]


@pytest.mark.asyncio
async def test_close_and_transfer_returns_204(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    account: Account,
    institution: Institution,
) -> None:
    """Successful transfer returns 204 No Content."""
    target_id = await _create_account(client, authenticated_headers, institution)

    response = await client.post(
        f"/api/v1/accounts/{account.id}/close-and-transfer",
        headers=authenticated_headers,
        json={"target_account_id": target_id},
    )
    assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.asyncio
async def test_close_and_transfer_same_account_returns_400(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    account: Account,
) -> None:
    """Transferring to the same account returns 400."""
    response = await client.post(
        f"/api/v1/accounts/{account.id}/close-and-transfer",
        headers=authenticated_headers,
        json={"target_account_id": account.id},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "same account" in response.json()["detail"]


@pytest.mark.asyncio
async def test_close_and_transfer_missing_target_returns_400(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    account: Account,
) -> None:
    """Non-existent target account returns 400."""
    response = await client.post(
        f"/api/v1/accounts/{account.id}/close-and-transfer",
        headers=authenticated_headers,
        json={"target_account_id": 99999},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_close_and_transfer_requires_auth(
    client: AsyncClient,
    account: Account,
    institution: Institution,
) -> None:
    """Unauthenticated request returns 401."""
    response = await client.post(
        f"/api/v1/accounts/{account.id}/close-and-transfer",
        json={"target_account_id": 2},
    )
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
