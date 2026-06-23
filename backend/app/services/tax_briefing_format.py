"""Shared formatting helpers and styling for the tax briefing PDF."""
from __future__ import annotations

from typing import Any

from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle

# Account-type groupings mirror frontend/src/composables/portfolioCalculations.ts
CASH_TYPES = {"Current Account", "Savings Account", "Premium Bonds", "Fixed / Bonus Rate Saver"}
ISA_TYPES = {"Cash ISA", "Fixed Rate ISA", "Stocks ISA"}
ILLIQUID_TYPES = {"Deferred Shares", "Deferred Cash", "RSU", "Shares"}
TRUST_TYPES = {"Trust Bank Account", "Trust Stocks Investment Account"}
PENSION_TYPES = {"Deferred DC Pension", "SIPP", "Deferred DB Pension"}

# Order drives the wealth-summary table rows.
WEALTH_CATEGORIES: list[tuple[str, set[str]]] = [
    ("Cash", CASH_TYPES),
    ("ISA", ISA_TYPES),
    ("Pensions", PENSION_TYPES),
    ("Illiquid / Shares", ILLIQUID_TYPES),
    ("Trust", TRUST_TYPES),
]

HEADER_BG = colors.HexColor("#1e1b4b")
_ROW_ALT = colors.HexColor("#f1f5f9")
_GRID = colors.HexColor("#cbd5e1")


def money(value: Any) -> str:
    """Format a numeric value as GBP; em-dash for missing/invalid."""
    if value is None or value == "":
        return "—"
    try:
        return f"£{float(value):,.2f}"
    except (TypeError, ValueError):
        return "—"


def to_float(value: Any) -> float:
    """Coerce a value to float, returning 0.0 on failure."""
    try:
        return float(value) if value not in (None, "") else 0.0
    except (TypeError, ValueError):
        return 0.0


def category_for(account_type: str) -> str:
    """Return the wealth-summary category label for an account type."""
    for label, members in WEALTH_CATEGORIES:
        if account_type in members:
            return label
    if account_type == "Tax Liability":
        return "Tax Liability"
    return "Other"


def exclusion_reason(account_type: str) -> str:
    """Explain why an account carries no figures on the tax return."""
    if account_type in ISA_TYPES:
        return "Tax-free ISA wrapper"
    if account_type in PENSION_TYPES:
        return "Pension — tax-deferred"
    if account_type == "Premium Bonds":
        return "Premium Bonds — winnings tax-free"
    if account_type in TRUST_TYPES:
        return "Held in trust — reported separately"
    return "No taxable income or gains in period"


def styled_table(rows: list[list[Any]], col_widths: list[float]) -> Table:
    """Build a table with the standard briefing styling (header row + zebra striping)."""
    table = Table(rows, colWidths=col_widths, repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("GRID", (0, 0), (-1, -1), 0.5, _GRID),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, _ROW_ALT]),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    return table
