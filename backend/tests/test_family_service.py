"""Unit tests for FamilyService — error/None paths."""
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.family_service import FamilyService


def _make_family(owner_id: int = 1, members: list | None = None) -> MagicMock:
    f = MagicMock()
    f.id = 10
    f.name = "Test Family"
    f.owner_id = owner_id
    f.members = members or []
    f.created_at = None
    f.updated_at = None
    return f


def _make_repo(family: MagicMock | None = None) -> AsyncMock:
    repo = AsyncMock()
    repo.get_by_id = AsyncMock(return_value=family)
    repo.get_owned_family = AsyncMock(return_value=None)
    repo.get_families_for_user = AsyncMock(return_value=[])
    repo.create = AsyncMock(return_value=_make_family())
    repo.update_name = AsyncMock(return_value=_make_family())
    repo.delete = AsyncMock()
    repo.add_member = AsyncMock()
    repo.remove_member = AsyncMock()
    repo.is_member = AsyncMock(return_value=False)
    return repo


def _svc(repo: AsyncMock) -> FamilyService:
    svc = FamilyService(AsyncMock())
    svc.repo = repo
    return svc


class TestRenameFamilyNotFound:
    @pytest.mark.asyncio
    async def test_returns_none_when_family_missing(self):
        svc = _svc(_make_repo(family=None))
        result = await svc.rename_family(99, "New", user_id=1)
        assert result is None

    @pytest.mark.asyncio
    async def test_raises_permission_error_for_non_owner(self):
        svc = _svc(_make_repo(family=_make_family(owner_id=5)))
        with pytest.raises(PermissionError):
            await svc.rename_family(10, "New", user_id=1)


class TestDeleteFamilyNotFound:
    @pytest.mark.asyncio
    async def test_returns_false_when_family_missing(self):
        svc = _svc(_make_repo(family=None))
        result = await svc.delete_family(99, user_id=1)
        assert result is False

    @pytest.mark.asyncio
    async def test_raises_permission_error_for_non_owner(self):
        svc = _svc(_make_repo(family=_make_family(owner_id=5)))
        with pytest.raises(PermissionError):
            await svc.delete_family(10, user_id=1)


class TestAddMemberEdgeCases:
    @pytest.mark.asyncio
    async def test_returns_none_when_family_missing(self):
        svc = _svc(_make_repo(family=None))
        result = await svc.add_member(99, account_id=2, user_id=1)
        assert result is None

    @pytest.mark.asyncio
    async def test_raises_permission_error_for_non_owner(self):
        svc = _svc(_make_repo(family=_make_family(owner_id=5)))
        with pytest.raises(PermissionError):
            await svc.add_member(10, account_id=2, user_id=1)

    @pytest.mark.asyncio
    async def test_raises_value_error_when_adding_yourself(self):
        svc = _svc(_make_repo(family=_make_family(owner_id=1)))
        with pytest.raises(ValueError, match="Cannot add yourself"):
            await svc.add_member(10, account_id=1, user_id=1)


class TestRemoveMemberEdgeCases:
    @pytest.mark.asyncio
    async def test_returns_none_when_family_missing(self):
        svc = _svc(_make_repo(family=None))
        result = await svc.remove_member(99, member_id=2, user_id=1)
        assert result is None

    @pytest.mark.asyncio
    async def test_raises_permission_error_for_non_owner(self):
        svc = _svc(_make_repo(family=_make_family(owner_id=5)))
        with pytest.raises(PermissionError):
            await svc.remove_member(10, member_id=2, user_id=1)

    @pytest.mark.asyncio
    async def test_raises_value_error_when_removing_yourself(self):
        svc = _svc(_make_repo(family=_make_family(owner_id=1)))
        with pytest.raises(ValueError, match="Cannot remove yourself"):
            await svc.remove_member(10, member_id=1, user_id=1)


class TestVerifyMembership:
    @pytest.mark.asyncio
    async def test_returns_true_when_both_are_members(self):
        repo = _make_repo()
        repo.is_member = AsyncMock(return_value=True)
        svc = _svc(repo)
        result = await svc.verify_membership(10, member_id=2, user_id=1)
        assert result is True

    @pytest.mark.asyncio
    async def test_returns_false_when_current_user_not_member(self):
        repo = _make_repo()
        repo.is_member = AsyncMock(side_effect=[False, True])
        svc = _svc(repo)
        result = await svc.verify_membership(10, member_id=2, user_id=1)
        assert result is False

    @pytest.mark.asyncio
    async def test_returns_false_when_target_not_member(self):
        repo = _make_repo()
        repo.is_member = AsyncMock(side_effect=[True, False])
        svc = _svc(repo)
        result = await svc.verify_membership(10, member_id=2, user_id=1)
        assert result is False
