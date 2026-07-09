"""Tests for outgoing_cost_service.get_projections — provision cost projection."""
from datetime import date, timedelta
from unittest.mock import AsyncMock

import pytest

from app.services.outgoing_cost_service import get_projections


def _patch_actuals(monkeypatch, rows):
    import app.services.outgoing_cost_service as svc

    async def fake_fetch(user_id, session):
        return rows

    monkeypatch.setattr(svc, "_fetch_actuals", fake_fetch)


def _days_ago(days: int) -> str:
    return (date.today() - timedelta(days=days)).isoformat()


class TestGetProjections:
    @pytest.mark.asyncio
    async def test_averages_actuals_within_trailing_year(self, monkeypatch):
        _patch_actuals(monkeypatch, [
            (1, "100.00", _days_ago(30)),
            (1, "140.00", _days_ago(60)),
            (1, "120.00", _days_ago(90)),
        ])
        result = await get_projections(1, AsyncMock())
        assert len(result) == 1
        assert result[0].account_id == 1
        assert result[0].projected_cost == "120.00"
        assert result[0].actuals_count == 3

    @pytest.mark.asyncio
    async def test_excludes_actuals_older_than_a_year_from_average(self, monkeypatch):
        _patch_actuals(monkeypatch, [
            (1, "100.00", _days_ago(30)),
            (1, "900.00", _days_ago(500)),
        ])
        result = await get_projections(1, AsyncMock())
        assert result[0].projected_cost == "100.00"
        assert result[0].actuals_count == 2

    @pytest.mark.asyncio
    async def test_falls_back_to_most_recent_when_all_actuals_are_old(self, monkeypatch):
        _patch_actuals(monkeypatch, [
            (1, "900.00", _days_ago(700)),
            (1, "150.00", _days_ago(400)),
        ])
        result = await get_projections(1, AsyncMock())
        assert result[0].projected_cost == "150.00"

    @pytest.mark.asyncio
    async def test_groups_by_account_and_sorts(self, monkeypatch):
        _patch_actuals(monkeypatch, [
            (7, "50.00", _days_ago(10)),
            (2, "80.00", _days_ago(10)),
        ])
        result = await get_projections(1, AsyncMock())
        assert [p.account_id for p in result] == [2, 7]

    @pytest.mark.asyncio
    async def test_skips_unparseable_rows(self, monkeypatch):
        _patch_actuals(monkeypatch, [
            (1, "not-a-number", _days_ago(10)),
            (1, "100.00", "garbage-date"),
        ])
        result = await get_projections(1, AsyncMock())
        assert result == []

    @pytest.mark.asyncio
    async def test_rounds_to_two_decimal_places(self, monkeypatch):
        _patch_actuals(monkeypatch, [
            (1, "100.00", _days_ago(10)),
            (1, "100.01", _days_ago(20)),
            (1, "100.01", _days_ago(30)),
        ])
        result = await get_projections(1, AsyncMock())
        assert result[0].projected_cost == "100.01"
