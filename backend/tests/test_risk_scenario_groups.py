"""Tests for risk scenario group endpoints."""
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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


def _auth(user: UserProfile) -> dict[str, str]:
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


async def _create_scenario(
    client: AsyncClient, user: UserProfile, name: str = "My Scenario"
):
    resp = await client.post("/api/v1/scenarios", json={"name": name}, headers=_auth(user))
    assert resp.status_code == 201
    return resp.json()


async def _add_group(client: AsyncClient, user: UserProfile, sid: int, name: str):
    resp = await client.post(
        f"/api/v1/scenarios/{sid}/groups", json={"name": name}, headers=_auth(user)
    )
    assert resp.status_code == 201
    return resp.json()


# ─── Add group ────────────────────────────────────────────────────────────────


async def test_add_group(client: AsyncClient, user: UserProfile):
    sid = (await _create_scenario(client, user))["scenarioId"]
    data = await _add_group(client, user, sid, "High Risk")
    assert data["name"] == "High Risk"
    assert data["sortOrder"] == 0
    assert data["accounts"] == []
    assert "linkId" in data and "groupId" in data


async def test_add_group_increments_sort_order(client: AsyncClient, user: UserProfile):
    sid = (await _create_scenario(client, user))["scenarioId"]
    g1 = await _add_group(client, user, sid, "First")
    g2 = await _add_group(client, user, sid, "Second")
    assert g1["sortOrder"] == 0
    assert g2["sortOrder"] == 1


async def test_add_group_scenario_not_found(client: AsyncClient, user: UserProfile):
    resp = await client.post(
        "/api/v1/scenarios/99999/groups", json={"name": "X"}, headers=_auth(user)
    )
    assert resp.status_code == 404


async def test_add_group_forbidden_non_owner(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    other = await _make_user(db_session, "nogrp@example.com")
    sid = (await _create_scenario(client, user))["scenarioId"]
    resp = await client.post(
        f"/api/v1/scenarios/{sid}/groups", json={"name": "X"}, headers=_auth(other)
    )
    assert resp.status_code == 403


async def test_group_count_reflected_in_list(client: AsyncClient, user: UserProfile):
    sid = (await _create_scenario(client, user))["scenarioId"]
    await _add_group(client, user, sid, "G1")
    await _add_group(client, user, sid, "G2")
    scenarios = (await client.get("/api/v1/scenarios", headers=_auth(user))).json()
    scenario = next(s for s in scenarios if s["scenarioId"] == sid)
    assert scenario["groupCount"] == 2


# ─── Rename group ─────────────────────────────────────────────────────────────


async def test_rename_group(client: AsyncClient, user: UserProfile):
    sid = (await _create_scenario(client, user))["scenarioId"]
    lid = (await _add_group(client, user, sid, "Old"))["linkId"]
    resp = await client.put(
        f"/api/v1/scenarios/{sid}/groups/{lid}", json={"name": "New"}, headers=_auth(user)
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "New"


async def test_rename_group_forbidden_non_owner(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    other = await _make_user(db_session, "norengrp@example.com")
    sid = (await _create_scenario(client, user))["scenarioId"]
    lid = (await _add_group(client, user, sid, "X"))["linkId"]
    resp = await client.put(
        f"/api/v1/scenarios/{sid}/groups/{lid}", json={"name": "Y"}, headers=_auth(other)
    )
    assert resp.status_code == 403


async def test_rename_group_not_found(client: AsyncClient, user: UserProfile):
    sid = (await _create_scenario(client, user))["scenarioId"]
    resp = await client.put(
        f"/api/v1/scenarios/{sid}/groups/99999", json={"name": "X"}, headers=_auth(user)
    )
    assert resp.status_code == 404


# ─── Delete group ─────────────────────────────────────────────────────────────


async def test_delete_group(client: AsyncClient, user: UserProfile):
    sid = (await _create_scenario(client, user))["scenarioId"]
    lid = (await _add_group(client, user, sid, "To Delete"))["linkId"]
    assert (
        await client.delete(f"/api/v1/scenarios/{sid}/groups/{lid}", headers=_auth(user))
    ).status_code == 204
    detail = (await client.get(f"/api/v1/scenarios/{sid}", headers=_auth(user))).json()
    assert detail["groups"] == []


async def test_delete_group_forbidden_non_owner(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    other = await _make_user(db_session, "nodelgrp@example.com")
    sid = (await _create_scenario(client, user))["scenarioId"]
    lid = (await _add_group(client, user, sid, "X"))["linkId"]
    resp = await client.delete(f"/api/v1/scenarios/{sid}/groups/{lid}", headers=_auth(other))
    assert resp.status_code == 403


async def test_delete_group_not_found(client: AsyncClient, user: UserProfile):
    sid = (await _create_scenario(client, user))["scenarioId"]
    assert (
        await client.delete(f"/api/v1/scenarios/{sid}/groups/99999", headers=_auth(user))
    ).status_code == 404
