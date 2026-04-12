"""Tests for EventGroupRepository."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.repositories.event_group_repository import EventGroupRepository


def _make_repo() -> tuple[EventGroupRepository, AsyncMock]:
    session = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    repo = EventGroupRepository(session)
    return repo, session


def _scalar_result(value):
    mock = MagicMock()
    mock.scalar_one_or_none.return_value = value
    return mock


class TestGetGroupTypeId:
    @pytest.mark.asyncio
    async def test_returns_id_when_found(self):
        repo, session = _make_repo()
        session.execute = AsyncMock(return_value=_scalar_result(42))
        result = await repo.get_group_type_id("Share Sale")
        assert result == 42

    @pytest.mark.asyncio
    async def test_returns_none_when_not_found(self):
        repo, session = _make_repo()
        session.execute = AsyncMock(return_value=_scalar_result(None))
        result = await repo.get_group_type_id("Unknown")
        assert result is None


class TestCreateGroup:
    @pytest.mark.asyncio
    async def test_raises_when_type_not_found(self):
        repo, session = _make_repo()
        session.execute = AsyncMock(return_value=_scalar_result(None))
        with pytest.raises(ValueError, match="Unknown event group type"):
            await repo.create_group(1, "Bogus Type")

    @pytest.mark.asyncio
    async def test_creates_group_with_correct_fields(self):
        repo, session = _make_repo()
        session.execute = AsyncMock(return_value=_scalar_result(5))
        mock_group = MagicMock()
        mock_group.id = 10
        session.refresh = AsyncMock(side_effect=lambda obj: None)

        with patch("app.repositories.event_group_repository.AccountEventAttributeGroup", return_value=mock_group):
            group = await repo.create_group(1, "Share Sale")

        assert group.user_id == 1
        assert group.type_id == 5
        session.add.assert_called_once_with(mock_group)
        session.flush.assert_called_once()


class TestAddEventMember:
    @pytest.mark.asyncio
    async def test_adds_event_member(self):
        repo, session = _make_repo()
        mock_member = MagicMock()

        with patch(
            "app.repositories.event_group_repository.AccountEventAttributeGroupMember",
            return_value=mock_member,
        ):
            member = await repo.add_event_member(group_id=10, account_event_id=20)

        assert member.group_id == 10
        assert member.account_event_id == 20
        assert member.account_attribute_id is None
        session.add.assert_called_once_with(mock_member)
        session.flush.assert_called_once()


class TestAddAttributeMember:
    @pytest.mark.asyncio
    async def test_adds_attribute_member(self):
        repo, session = _make_repo()
        mock_member = MagicMock()

        with patch(
            "app.repositories.event_group_repository.AccountEventAttributeGroupMember",
            return_value=mock_member,
        ):
            member = await repo.add_attribute_member(group_id=10, account_attribute_id=30)

        assert member.group_id == 10
        assert member.account_attribute_id == 30
        assert member.account_event_id is None
        session.add.assert_called_once_with(mock_member)
        session.flush.assert_called_once()


class TestGetGroupsForAccount:
    @pytest.mark.asyncio
    async def test_returns_empty_when_group_type_not_found(self):
        repo, session = _make_repo()
        session.execute = AsyncMock(return_value=_scalar_result(None))
        result = await repo.get_groups_for_account(1, 1, "Bogus")
        assert result == []

    @pytest.mark.asyncio
    async def test_returns_empty_when_no_event_group_ids(self):
        repo, session = _make_repo()
        type_result = _scalar_result(5)
        group_ids_result = MagicMock()
        group_ids_result.all.return_value = []
        session.execute = AsyncMock(side_effect=[type_result, group_ids_result])
        result = await repo.get_groups_for_account(1, 1, "Share Sale")
        assert result == []

    @pytest.mark.asyncio
    async def test_returns_groups_with_events_and_attributes(self):
        repo, session = _make_repo()

        type_result = _scalar_result(5)

        group_ids_result = MagicMock()
        group_ids_result.all.return_value = [(77,)]

        mock_group = MagicMock()
        mock_group.id = 77
        mock_group.created_at = "2026-01-01"
        groups_scalars = MagicMock()
        groups_scalars.scalars.return_value.all.return_value = [mock_group]

        # members: one event member, one attribute member
        event_member = MagicMock()
        event_member.account_event_id = 10
        event_member.account_attribute_id = None
        attr_member = MagicMock()
        attr_member.account_event_id = None
        attr_member.account_attribute_id = 20
        members_scalars = MagicMock()
        members_scalars.scalars.return_value.all.return_value = [event_member, attr_member]

        # event hydration
        mock_ev = MagicMock()
        mock_ev.id = 10
        mock_ev.account_id = 1
        mock_ev.value = "100"
        mock_ev.created_at = "2026-01-01"
        ev_result = MagicMock()
        ev_result.one_or_none.return_value = (mock_ev, "Share Sale")

        # attribute hydration
        mock_attr = MagicMock()
        mock_attr.id = 20
        mock_attr.account_id = 1
        mock_attr.value = "500"
        at_result = MagicMock()
        at_result.one_or_none.return_value = (mock_attr, "Capital Gain")

        session.execute = AsyncMock(side_effect=[
            type_result, group_ids_result, groups_scalars, members_scalars, ev_result, at_result,
        ])

        result = await repo.get_groups_for_account(1, 1, "Share Sale")
        assert len(result) == 1
        assert result[0]["group_id"] == 77
        assert len(result[0]["events"]) == 1
        assert result[0]["events"][0]["event_type"] == "Share Sale"
        assert len(result[0]["attributes"]) == 1
        assert result[0]["attributes"][0]["attribute_type"] == "Capital Gain"
