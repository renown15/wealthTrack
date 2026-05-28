"""Tests for the family controller endpoints."""
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reference_data import ReferenceData
from app.models.user_profile import UserProfile
from app.services.auth import create_access_token


async def _make_user(db_session: AsyncSession, email: str) -> UserProfile:
    from sqlalchemy import select

    result = await db_session.execute(
        select(ReferenceData).where(
            ReferenceData.class_key == "user_type", ReferenceData.reference_value == "User"
        )
    )
    user_type = result.scalar_one()
    u = UserProfile(
        first_name="Member",
        last_name="User",
        email=email,
        password="hashed",
        is_active=True,
        type_id=user_type.id,
    )
    db_session.add(u)
    await db_session.flush()
    await db_session.refresh(u)
    return u


def _auth(user: UserProfile) -> dict[str, str]:
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


async def test_create_family(client: AsyncClient, user: UserProfile):
    resp = await client.post("/api/v1/families", json={"name": "The Smiths"}, headers=_auth(user))
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "The Smiths"
    assert data["isOwner"] is True
    assert any(m["accountId"] == user.id for m in data["members"])


async def test_create_family_duplicate_rejected(client: AsyncClient, user: UserProfile):
    await client.post("/api/v1/families", json={"name": "First"}, headers=_auth(user))
    resp = await client.post("/api/v1/families", json={"name": "Second"}, headers=_auth(user))
    assert resp.status_code == 400


async def test_list_families(client: AsyncClient, user: UserProfile):
    await client.post("/api/v1/families", json={"name": "My Family"}, headers=_auth(user))
    resp = await client.get("/api/v1/families", headers=_auth(user))
    assert resp.status_code == 200
    assert len(resp.json()) == 1


async def test_rename_family(client: AsyncClient, user: UserProfile):
    create = await client.post("/api/v1/families", json={"name": "Old"}, headers=_auth(user))
    fid = create.json()["id"]
    resp = await client.put(f"/api/v1/families/{fid}", json={"name": "New"}, headers=_auth(user))
    assert resp.status_code == 200
    assert resp.json()["name"] == "New"


async def test_rename_family_forbidden_for_non_owner(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    other = await _make_user(db_session, "notowner@example.com")
    create = await client.post("/api/v1/families", json={"name": "Mine"}, headers=_auth(user))
    fid = create.json()["id"]
    resp = await client.put(
        f"/api/v1/families/{fid}", json={"name": "Stolen"}, headers=_auth(other)
    )
    assert resp.status_code == 403


async def test_delete_family(client: AsyncClient, user: UserProfile):
    create = await client.post("/api/v1/families", json={"name": "To Delete"}, headers=_auth(user))
    fid = create.json()["id"]
    resp = await client.delete(f"/api/v1/families/{fid}", headers=_auth(user))
    assert resp.status_code == 204
    assert (await client.get("/api/v1/families", headers=_auth(user))).json() == []


async def test_delete_family_forbidden_for_non_owner(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    other = await _make_user(db_session, "cannotdelete@example.com")
    create = await client.post("/api/v1/families", json={"name": "Mine"}, headers=_auth(user))
    fid = create.json()["id"]
    resp = await client.delete(f"/api/v1/families/{fid}", headers=_auth(other))
    assert resp.status_code == 403


async def test_add_and_remove_member(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    other = await _make_user(db_session, "joinme@example.com")
    create = await client.post("/api/v1/families", json={"name": "Family"}, headers=_auth(user))
    fid = create.json()["id"]
    add = await client.post(
        f"/api/v1/families/{fid}/members",
        json={"accountId": other.id},
        headers=_auth(user),
    )
    assert add.status_code == 200
    assert any(m["accountId"] == other.id for m in add.json()["members"])
    remove = await client.delete(
        f"/api/v1/families/{fid}/members/{other.id}", headers=_auth(user)
    )
    assert remove.status_code == 200
    assert not any(m["accountId"] == other.id for m in remove.json()["members"])


async def test_add_member_forbidden_for_non_owner(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    other = await _make_user(db_session, "other2@example.com")
    third = await _make_user(db_session, "third@example.com")
    create = await client.post("/api/v1/families", json={"name": "Mine"}, headers=_auth(user))
    fid = create.json()["id"]
    resp = await client.post(
        f"/api/v1/families/{fid}/members",
        json={"accountId": third.id},
        headers=_auth(other),
    )
    assert resp.status_code == 403


async def test_get_available_members(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    other = await _make_user(db_session, "avail2@example.com")
    create = await client.post("/api/v1/families", json={"name": "Family"}, headers=_auth(user))
    fid = create.json()["id"]
    resp = await client.get(f"/api/v1/families/{fid}/available-members", headers=_auth(user))
    assert resp.status_code == 200
    ids = [m["id"] for m in resp.json()]
    assert other.id in ids
    assert user.id not in ids


async def test_member_portfolio_forbidden_for_non_member(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    other = await _make_user(db_session, "outsider@example.com")
    create = await client.post("/api/v1/families", json={"name": "Mine"}, headers=_auth(user))
    fid = create.json()["id"]
    resp = await client.get(
        f"/api/v1/families/{fid}/members/{user.id}/portfolio", headers=_auth(other)
    )
    assert resp.status_code == 403


async def test_member_portfolio_accessible_to_member(
    client: AsyncClient, user: UserProfile, db_session: AsyncSession
):
    other = await _make_user(db_session, "member2@example.com")
    create = await client.post("/api/v1/families", json={"name": "Family"}, headers=_auth(user))
    fid = create.json()["id"]
    await client.post(
        f"/api/v1/families/{fid}/members",
        json={"accountId": other.id},
        headers=_auth(user),
    )
    resp = await client.get(
        f"/api/v1/families/{fid}/members/{other.id}/portfolio", headers=_auth(user)
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "groups" in data
    assert "groupMembers" in data


async def test_rename_family_not_found(client: AsyncClient, user: UserProfile):
    resp = await client.put("/api/v1/families/99999", json={"name": "X"}, headers=_auth(user))
    assert resp.status_code == 404


async def test_delete_family_not_found(client: AsyncClient, user: UserProfile):
    resp = await client.delete("/api/v1/families/99999", headers=_auth(user))
    assert resp.status_code == 404


async def test_add_member_family_not_found(client: AsyncClient, user: UserProfile):
    resp = await client.post(
        "/api/v1/families/99999/members", json={"accountId": 2}, headers=_auth(user)
    )
    assert resp.status_code == 404


async def test_add_member_cannot_add_yourself(client: AsyncClient, user: UserProfile):
    create = await client.post("/api/v1/families", json={"name": "Self"}, headers=_auth(user))
    fid = create.json()["id"]
    resp = await client.post(
        f"/api/v1/families/{fid}/members", json={"accountId": user.id}, headers=_auth(user)
    )
    assert resp.status_code == 400


async def test_remove_member_family_not_found(client: AsyncClient, user: UserProfile):
    resp = await client.delete("/api/v1/families/99999/members/2", headers=_auth(user))
    assert resp.status_code == 404


async def test_remove_member_cannot_remove_yourself(client: AsyncClient, user: UserProfile):
    create = await client.post("/api/v1/families", json={"name": "Mine"}, headers=_auth(user))
    fid = create.json()["id"]
    resp = await client.delete(
        f"/api/v1/families/{fid}/members/{user.id}", headers=_auth(user)
    )
    assert resp.status_code == 400
