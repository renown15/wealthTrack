"""Tests for FamilyRepository."""
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_profile import UserProfile
from app.repositories.family_repository import FamilyRepository


async def _make_user(db_session: AsyncSession, email: str) -> UserProfile:
    from sqlalchemy import select

    from app.models.reference_data import ReferenceData

    result = await db_session.execute(
        select(ReferenceData).where(
            ReferenceData.class_key == "user_type", ReferenceData.reference_value == "User"
        )
    )
    user_type = result.scalar_one()
    u = UserProfile(
        first_name="Family",
        last_name="Tester",
        email=email,
        password="hashed",
        is_active=True,
        type_id=user_type.id,
    )
    db_session.add(u)
    await db_session.flush()
    await db_session.refresh(u)
    return u


async def test_create_family_adds_owner_as_member(db_session: AsyncSession, user: UserProfile):
    repo = FamilyRepository(db_session)
    family = await repo.create("Lewis Family", user.id)
    assert family.id is not None
    assert family.name == "Lewis Family"
    assert family.owner_id == user.id
    member_ids = [m.account_id for m in family.members]
    assert user.id in member_ids


async def test_get_families_for_user(db_session: AsyncSession, user: UserProfile):
    repo = FamilyRepository(db_session)
    await repo.create("My Family", user.id)
    families = await repo.get_families_for_user(user.id)
    assert len(families) == 1
    assert families[0].name == "My Family"


async def test_get_families_for_non_member_returns_empty(
    db_session: AsyncSession, user: UserProfile
):
    other = await _make_user(db_session, "other@example.com")
    repo = FamilyRepository(db_session)
    await repo.create("Someone's Family", user.id)
    families = await repo.get_families_for_user(other.id)
    assert families == []


async def test_get_owned_family(db_session: AsyncSession, user: UserProfile):
    repo = FamilyRepository(db_session)
    await repo.create("My Family", user.id)
    owned = await repo.get_owned_family(user.id)
    assert owned is not None
    assert owned.owner_id == user.id


async def test_get_owned_family_none_when_not_owner(db_session: AsyncSession, user: UserProfile):
    other = await _make_user(db_session, "noowner@example.com")
    repo = FamilyRepository(db_session)
    await repo.create("My Family", user.id)
    assert await repo.get_owned_family(other.id) is None


async def test_update_name(db_session: AsyncSession, user: UserProfile):
    repo = FamilyRepository(db_session)
    family = await repo.create("Old Name", user.id)
    updated = await repo.update_name(family.id, "New Name")
    assert updated.name == "New Name"


async def test_add_and_remove_member(db_session: AsyncSession, user: UserProfile):
    other = await _make_user(db_session, "member@example.com")
    repo = FamilyRepository(db_session)
    family = await repo.create("My Family", user.id)
    added = await repo.add_member(family.id, other.id)
    assert added is not None
    assert await repo.is_member(family.id, other.id)
    removed = await repo.remove_member(family.id, other.id)
    assert removed is True
    assert not await repo.is_member(family.id, other.id)


async def test_add_member_duplicate_returns_none(db_session: AsyncSession, user: UserProfile):
    other = await _make_user(db_session, "dup@example.com")
    repo = FamilyRepository(db_session)
    family = await repo.create("My Family", user.id)
    await repo.add_member(family.id, other.id)
    result = await repo.add_member(family.id, other.id)
    assert result is None


async def test_delete_family_cascades_members(db_session: AsyncSession, user: UserProfile):
    other = await _make_user(db_session, "cascade@example.com")
    repo = FamilyRepository(db_session)
    family = await repo.create("My Family", user.id)
    await repo.add_member(family.id, other.id)
    family_id = family.id
    await repo.delete(family_id)
    assert await repo.get_by_id(family_id) is None


async def test_get_available_members(db_session: AsyncSession, user: UserProfile):
    other = await _make_user(db_session, "avail@example.com")
    repo = FamilyRepository(db_session)
    family = await repo.create("My Family", user.id)
    available = await repo.get_available_members(family.id)
    ids = [u.id for u in available]
    assert other.id in ids
    assert user.id not in ids


async def test_get_available_members_excludes_existing(db_session: AsyncSession, user: UserProfile):
    other = await _make_user(db_session, "existing@example.com")
    repo = FamilyRepository(db_session)
    family = await repo.create("My Family", user.id)
    await repo.add_member(family.id, other.id)
    available = await repo.get_available_members(family.id)
    ids = [u.id for u in available]
    assert other.id not in ids


async def test_get_member_ids_for_user(db_session: AsyncSession, user: UserProfile):
    other = await _make_user(db_session, "peer@example.com")
    repo = FamilyRepository(db_session)
    family = await repo.create("My Family", user.id)
    await repo.add_member(family.id, other.id)
    member_ids = await repo.get_member_ids_for_user(user.id)
    assert other.id in member_ids
    assert user.id not in member_ids


async def test_get_member_ids_for_user_not_in_family(db_session: AsyncSession, user: UserProfile):
    repo = FamilyRepository(db_session)
    member_ids = await repo.get_member_ids_for_user(user.id)
    assert member_ids == []
