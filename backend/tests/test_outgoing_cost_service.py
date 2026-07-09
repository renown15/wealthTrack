"""Tests for outgoing_cost_service — actual costs CRUD and projections."""
from datetime import date
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.models.account_event import AccountEvent
from app.models.account_event_attribute_group import AccountEventAttributeGroup
from app.models.reference_data import ReferenceData
from app.services.outgoing_cost_service import (
    delete_actual_cost,
    list_actual_costs,
    record_actual_cost,
)

# ── helpers ───────────────────────────────────────────────────────────────────


def _make_account_repo(found: bool = True):
    repo = AsyncMock()
    repo.get_by_id = AsyncMock(return_value=MagicMock(id=1) if found else None)
    return repo


def _make_event_repo(missing_type: bool = False):
    repo = AsyncMock()
    type_map = {"Actual Cost": 30, "Actual Cost Date": 31}
    repo.get_event_type_id = AsyncMock(
        side_effect=lambda name: None if missing_type else type_map.get(name)
    )
    repo.create_event = AsyncMock(side_effect=lambda *a, **kw: MagicMock(id=60))
    return repo


def _make_group_repo(groups: list | None = None):
    repo = AsyncMock()
    repo.create_group = AsyncMock(return_value=MagicMock(id=88))
    repo.add_event_member = AsyncMock()
    repo.get_groups_for_account = AsyncMock(return_value=groups or [])
    return repo


def _patch_repos(monkeypatch, account_repo=None, event_repo=None, group_repo=None):
    import app.services.outgoing_cost_service as svc
    monkeypatch.setattr(svc, "AccountRepository", lambda s: account_repo or _make_account_repo())
    monkeypatch.setattr(svc, "AccountEventRepository", lambda s: event_repo or _make_event_repo())
    monkeypatch.setattr(svc, "EventGroupRepository", lambda s: group_repo or _make_group_repo())


def _group(group_id: int, amount: str | None, cost_date: str | None):
    events = []
    if amount is not None:
        events.append({"event_type": "Actual Cost", "value": amount})
    if cost_date is not None:
        events.append({"event_type": "Actual Cost Date", "value": cost_date})
    return {"group_id": group_id, "created_at": None, "events": events, "attributes": []}


# ── record_actual_cost ────────────────────────────────────────────────────────


class TestRecordActualCost:
    @pytest.mark.asyncio
    async def test_creates_group_with_cost_and_date_events(self, monkeypatch):
        event_repo = _make_event_repo()
        group_repo = _make_group_repo()
        _patch_repos(monkeypatch, event_repo=event_repo, group_repo=group_repo)

        item = await record_actual_cost(1, 1, "142.50", date(2026, 6, 1), AsyncMock())

        assert item.group_id == 88
        assert item.amount == "142.50"
        assert item.cost_date == "2026-06-01"
        group_repo.create_group.assert_awaited_once_with(1, "Actual Cost")
        assert event_repo.create_event.await_count == 2
        assert group_repo.add_event_member.await_count == 2
        # The date event stores the ISO date as its value
        date_call = event_repo.create_event.await_args_list[1]
        assert date_call.args[3] == "2026-06-01"

    @pytest.mark.asyncio
    async def test_raises_when_account_not_found(self, monkeypatch):
        _patch_repos(monkeypatch, account_repo=_make_account_repo(found=False))
        with pytest.raises(ValueError, match="Account not found"):
            await record_actual_cost(1, 1, "10", date(2026, 6, 1), AsyncMock())

    @pytest.mark.asyncio
    async def test_raises_when_event_types_missing(self, monkeypatch):
        _patch_repos(monkeypatch, event_repo=_make_event_repo(missing_type=True))
        with pytest.raises(ValueError, match="Required event types"):
            await record_actual_cost(1, 1, "10", date(2026, 6, 1), AsyncMock())


# ── list_actual_costs ─────────────────────────────────────────────────────────


class TestListActualCosts:
    @pytest.mark.asyncio
    async def test_maps_groups_to_items_newest_first(self, monkeypatch):
        group_repo = _make_group_repo(groups=[
            _group(1, "100.00", "2026-01-15"),
            _group(2, "120.00", "2026-05-15"),
        ])
        _patch_repos(monkeypatch, group_repo=group_repo)

        items = await list_actual_costs(1, 1, AsyncMock())

        assert [i.group_id for i in items] == [2, 1]
        assert items[0].amount == "120.00"
        assert items[0].cost_date == "2026-05-15"

    @pytest.mark.asyncio
    async def test_skips_corrupt_groups(self, monkeypatch):
        group_repo = _make_group_repo(groups=[
            _group(1, "100.00", None),
            _group(2, None, "2026-05-15"),
            _group(3, "90.00", "2026-04-01"),
        ])
        _patch_repos(monkeypatch, group_repo=group_repo)

        items = await list_actual_costs(1, 1, AsyncMock())

        assert [i.group_id for i in items] == [3]


# ── delete_actual_cost ────────────────────────────────────────────────────────


class TestDeleteActualCost:
    @pytest.mark.asyncio
    async def test_raises_when_group_not_found(self):
        session = AsyncMock()
        session.get = AsyncMock(return_value=None)
        with pytest.raises(ValueError, match="Actual cost not found"):
            await delete_actual_cost(99, 1, session)

    @pytest.mark.asyncio
    async def test_raises_when_group_belongs_to_other_user(self):
        session = AsyncMock()
        session.get = AsyncMock(return_value=MagicMock(id=88, user_id=9))
        with pytest.raises(ValueError, match="Actual cost not found"):
            await delete_actual_cost(88, 1, session)

    @pytest.mark.asyncio
    async def test_raises_when_group_is_wrong_type(self):
        session = AsyncMock()

        async def mock_get(cls, pk):
            if cls is AccountEventAttributeGroup:
                return MagicMock(id=88, user_id=1, type_id=3)
            return MagicMock(reference_value="Gift")

        session.get = AsyncMock(side_effect=mock_get)
        with pytest.raises(ValueError, match="Actual cost not found"):
            await delete_actual_cost(88, 1, session)

    @pytest.mark.asyncio
    async def test_deletes_members_events_and_group(self):
        group = MagicMock(id=88, user_id=1, type_id=4)
        cost_ev = MagicMock(id=60)
        members = [MagicMock(account_event_id=60), MagicMock(account_event_id=61)]
        members_result = MagicMock()
        members_result.scalars = lambda: MagicMock(all=lambda: members)

        async def mock_get(cls, pk):
            if cls is AccountEventAttributeGroup:
                return group
            if cls is ReferenceData:
                return MagicMock(reference_value="Actual Cost")
            if cls is AccountEvent:
                return cost_ev if pk == 60 else None
            return None

        session = AsyncMock()
        session.get = AsyncMock(side_effect=mock_get)
        session.execute = AsyncMock(return_value=members_result)
        session.delete = AsyncMock()

        await delete_actual_cost(88, 1, session)

        # 2 members + 1 hydrated event + the group itself
        assert session.delete.await_count == 4
