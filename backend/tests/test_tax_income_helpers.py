"""Savings interest tax: rate from ReferenceData, tax_due = income × rate."""
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services import tax_income_helpers as mod


def _session_with_rate(rate):
    result = MagicMock()
    result.scalar_one_or_none.return_value = rate
    session = AsyncMock()
    session.execute.return_value = result
    return session


def _repo_returning(income):
    repo = MagicMock()
    tax_return = MagicMock(income=income, tax_due=None)
    repo.get_or_create = AsyncMock(return_value=tax_return)
    return repo


async def _resolve(session, repo, account_type):
    return await mod.resolve_savings_return(
        session, repo, 1, MagicMock(id=5), 10, account_type
    )


@pytest.mark.asyncio
async def test_rate_read_from_reference_data():
    assert await mod.get_savings_tax_rate(_session_with_rate("40")) == 40.0


@pytest.mark.asyncio
async def test_rate_defaults_to_highest_band_when_absent():
    assert await mod.get_savings_tax_rate(_session_with_rate(None)) == 45.0


@pytest.mark.asyncio
async def test_dividend_rate_read_from_reference_data():
    assert await mod.get_dividend_tax_rate(_session_with_rate("32.5")) == 32.5


@pytest.mark.asyncio
async def test_dividend_rate_defaults_to_40_when_absent():
    assert await mod.get_dividend_tax_rate(_session_with_rate(None)) == 40.0


@pytest.mark.asyncio
async def test_savings_income_taxed_at_rate():
    # income is a Decimal (ORM Numeric column) × a float rate — must not raise
    repo = _repo_returning(Decimal("1000.00"))
    out = await _resolve(_session_with_rate("45"), repo, "Savings Account")
    assert out.tax_due == 450.0


@pytest.mark.asyncio
async def test_no_income_yields_no_tax_due():
    out = await _resolve(_session_with_rate("45"), _repo_returning(None), "Savings Account")
    assert out.tax_due is None


@pytest.mark.asyncio
async def test_tax_free_type_is_never_taxed():
    session = _session_with_rate("45")
    out = await _resolve(session, _repo_returning(1000.0), "Cash ISA")
    assert out.tax_due is None
    session.execute.assert_not_called()  # short-circuits before reading the rate
