"""Tests for risk scenario CRUD and detail endpoints."""
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.institution import Institution
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


async def _make_institution(db_session: AsyncSession, user: UserProfile) -> Institution:
    inst = Institution(user_id=user.id, name="Test Bank")
    db_session.add(inst)
    await db_session.flush()
    await db_session.refresh(inst)
    return inst


async def _make_account(
    db_session: AsyncSession,
    user: UserProfile,
    institution: Institution,
    name: str = "Test Account",
) -> Account:
    result = await db_session.execute(
        select(ReferenceData).where(
            ReferenceData.class_key == "account_type",
            ReferenceData.reference_value == "Checking Account",
        )
    )
    acct_type = result.scalar_one()
    result2 = await db_session.execute(
        select(ReferenceData).where(
            ReferenceData.class_key == "account_status",
            ReferenceData.reference_value == "Active",
        )
    )
    status = result2.scalar_one()
    acct = Account(
        user_id=user.id, institution_id=institution.id,
        name=name, type_id=acct_type.id, status_id=status.id,
    )
    db_session.add(acct)
    await db_session.flush()
    await db_session.refresh(acct)
    return acct


def _auth(user: UserProfile) -> dict[str, str]:
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


async def _create_scenario(
    client: AsyncClient, user: UserProfile, name: str = "My Scenario"
):
    resp = await client.post("/api/v1/scenarios", json={"name": name}, headers=_auth(user))
    assert resp.status_code == 201
    return resp.json()


# ─── Scenario list / create ───────────────────────────────────────────────────


async def test_list_scenarios_empty(client: AsyncClient, user: UserProfile):
    resp = await client.get("/api/v1/scenarios", headers=_auth(user))
    assert resp.status_code == 200
    assert resp.json() == []


async def test_create_scenario(client: AsyncClient, user: UserProfile):
    resp = await client.post(
        "/api/v1/scenarios", json={"name": "Retirement"}, headers=_auth(user)
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Retirement"
    assert data["isOwner"] is True
    assert data["groupCount"] == 0
    assert "scenarioId" in data


async def test_list_scenarios_shows_own(client: AsyncClient, user: UserProfile):
    await _create_scenario(client, user, "Plan A")
    await _create_scenario(client, user, "Plan B")
    resp = await client.get("/api/v1/scenarios", headers=_auth(user))
    names = [s["name"] for s in resp.json()]
    assert "Plan A" in names and "Plan B" in names


# ─── Rename / delete ──────────────────────────────────────────────────────────


async def test_rename_scenario(client: AsyncClient, user: UserProfile):
    sid = (await _create_scenario(client, user, "Old"))["scenarioId"]
    resp = await client.put(
        f"/api/v1/scenarios/{sid}", json={"name": "New"}, headers=_auth(user)
    )
    assert resp.status_code == 200
    assert resp.json()["name"] == "New"


async def test_rename_scenario_forbidden_non_owner(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    other = await _make_user(db_session, "other@example.com")
    sid = (await _create_scenario(client, user, "Mine"))["scenarioId"]
    resp = await client.put(
        f"/api/v1/scenarios/{sid}", json={"name": "Stolen"}, headers=_auth(other)
    )
    assert resp.status_code == 403


async def test_rename_scenario_not_found(client: AsyncClient, user: UserProfile):
    resp = await client.put("/api/v1/scenarios/99999", json={"name": "X"}, headers=_auth(user))
    assert resp.status_code == 404


async def test_delete_scenario(client: AsyncClient, user: UserProfile):
    sid = (await _create_scenario(client, user))["scenarioId"]
    assert (await client.delete(f"/api/v1/scenarios/{sid}", headers=_auth(user))).status_code == 204
    assert (await client.get("/api/v1/scenarios", headers=_auth(user))).json() == []


async def test_delete_scenario_forbidden_non_owner(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    other = await _make_user(db_session, "nodel@example.com")
    sid = (await _create_scenario(client, user))["scenarioId"]
    resp = await client.delete(f"/api/v1/scenarios/{sid}", headers=_auth(other))
    assert resp.status_code == 403


async def test_delete_scenario_not_found(client: AsyncClient, user: UserProfile):
    assert (
        await client.delete("/api/v1/scenarios/99999", headers=_auth(user))
    ).status_code == 404


# ─── Scenario detail ──────────────────────────────────────────────────────────


async def test_get_scenario_detail_empty(client: AsyncClient, user: UserProfile):
    sid = (await _create_scenario(client, user, "Blank"))["scenarioId"]
    resp = await client.get(f"/api/v1/scenarios/{sid}", headers=_auth(user))
    assert resp.status_code == 200
    data = resp.json()
    assert data["scenarioId"] == sid
    assert data["name"] == "Blank"
    assert data["isOwner"] is True
    assert data["groups"] == []
    assert data["unassigned"] == []


async def test_get_scenario_detail_not_found(client: AsyncClient, user: UserProfile):
    assert (await client.get("/api/v1/scenarios/99999", headers=_auth(user))).status_code == 404


async def test_get_scenario_detail_shows_unassigned_accounts(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    inst = await _make_institution(db_session, user)
    await _make_account(db_session, user, inst, "Savings")
    await db_session.commit()

    sid = (await _create_scenario(client, user))["scenarioId"]
    resp = await client.get(f"/api/v1/scenarios/{sid}", headers=_auth(user))
    assert resp.status_code == 200
    assert any(a["name"] == "Savings" for a in resp.json()["unassigned"])
