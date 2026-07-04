"""Shared formatting helpers and styling for the tax briefing PDF."""
from __future__ import annotations

from typing import Any

from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle

from app.types.attribute_types import AttributeType

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
_TOTAL_BG = colors.HexColor("#e2e8f0")


def money(value: Any) -> str:
    """Format a numeric value as GBP with the £ symbol; em-dash for missing/invalid."""
    if value is None or value == "":
        return "—"
    try:
        return f"£{float(value):,.2f}"
    except (TypeError, ValueError):
        return "—"


def money_plain(value: Any) -> str:
    """Bare GBP number for right-aligned table cells (unit lives in the header).

    Negatives use accounting style — (1,234.00) — so Tax Liability pots read clearly.
    """
    if value is None or value == "":
        return "—"
    try:
        number = float(value)
    except (TypeError, ValueError):
        return "—"
    return f"({abs(number):,.2f})" if number < 0 else f"{number:,.2f}"


def to_float(value: Any) -> float:
    """Coerce a value to float, returning 0.0 on failure."""
    try:
        return float(value) if value not in (None, "") else 0.0
    except (TypeError, ValueError):
        return 0.0


def account_ref(item: dict[str, Any]) -> str:
    """Identify an account by its number (with sort code) or building-society roll/ref."""
    attrs: dict[str, str] = item.get("attrs") or {}
    number = attrs.get(AttributeType.ACCOUNT_NUMBER)
    sort = attrs.get(AttributeType.SORT_CODE)
    if number:
        return f"{number} ({sort})" if sort else number
    return attrs.get(AttributeType.ROLL_REF_NUMBER) or sort or ""


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


def styled_table(
    rows: list[list[Any]],
    col_widths: list[float],
    *,
    right_cols: tuple[int, ...] = (),
    total_row: bool = False,
) -> Table:
    """Build a table with the standard briefing styling.

    Dark header, zebra rows, horizontal rules only (no vertical lines).
    right_cols: 0-based columns to right-align (numeric/money).
    total_row: emphasise the final row as a bold, ruled summary.
    """
    table = Table(rows, colWidths=col_widths, repeatRows=1)
    style: list[Any] = [
        ("BACKGROUND", (0, 0), (-1, 0), HEADER_BG),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, _ROW_ALT]),
        ("LINEBELOW", (0, 0), (-1, -1), 0.25, _GRID),
        ("BOX", (0, 0), (-1, -1), 0.5, _GRID),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]
    for col in right_cols:
        style.append(("ALIGN", (col, 0), (col, -1), "RIGHT"))
    if total_row:
        style += [
            ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
            ("BACKGROUND", (0, -1), (-1, -1), _TOTAL_BG),
            ("LINEABOVE", (0, -1), (-1, -1), 0.75, HEADER_BG),
        ]
    table.setStyle(TableStyle(style))
    return table
