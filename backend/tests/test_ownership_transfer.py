"""Tests for account ownership transfer (POST /accounts/{id}/transfer)."""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.reference_data import ReferenceData
from app.models.user_profile import UserProfile
from app.services.account_service import AccountService
from app.services.auth import create_access_token


async def _make_user(session: AsyncSession, email: str) -> UserProfile:
    from sqlalchemy import select

    result = await session.execute(
        select(ReferenceData).where(
            ReferenceData.class_key == "user_type", ReferenceData.reference_value == "User"
        )
    )
    user_type = result.scalar_one()
    u = UserProfile(
        first_name="Member", last_name="Other", email=email,
        password="hashed", is_active=True, type_id=user_type.id,
    )
    session.add(u)
    await session.flush()
    await session.refresh(u)
    return u


def _auth(user: UserProfile) -> dict[str, str]:
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_transfer_service_account_not_found() -> None:
    """Account not found raises ValueError."""
    session = AsyncMock()
    with patch("app.services.account_service.AccountRepository") as MockRepo:
        MockRepo.return_value.get_by_id = AsyncMock(return_value=None)
        with pytest.raises(ValueError, match="Account not found"):
            await AccountService(session).transfer(99, 1, 2)


@pytest.mark.asyncio
async def test_transfer_service_not_family_member() -> None:
    """Target not in same family raises PermissionError."""
    session = AsyncMock()
    mock_account = MagicMock()
    with (
        patch("app.services.account_service.AccountRepository") as MockRepo,
        patch("app.services.account_service.FamilyRepository") as MockFamily,
    ):
        MockRepo.return_value.get_by_id = AsyncMock(return_value=mock_account)
        MockFamily.return_value.get_member_ids_for_user = AsyncMock(return_value=[3, 4])
        with pytest.raises(PermissionError, match="not a family member"):
            await AccountService(session).transfer(1, 1, 99)


@pytest.mark.asyncio
async def test_transfer_service_success() -> None:
    """Successful transfer updates account user_id and flushes session."""
    session = AsyncMock()
    mock_account = MagicMock()
    mock_account.user_id = 1
    with (
        patch("app.services.account_service.AccountRepository") as MockRepo,
        patch("app.services.account_service.FamilyRepository") as MockFamily,
    ):
        MockRepo.return_value.get_by_id = AsyncMock(return_value=mock_account)
        MockFamily.return_value.get_member_ids_for_user = AsyncMock(return_value=[2, 3])
        await AccountService(session).transfer(1, 1, 2)
    assert mock_account.user_id == 2
    session.flush.assert_awaited_once()


@pytest.mark.asyncio
async def test_ownership_transfer_no_auth(client: AsyncClient, account: Account) -> None:
    """Unauthenticated request returns 401."""
    resp = await client.post(
        f"/api/v1/accounts/{account.id}/transfer", json={"targetUserId": 99}
    )
    assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_ownership_transfer_account_not_found(
    client: AsyncClient, user: UserProfile
) -> None:
    """Unknown account returns 404."""
    resp = await client.post(
        "/api/v1/accounts/99999/transfer",
        headers=_auth(user),
        json={"targetUserId": 99},
    )
    assert resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_ownership_transfer_not_family_member(
    client: AsyncClient, user: UserProfile, account: Account
) -> None:
    """Target user not in any shared family returns 403."""
    resp = await client.post(
        f"/api/v1/accounts/{account.id}/transfer",
        headers=_auth(user),
        json={"targetUserId": 99999},
    )
    assert resp.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.asyncio
async def test_ownership_transfer_success(
    client: AsyncClient,
    db_session: AsyncSession,
    user: UserProfile,
    account: Account,
) -> None:
    """Successful ownership transfer returns 204."""
    other = await _make_user(db_session, "other@example.com")
    fam_resp = await client.post(
        "/api/v1/families", json={"name": "Test Family"}, headers=_auth(user)
    )
    assert fam_resp.status_code == 201
    fam_id = fam_resp.json()["id"]
    add_resp = await client.post(
        f"/api/v1/families/{fam_id}/members",
        headers=_auth(user),
        json={"accountId": other.id},
    )
    assert add_resp.status_code == 200
    resp = await client.post(
        f"/api/v1/accounts/{account.id}/transfer",
        headers=_auth(user),
        json={"targetUserId": other.id},
    )
    assert resp.status_code == status.HTTP_204_NO_CONTENT
