"""Tests for the Self Assessment section categorisation (Tax Hub data → SA figures)."""
from types import SimpleNamespace

from app.services.tax_briefing_sa_sections import (
    account_ref,
    dividend_items,
    gain_items,
    interest_items,
    tax_liability_items,
)


def _item(name, account_type, income=0.0, gain=0.0, institution=None, attrs=None,
          tax_due=0.0, tax_off=0.0):
    return {
        "account": SimpleNamespace(
            id=1, name=name,
            institution=SimpleNamespace(name=institution) if institution else None,
        ),
        "account_type": account_type,
        "tax_return": SimpleNamespace(
            income=income, capital_gain=gain, tax_due=tax_due, tax_taken_off=tax_off),
        "attrs": attrs or {},
    }


def test_savings_income_is_interest_not_dividends():
    rows = [_item("Chase Saver", "Savings Account", income=112.55, institution="Chase")]
    assert interest_items(rows) == [("Chase Saver", "Chase", "", 112.55)]
    assert dividend_items(rows) == []


def test_current_account_income_is_interest():
    rows = [_item("Current", "Current Account", income=50.0, institution="Barclays")]
    assert interest_items(rows) == [("Current", "Barclays", "", 50.0)]


def test_shares_income_is_dividends_and_gain_is_capital_gain():
    rows = [_item("HSBC Nominee", "Shares", income=2991.84, gain=1000.0)]
    assert dividend_items(rows) == [("HSBC Nominee", "", 2991.84)]
    assert gain_items(rows) == [("HSBC Nominee", "", 1000.0)]
    assert interest_items(rows) == []


def test_account_ref_prefers_number_with_sort_code():
    attrs = {"Account Number": "12345678", "Sort Code": "12-34-56"}
    assert account_ref({"attrs": attrs}) == "12345678 (12-34-56)"


def test_account_ref_falls_back_to_roll_ref():
    assert account_ref({"attrs": {"Roll / Ref Number": "ABC-99"}}) == "ABC-99"
    assert account_ref({"attrs": {}}) == ""


def test_interest_item_carries_account_reference():
    rows = [_item(
        "Chase Saver", "Savings Account", income=10.0, institution="Chase",
        attrs={"Account Number": "87654321", "Sort Code": "00-11-22"})]
    assert interest_items(rows) == [("Chase Saver", "Chase", "87654321 (00-11-22)", 10.0)]


def test_tax_liability_pot_never_counts_as_income():
    rows = [_item("Tax Liability - 2025/26", "Tax Liability", income=0.0)]
    assert interest_items(rows) == []
    assert dividend_items(rows) == []
    assert gain_items(rows) == []


def test_zero_amounts_are_omitted():
    rows = [
        _item("Saver", "Savings Account", income=0.0),
        _item("Shares", "Shares", income=0.0, gain=0.0),
    ]
    assert interest_items(rows) == []
    assert dividend_items(rows) == []
    assert gain_items(rows) == []


def test_missing_institution_yields_blank():
    rows = [_item("Saver", "Savings Account", income=10.0, institution=None)]
    assert interest_items(rows) == [("Saver", "", "", 10.0)]


def test_tax_liability_item_uses_note_and_included_when_any_value():
    rows = [_item(
        "Tax Liability - 2025/26", "Tax Liability", income=30000.0, tax_off=6000.0,
        attrs={"Notes": "HSBC Employment"})]
    assert tax_liability_items(rows) == [("HSBC Employment", 30000.0, 0.0, 6000.0, 0.0)]


def test_tax_liability_item_included_on_tax_deducted_alone():
    rows = [_item("Tax Liability - 2025/26", "Tax Liability", tax_off=418826.68,
                  attrs={"Notes": "PAYE"})]
    assert tax_liability_items(rows) == [("PAYE", 0.0, 0.0, 418826.68, 0.0)]


def test_tax_liability_item_falls_back_to_account_name_without_note():
    rows = [_item("Tax Liability - 2025/26", "Tax Liability", gain=500.0)]
    assert tax_liability_items(rows) == [("Tax Liability - 2025/26", 0.0, 500.0, 0.0, 0.0)]


def test_tax_liability_item_omitted_when_all_zero():
    rows = [_item("Tax Liability - 2025/26", "Tax Liability", attrs={"Notes": "Empty"})]
    assert tax_liability_items(rows) == []


def test_tax_liability_ignores_non_liability_accounts():
    rows = [_item("Saver", "Savings Account", income=100.0)]
    assert tax_liability_items(rows) == []
