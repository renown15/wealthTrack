"""Tests for AccountGroupRepository."""
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.user_profile import UserProfile
from app.repositories.account_group_repository import AccountGroupRepository


async def test_create_group(db_session: AsyncSession, user: UserProfile):
    repo = AccountGroupRepository(db_session)
    group = await repo.create(user.id, "Savings")
    assert group.id is not None
    assert group.name == "Savings"
    assert group.user_id == user.id


async def test_get_by_id_found(db_session: AsyncSession, user: UserProfile):
    repo = AccountGroupRepository(db_session)
    created = await repo.create(user.id, "ISAs")
    found = await repo.get_by_id(created.id, user.id)
    assert found is not None
    assert found.id == created.id


async def test_get_by_id_not_found(db_session: AsyncSession, user: UserProfile):
    repo = AccountGroupRepository(db_session)
    found = await repo.get_by_id(9999, user.id)
    assert found is None


async def test_get_by_user(db_session: AsyncSession, user: UserProfile):
    repo = AccountGroupRepository(db_session)
    await repo.create(user.id, "Group A")
    await repo.create(user.id, "Group B")
    groups = await repo.get_by_user(user.id)
    assert len(groups) == 2


async def test_update_group(db_session: AsyncSession, user: UserProfile):
    repo = AccountGroupRepository(db_session)
    group = await repo.create(user.id, "Old Name")
    updated = await repo.update(group.id, user.id, "New Name")
    assert updated is not None
    assert updated.name == "New Name"


async def test_update_group_not_found(db_session: AsyncSession, user: UserProfile):
    repo = AccountGroupRepository(db_session)
    result = await repo.update(9999, user.id, "Whatever")
    assert result is None


async def test_delete_group(db_session: AsyncSession, user: UserProfile):
    repo = AccountGroupRepository(db_session)
    group = await repo.create(user.id, "To Delete")
    result = await repo.delete(group.id, user.id)
    assert result is True
    found = await repo.get_by_id(group.id, user.id)
    assert found is None


async def test_delete_group_not_found(db_session: AsyncSession, user: UserProfile):
    repo = AccountGroupRepository(db_session)
    result = await repo.delete(9999, user.id)
    assert result is False


async def test_add_member(db_session: AsyncSession, user: UserProfile, account: Account):
    repo = AccountGroupRepository(db_session)
    group = await repo.create(user.id, "My Group")
    member = await repo.add_member(group.id, user.id, account.id)
    assert member is not None
    assert member.account_id == account.id


async def test_add_member_duplicate(db_session: AsyncSession, user: UserProfile, account: Account):
    repo = AccountGroupRepository(db_session)
    group = await repo.create(user.id, "My Group")
    await repo.add_member(group.id, user.id, account.id)
    duplicate = await repo.add_member(group.id, user.id, account.id)
    assert duplicate is None


async def test_add_member_group_not_found(
    db_session: AsyncSession, user: UserProfile, account: Account
):
    repo = AccountGroupRepository(db_session)
    result = await repo.add_member(9999, user.id, account.id)
    assert result is None


async def test_remove_member(db_session: AsyncSession, user: UserProfile, account: Account):
    repo = AccountGroupRepository(db_session)
    group = await repo.create(user.id, "My Group")
    await repo.add_member(group.id, user.id, account.id)
    result = await repo.remove_member(group.id, user.id, account.id)
    assert result is True


async def test_remove_member_not_in_group(
    db_session: AsyncSession, user: UserProfile, account: Account
):
    repo = AccountGroupRepository(db_session)
    group = await repo.create(user.id, "My Group")
    result = await repo.remove_member(group.id, user.id, account.id)
    assert result is False


async def test_remove_member_group_not_found(
    db_session: AsyncSession, user: UserProfile, account: Account
):
    repo = AccountGroupRepository(db_session)
    result = await repo.remove_member(9999, user.id, account.id)
    assert result is False


async def test_get_group_members_not_found(db_session: AsyncSession, user: UserProfile):
    repo = AccountGroupRepository(db_session)
    members = await repo.get_group_members(9999, user.id)
    assert members == []
