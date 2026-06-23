"""Tests for institution list visibility rules for family members."""
import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.institution import Institution
from app.models.reference_data import ReferenceData
from app.models.user_profile import UserProfile
from app.repositories.family_repository import FamilyRepository


async def _make_user(db_session: AsyncSession, email: str) -> UserProfile:
    result = await db_session.execute(
        select(ReferenceData).where(
            ReferenceData.class_key == "user_type", ReferenceData.reference_value == "User"
        )
    )
    user_type = result.scalar_one()
    u = UserProfile(first_name="Other", last_name="User", email=email,
                    password="hashed", is_active=True, type_id=user_type.id)
    db_session.add(u)
    await db_session.flush()
    await db_session.refresh(u)
    return u


async def _make_account(db_session: AsyncSession, user: UserProfile, inst: Institution) -> Account:
    acct_type = (await db_session.execute(
        select(ReferenceData).where(
            ReferenceData.class_key == "account_type",
            ReferenceData.reference_value == "Checking Account",
        )
    )).scalar_one()
    acct_status = (await db_session.execute(
        select(ReferenceData).where(
            ReferenceData.class_key == "account_status",
            ReferenceData.reference_value == "Active",
        )
    )).scalar_one()
    acct = Account(
        user_id=user.id, institution_id=inst.id,
        name="Test Account", type_id=acct_type.id, status_id=acct_status.id,
    )
    db_session.add(acct)
    await db_session.flush()
    return acct


@pytest.mark.asyncio
async def test_list_institutions_includes_family_member_institutions(
    client: AsyncClient,
    db_session: AsyncSession,
    user: UserProfile,
    authenticated_headers: dict[str, str],
):
    """Family member institutions with accounts appear in the institution list."""
    other = await _make_user(db_session, "peer@example.com")
    repo = FamilyRepository(db_session)
    family = await repo.create("Our Family", user.id)
    await repo.add_member(family.id, other.id)
    peer_inst = Institution(user_id=other.id, name="Peer's Bank")
    db_session.add(peer_inst)
    await db_session.flush()
    await _make_account(db_session, other, peer_inst)
    await db_session.commit()
    response = await client.get("/api/v1/institutions", headers=authenticated_headers)
    assert response.status_code == status.HTTP_200_OK
    names = [i["name"] for i in response.json()]
    assert "Peer's Bank" in names


@pytest.mark.asyncio
async def test_list_institutions_excludes_non_family_institutions(
    client: AsyncClient,
    db_session: AsyncSession,
    user: UserProfile,
    authenticated_headers: dict[str, str],
):
    """Institutions from unrelated users do not appear in the list."""
    stranger = await _make_user(db_session, "stranger@example.com")
    stranger_inst = Institution(user_id=stranger.id, name="Stranger's Bank")
    db_session.add(stranger_inst)
    await db_session.flush()
    await db_session.commit()
    response = await client.get("/api/v1/institutions", headers=authenticated_headers)
    assert response.status_code == status.HTTP_200_OK
    names = [i["name"] for i in response.json()]
    assert "Stranger's Bank" not in names


@pytest.mark.asyncio
async def test_list_institutions_excludes_family_institutions_with_no_accounts(
    client: AsyncClient,
    db_session: AsyncSession,
    user: UserProfile,
    authenticated_headers: dict[str, str],
):
    """Family member institutions with no accounts must not appear in the list."""
    other = await _make_user(db_session, "empty-inst@example.com")
    repo = FamilyRepository(db_session)
    family = await repo.create("Our Family", user.id)
    await repo.add_member(family.id, other.id)
    empty_inst = Institution(user_id=other.id, name="Empty Bank")
    db_session.add(empty_inst)
    await db_session.commit()
    response = await client.get("/api/v1/institutions", headers=authenticated_headers)
    assert response.status_code == status.HTTP_200_OK
    names = [i["name"] for i in response.json()]
    assert "Empty Bank" not in names
