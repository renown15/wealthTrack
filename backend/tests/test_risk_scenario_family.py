"""Tests for risk scenario family visibility rules."""
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.family import Family
from app.models.family_member_account import FamilyMemberAccount
from app.models.reference_data import ReferenceData
from app.models.user_profile import UserProfile
from app.services.auth import create_access_token


async def _make_user(db_session: AsyncSession, email: str) -> UserProfile:
    result = await db_session.execute(
        select(ReferenceData).where(
            ReferenceData.class_key == "user_type", ReferenceData.reference_value == "User"
        )
    )
    user_type = result.scalar_one()
    u = UserProfile(
        first_name="Other", last_name="User", email=email,
        password="hashed", is_active=True, type_id=user_type.id,
    )
    db_session.add(u)
    await db_session.flush()
    await db_session.refresh(u)
    return u


async def _make_family(
    db_session: AsyncSession, owner: UserProfile, member: UserProfile
) -> None:
    fam = Family(name="Test Family", owner_id=owner.id)
    db_session.add(fam)
    await db_session.flush()
    await db_session.refresh(fam)
    db_session.add(FamilyMemberAccount(family_id=fam.id, account_id=owner.id))
    db_session.add(FamilyMemberAccount(family_id=fam.id, account_id=member.id))
    await db_session.flush()


def _auth(user: UserProfile) -> dict[str, str]:
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


async def _create_scenario(client: AsyncClient, user: UserProfile, name: str = "Plan"):
    resp = await client.post("/api/v1/scenarios", json={"name": name}, headers=_auth(user))
    assert resp.status_code == 201
    return resp.json()


# ─── Tests ────────────────────────────────────────────────────────────────────


async def test_family_member_can_view_scenario_in_list(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    other = await _make_user(db_session, "fammember@example.com")
    await _make_family(db_session, user, other)
    await db_session.commit()

    sid = (await _create_scenario(client, user, "Family Plan"))["scenarioId"]
    resp = await client.get("/api/v1/scenarios", headers=_auth(other))
    assert resp.status_code == 200
    assert any(s["scenarioId"] == sid for s in resp.json())


async def test_family_member_sees_is_owner_false(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    other = await _make_user(db_session, "notowner2@example.com")
    await _make_family(db_session, user, other)
    await db_session.commit()

    sid = (await _create_scenario(client, user, "Owner Scenario"))["scenarioId"]
    resp = await client.get("/api/v1/scenarios", headers=_auth(other))
    scenario = next(s for s in resp.json() if s["scenarioId"] == sid)
    assert scenario["isOwner"] is False


async def test_non_family_user_cannot_view_scenario(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    outsider = await _make_user(db_session, "outsider@example.com")
    await db_session.commit()

    sid = (await _create_scenario(client, user, "Private"))["scenarioId"]
    resp = await client.get("/api/v1/scenarios", headers=_auth(outsider))
    assert not any(s["scenarioId"] == sid for s in resp.json())


async def test_family_member_cannot_delete_owners_scenario(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    other = await _make_user(db_session, "nodelother@example.com")
    await _make_family(db_session, user, other)
    await db_session.commit()

    sid = (await _create_scenario(client, user, "Owner's Plan"))["scenarioId"]
    resp = await client.delete(f"/api/v1/scenarios/{sid}", headers=_auth(other))
    assert resp.status_code == 403


async def test_family_member_cannot_add_group_to_owners_scenario(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    other = await _make_user(db_session, "noaddgrp@example.com")
    await _make_family(db_session, user, other)
    await db_session.commit()

    sid = (await _create_scenario(client, user))["scenarioId"]
    resp = await client.post(
        f"/api/v1/scenarios/{sid}/groups", json={"name": "X"}, headers=_auth(other)
    )
    assert resp.status_code == 403
