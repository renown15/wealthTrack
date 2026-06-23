"""Tests for risk scenario account assignment endpoints."""
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
    db_session: AsyncSession, user: UserProfile, institution: Institution, name: str = "Account"
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


async def _create_scenario(client: AsyncClient, user: UserProfile):
    resp = await client.post("/api/v1/scenarios", json={"name": "S"}, headers=_auth(user))
    assert resp.status_code == 201
    return resp.json()


async def _add_group(client: AsyncClient, user: UserProfile, sid: int, name: str):
    resp = await client.post(
        f"/api/v1/scenarios/{sid}/groups", json={"name": name}, headers=_auth(user)
    )
    assert resp.status_code == 201
    return resp.json()


async def _assign(
    client: AsyncClient, user: UserProfile, sid: int, account_id: int, group_id: int | None
) -> int:
    resp = await client.post(
        f"/api/v1/scenarios/{sid}/assignments",
        json={"accountId": account_id, "groupId": group_id},
        headers=_auth(user),
    )
    return resp.status_code


# ─── Tests ────────────────────────────────────────────────────────────────────


async def test_assign_account_to_group(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    inst = await _make_institution(db_session, user)
    acct = await _make_account(db_session, user, inst, "ISA")
    await db_session.commit()

    sid = (await _create_scenario(client, user))["scenarioId"]
    grp = await _add_group(client, user, sid, "Aggressive")
    assert await _assign(client, user, sid, acct.id, grp["groupId"]) == 204

    detail = (await client.get(f"/api/v1/scenarios/{sid}", headers=_auth(user))).json()
    group = next(g for g in detail["groups"] if g["groupId"] == grp["groupId"])
    assert any(a["accountId"] == acct.id for a in group["accounts"])
    assert not any(a["accountId"] == acct.id for a in detail["unassigned"])


async def test_unassign_account(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    inst = await _make_institution(db_session, user)
    acct = await _make_account(db_session, user, inst, "SIPP")
    await db_session.commit()

    sid = (await _create_scenario(client, user))["scenarioId"]
    grp = await _add_group(client, user, sid, "G")
    await _assign(client, user, sid, acct.id, grp["groupId"])
    assert await _assign(client, user, sid, acct.id, None) == 204

    detail = (await client.get(f"/api/v1/scenarios/{sid}", headers=_auth(user))).json()
    group = next(g for g in detail["groups"] if g["groupId"] == grp["groupId"])
    assert not any(a["accountId"] == acct.id for a in group["accounts"])
    assert any(a["accountId"] == acct.id for a in detail["unassigned"])


async def test_reassign_moves_between_groups(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    inst = await _make_institution(db_session, user)
    acct = await _make_account(db_session, user, inst, "Pension")
    await db_session.commit()

    sid = (await _create_scenario(client, user))["scenarioId"]
    g1 = await _add_group(client, user, sid, "Low")
    g2 = await _add_group(client, user, sid, "High")
    await _assign(client, user, sid, acct.id, g1["groupId"])
    await _assign(client, user, sid, acct.id, g2["groupId"])

    detail = (await client.get(f"/api/v1/scenarios/{sid}", headers=_auth(user))).json()
    grp1 = next(g for g in detail["groups"] if g["groupId"] == g1["groupId"])
    grp2 = next(g for g in detail["groups"] if g["groupId"] == g2["groupId"])
    assert not any(a["accountId"] == acct.id for a in grp1["accounts"])
    assert any(a["accountId"] == acct.id for a in grp2["accounts"])


async def test_assign_forbidden_non_owner(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    other = await _make_user(db_session, "noassign@example.com")
    inst = await _make_institution(db_session, user)
    acct = await _make_account(db_session, user, inst)
    await db_session.commit()

    sid = (await _create_scenario(client, user))["scenarioId"]
    grp = await _add_group(client, user, sid, "G")
    assert await _assign(client, other, sid, acct.id, grp["groupId"]) == 403


async def test_assign_scenario_not_found(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    inst = await _make_institution(db_session, user)
    acct = await _make_account(db_session, user, inst)
    await db_session.commit()
    assert await _assign(client, user, 99999, acct.id, 1) == 404
