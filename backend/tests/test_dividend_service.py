"""Tests for dividend_service — _find_tax_account and record_dividend."""
from datetime import date
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.dividend_service import _find_tax_account, record_dividend

# ── helpers ───────────────────────────────────────────────────────────────────


def _scalar(value):
    r = MagicMock()
    r.scalar.return_value = value
    return r


def _make_session(*scalars):
    session = AsyncMock()
    session.execute = AsyncMock(side_effect=[_scalar(v) for v in scalars])
    return session


def _make_event_repo(
    dividend_type=10, date_type=11, tax_type=12, balance_type=13, existing_balance="0"
):
    repo = AsyncMock()
    repo.get_event_type_id = AsyncMock(
        side_effect=lambda name: {
            "Dividend": dividend_type,
            "Dividend Payment Date": date_type,
            "Dividend Tax": tax_type,
            "Balance Update": balance_type,
        }.get(name)
    )
    repo.create_event = AsyncMock(side_effect=lambda *a, **kw: MagicMock(id=50))
    repo.get_latest_balance_update = AsyncMock(return_value=existing_balance)
    return repo


def _make_group_repo():
    repo = AsyncMock()
    repo.create_group = AsyncMock(return_value=MagicMock(id=77))
    repo.add_event_member = AsyncMock()
    return repo


def _patch(monkeypatch, event_repo, group_repo):
    import app.services.dividend_service as svc
    monkeypatch.setattr(svc, "AccountEventRepository", lambda s: event_repo)
    monkeypatch.setattr(svc, "EventGroupRepository", lambda s: group_repo)


# ── _find_tax_account ─────────────────────────────────────────────────────────


class TestFindTaxAccount:
    @pytest.mark.asyncio
    async def test_returns_none_when_no_matching_period(self):
        session = _make_session(None)
        result = await _find_tax_account(session, user_id=1, payment_date=date(2026, 5, 10))
        assert result is None

    @pytest.mark.asyncio
    async def test_returns_none_when_no_tax_liability_type(self):
        session = _make_session("2026/27", None)
        result = await _find_tax_account(session, user_id=1, payment_date=date(2026, 5, 10))
        assert result is None

    @pytest.mark.asyncio
    async def test_returns_none_when_no_matching_account(self):
        session = _make_session("2026/27", 112, None)
        result = await _find_tax_account(session, user_id=1, payment_date=date(2026, 5, 10))
        assert result is None

    @pytest.mark.asyncio
    async def test_returns_account_id_when_all_queries_succeed(self):
        session = _make_session("2026/27", 112, 45)
        result = await _find_tax_account(session, user_id=1, payment_date=date(2026, 5, 10))
        assert result == 45

    @pytest.mark.asyncio
    async def test_passes_payment_date_to_period_query(self):
        payment = date(2025, 6, 15)
        session = _make_session(None)
        await _find_tax_account(session, user_id=1, payment_date=payment)
        stmt = session.execute.call_args_list[0][0][0]
        compiled = str(stmt.compile(compile_kwargs={"literal_binds": True}))
        assert "2025-06-15" in compiled

    @pytest.mark.asyncio
    async def test_returns_none_when_no_period_covers_date(self):
        session = _make_session(None)
        result = await _find_tax_account(session, user_id=1, payment_date=date(2020, 1, 1))
        assert result is None


# ── record_dividend ───────────────────────────────────────────────────────────


class TestRecordDividend:
    @pytest.mark.asyncio
    async def test_raises_when_dividend_type_not_found(self, monkeypatch):
        event_repo = _make_event_repo(dividend_type=None)
        group_repo = _make_group_repo()
        _patch(monkeypatch, event_repo, group_repo)
        with pytest.raises(ValueError, match="Required event types"):
            await record_dividend(1, 1, "100.00", date(2026, 5, 10), AsyncMock())

    @pytest.mark.asyncio
    async def test_raises_when_date_type_not_found(self, monkeypatch):
        event_repo = _make_event_repo(date_type=None)
        group_repo = _make_group_repo()
        _patch(monkeypatch, event_repo, group_repo)
        with pytest.raises(ValueError, match="Required event types"):
            await record_dividend(1, 1, "100.00", date(2026, 5, 10), AsyncMock())

    @pytest.mark.asyncio
    async def test_creates_two_events_and_group_without_tax_account(self, monkeypatch):
        event_repo = _make_event_repo()
        group_repo = _make_group_repo()
        _patch(monkeypatch, event_repo, group_repo)
        session = _make_session(None)  # no matching TaxPeriod
        response = await record_dividend(1, 1, "500.00", date(2026, 5, 10), session)
        assert event_repo.create_event.call_count == 2
        assert group_repo.add_event_member.call_count == 2
        assert response.tax_provision is None
        assert response.tax_account_id is None

    @pytest.mark.asyncio
    async def test_creates_tax_provision_when_tax_account_found(self, monkeypatch):
        event_repo = _make_event_repo()
        group_repo = _make_group_repo()
        _patch(monkeypatch, event_repo, group_repo)
        session = _make_session("2026/27", 112, 45)
        response = await record_dividend(1, 1, "500.00", date(2026, 5, 10), session)
        assert response.tax_provision == "200.00"
        assert response.tax_account_id == 45
        assert event_repo.create_event.call_count == 4
        assert group_repo.add_event_member.call_count == 4

    @pytest.mark.asyncio
    async def test_provision_is_40_percent_rounded_to_pence(self, monkeypatch):
        event_repo = _make_event_repo()
        group_repo = _make_group_repo()
        _patch(monkeypatch, event_repo, group_repo)
        session = _make_session("2026/27", 112, 45)
        response = await record_dividend(1, 1, "123.45", date(2026, 5, 10), session)
        assert Decimal(response.tax_provision) == Decimal("49.38")

    @pytest.mark.asyncio
    async def test_balance_update_accumulates_existing_balance(self, monkeypatch):
        event_repo = _make_event_repo(existing_balance="100.00")
        group_repo = _make_group_repo()
        _patch(monkeypatch, event_repo, group_repo)
        session = _make_session("2026/27", 112, 45)
        await record_dividend(1, 1, "500.00", date(2026, 5, 10), session)
        create_calls = event_repo.create_event.call_args_list
        balance_call = [c for c in create_calls if c.args[3] == "300.00"]
        assert len(balance_call) == 1

    @pytest.mark.asyncio
    async def test_response_has_correct_fields(self, monkeypatch):
        event_repo = _make_event_repo()
        group_repo = _make_group_repo()
        _patch(monkeypatch, event_repo, group_repo)
        session = _make_session(None)
        payment = date(2026, 5, 10)
        response = await record_dividend(42, 1, "250.00", payment, session)
        assert response.account_id == 42
        assert response.amount == "250.00"
        assert response.payment_date == payment
        assert response.group_id == 77

    @pytest.mark.asyncio
    async def test_tax_events_target_tax_account_not_source(self, monkeypatch):
        event_repo = _make_event_repo()
        group_repo = _make_group_repo()
        _patch(monkeypatch, event_repo, group_repo)
        session = _make_session("2026/27", 112, 45)
        await record_dividend(1, 1, "500.00", date(2026, 5, 10), session)
        create_calls = event_repo.create_event.call_args_list
        tax_and_balance = [c for c in create_calls if c.args[0] == 45]
        assert len(tax_and_balance) == 2
