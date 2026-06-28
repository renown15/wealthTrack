"""Tests that Shares capital gain/CGT only count sales within the tax period."""
from datetime import date, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

import app.services.tax_service as svc


def _patch_repos(monkeypatch, group, captured):
    class FakeReturnRepo:
        def __init__(self, _s):
            pass

        async def upsert(self, _uid, _aid, _pid, income, gain, tax, tax_due=None):
            captured["upsert"] = (income, gain, tax, tax_due)
            return MagicMock(id=1, scope_status_id=None, tax_due=tax_due)

        async def get_or_create(self, *_a, **_k):
            return MagicMock(id=1, scope_status_id=None)

    class FakeDocRepo:
        def __init__(self, _s):
            pass

        async def list_for_return(self, _rid, _uid):
            return []

    class FakeGroupRepo:
        def __init__(self, _s):
            pass

        async def get_groups_for_account(self, _aid, _uid, _gtype):
            return [group]

    monkeypatch.setattr(svc, "TaxReturnRepository", FakeReturnRepo)
    monkeypatch.setattr(svc, "TaxDocumentRepository", FakeDocRepo)
    monkeypatch.setattr(svc, "EventGroupRepository", FakeGroupRepo)


def _sale_group(created: datetime) -> dict:
    return {
        "group_id": 1,
        "created_at": created,
        "events": [{"event_type": "Capital Gains Tax", "value": "200"}],
        "attributes": [{"attribute_type": "Capital Gain", "value": "1000"}],
    }


async def _run(monkeypatch, created: datetime):
    captured: dict = {}
    _patch_repos(monkeypatch, _sale_group(created), captured)
    account = MagicMock(id=5)
    items = [{"account": account, "account_type": "Shares", "eligibility_reason": "in_scope"}]
    await svc._enrich_items(
        AsyncMock(), 1, 10, items, {}, None, {5: 50.0}, None,
        date(2024, 4, 6), date(2025, 4, 5),
    )
    return captured["upsert"]


class TestSharesPeriodFiltering:
    @pytest.mark.asyncio
    async def test_excludes_sale_recorded_before_period(self, monkeypatch):
        income, gain, tax, due = await _run(monkeypatch, datetime(2023, 6, 1))
        assert gain is None  # sale in 2023, outside 2024/25
        assert income == 50.0  # dividends still synced for the in-scope shares account
        assert tax is None and due is None  # CGT lives on the Tax Liability account

    @pytest.mark.asyncio
    async def test_includes_sale_recorded_within_period(self, monkeypatch):
        income, gain, tax, due = await _run(monkeypatch, datetime(2024, 8, 1))
        assert gain == 1000.0
        assert income == 50.0
        assert tax is None and due is None  # shares never carry CGT as tax_taken_off/tax_due

    @pytest.mark.asyncio
    async def test_tax_liability_balance_routes_to_tax_due(self, monkeypatch):
        captured: dict = {}
        _patch_repos(monkeypatch, _sale_group(datetime(2024, 8, 1)), captured)
        account = MagicMock(id=9)
        items = [{"account": account, "account_type": "Tax Liability",
                  "eligibility_reason": "in_scope", "_tax_balance": 1200.0}]
        await svc._enrich_items(
            AsyncMock(), 1, 10, items, {}, None, {}, None,
            date(2024, 4, 6), date(2025, 4, 5),
        )
        _income, _gain, tax, due = captured["upsert"]
        assert due == 1200.0       # provision pot = tax due
        assert tax is None         # not tax taken off
