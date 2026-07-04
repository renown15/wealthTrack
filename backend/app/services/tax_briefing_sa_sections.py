"""Self Assessment support sections — the client's recorded figures, grouped.

Presents Tax Hub data (per-account income, capital gain, tax provisioned,
account type and institution) organised the way a Self Assessment return is,
so a qualified accountant can verify and transcribe it. Box references are
signposts only; the accountant applies allowances, reliefs and rate bands.

Savings-type income is interest; Shares income is dividends; Shares capital
gain is the chargeable gain on share disposals.
"""
from __future__ import annotations

import html as html_lib
import re
from typing import Any

from reportlab.lib.units import mm
from reportlab.platypus import Flowable, Paragraph

from app.services.tax_briefing_format import money_plain, styled_table, to_float
from app.types.attribute_types import AttributeType

Styles = dict[str, Any]

_SHARES = "Shares"
_NON_INCOME_TYPES = {"Tax Liability"}


def account_ref(item: dict[str, Any]) -> str:
    """Identify an account by its number (with sort code) or building-society roll/ref."""
    attrs: dict[str, str] = item.get("attrs") or {}
    number = attrs.get(AttributeType.ACCOUNT_NUMBER)
    sort = attrs.get(AttributeType.SORT_CODE)
    if number:
        return f"{number} ({sort})" if sort else number
    return attrs.get(AttributeType.ROLL_REF_NUMBER) or sort or ""


def commentary_flowables(commentary: str | None, styles: Styles) -> list[Flowable]:
    """Render the tax-period commentary (rich-text HTML) as plain-text paragraphs.

    Block elements become paragraph breaks and list items get a bullet; all tags
    are stripped so any editor markup renders safely.
    """
    if not commentary or not commentary.strip():
        return []
    text = re.sub(r"<br\s*/?>", "\n", commentary, flags=re.IGNORECASE)
    text = re.sub(r"<li[^>]*>", "\n• ", text, flags=re.IGNORECASE)
    text = re.sub(r"</(p|div|li|h[1-6]|ul|ol|tr)>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", "", text)
    text = html_lib.unescape(text)
    flow: list[Flowable] = [Paragraph("Commentary", styles["h2"])]
    for line in text.split("\n"):
        line = line.strip()
        if line:
            safe = line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            flow.append(Paragraph(safe, styles["body"]))
    return flow if len(flow) > 1 else []


def _cell(text: str, styles: Styles) -> Paragraph:
    return Paragraph(text, styles["cell"])


def _income(item: dict[str, Any]) -> float:
    return to_float(getattr(item.get("tax_return"), "income", None))


def _institution(item: dict[str, Any]) -> str:
    inst = getattr(item.get("account"), "institution", None)
    return getattr(inst, "name", "") if inst is not None else ""


def interest_items(in_scope: list[dict[str, Any]]) -> list[tuple[str, str, str, float]]:
    """Savings-type accounts with recorded income (interest)."""
    out: list[tuple[str, str, str, float]] = []
    for item in in_scope:
        atype = item["account_type"]
        if atype == _SHARES or atype in _NON_INCOME_TYPES:
            continue
        amount = _income(item)
        if amount:
            out.append((item["account"].name, _institution(item), account_ref(item), amount))
    return out


def dividend_items(in_scope: list[dict[str, Any]]) -> list[tuple[str, str, float]]:
    """Shares accounts with recorded income (dividends)."""
    out: list[tuple[str, str, float]] = []
    for item in in_scope:
        if item["account_type"] == _SHARES and _income(item):
            out.append((item["account"].name, account_ref(item), _income(item)))
    return out


def gain_items(in_scope: list[dict[str, Any]]) -> list[tuple[str, str, float]]:
    """Shares accounts with a recorded chargeable gain."""
    out: list[tuple[str, str, float]] = []
    for item in in_scope:
        if item["account_type"] != _SHARES:
            continue
        gain = to_float(getattr(item.get("tax_return"), "capital_gain", None))
        if gain:
            out.append((item["account"].name, account_ref(item), gain))
    return out


def figures_reference(styles: Styles, in_scope: list[dict[str, Any]]) -> Flowable:
    """Cover-page summary: recorded totals by type, with the usual form box."""
    interest = sum(a for *_, a in interest_items(in_scope))
    dividends = sum(a for *_, a in dividend_items(in_scope))
    gains = sum(g for *_, g in gain_items(in_scope))
    rows: list[list[Any]] = [["Recorded figure", "Amount (£)", "Usual box"]]
    rows.append([_cell("UK interest", styles), money_plain(interest), "SA100, box 2"])
    rows.append([_cell("UK dividends", styles), money_plain(dividends), "SA100, box 4"])
    rows.append([_cell("Gains — listed shares", styles), money_plain(gains), "SA108, box 26"])
    return styled_table(rows, [80 * mm, 40 * mm, 50 * mm], right_cols=(1,))


def interest_section(styles: Styles, in_scope: list[dict[str, Any]]) -> list[Flowable]:
    """Interest received per savings account (usually SA100 box 2)."""
    flow: list[Flowable] = [
        Paragraph("1. Interest received", styles["h2"]),
        Paragraph(
            "Gross interest recorded against each savings account for the year. "
            "Usually untaxed UK interest — SA100 page TR 3, box 2.", styles["small"]),
    ]
    items = interest_items(in_scope)
    if not items:
        flow.append(Paragraph("No interest recorded for this period.", styles["body"]))
        return flow
    rows: list[list[Any]] = [["Account", "Institution", "Reference", "Interest (£)"]]
    total = 0.0
    for name, inst, ref, amount in items:
        total += amount
        rows.append(
            [_cell(name, styles), _cell(inst, styles), _cell(ref, styles), money_plain(amount)])
    rows.append(["Total", "", "", money_plain(total)])
    flow.append(styled_table(
        rows, [55 * mm, 42 * mm, 43 * mm, 30 * mm], right_cols=(3,), total_row=True))
    return flow


def dividends_section(styles: Styles, in_scope: list[dict[str, Any]]) -> list[Flowable]:
    """Dividends received per shareholding (usually SA100 box 4)."""
    flow: list[Flowable] = [
        Paragraph("2. Dividends received", styles["h2"]),
        Paragraph(
            "Dividends recorded against each shareholding for the year. "
            "Usually dividends from UK companies — SA100 page TR 3, box 4.", styles["small"]),
    ]
    items = dividend_items(in_scope)
    if not items:
        flow.append(Paragraph("No dividends recorded for this period.", styles["body"]))
        return flow
    rows: list[list[Any]] = [["Holding", "Reference", "Dividends (£)"]]
    total = 0.0
    for name, ref, amount in items:
        total += amount
        rows.append([_cell(name, styles), _cell(ref, styles), money_plain(amount)])
    rows.append(["Total", "", money_plain(total)])
    flow.append(styled_table(rows, [90 * mm, 45 * mm, 35 * mm], right_cols=(2,), total_row=True))
    return flow


def capital_gains_section(styles: Styles, in_scope: list[dict[str, Any]]) -> list[Flowable]:
    """Chargeable gains on share disposals (listed shares, SA108 page CG 2)."""
    flow: list[Flowable] = [
        Paragraph("3. Capital gains on share disposals", styles["h2"]),
        Paragraph(
            "Chargeable gain recorded against each holding for the year. Listed shares and "
            "securities — SA108 page CG 2 (box 26). Disposal proceeds and allowable costs "
            "for boxes 23–25 are in the underlying sale records and supporting documents.",
            styles["small"]),
    ]
    items = gain_items(in_scope)
    if not items:
        flow.append(Paragraph("No chargeable gains on share disposals recorded.", styles["body"]))
        return flow
    rows: list[list[Any]] = [["Holding", "Reference", "Chargeable gain (£)"]]
    total = 0.0
    for name, ref, gain in items:
        total += gain
        rows.append([_cell(name, styles), _cell(ref, styles), money_plain(gain)])
    rows.append(["Total", "", money_plain(total)])
    flow.append(styled_table(rows, [90 * mm, 45 * mm, 35 * mm], right_cols=(2,), total_row=True))
    return flow


def provisions_section(styles: Styles, in_scope: list[dict[str, Any]]) -> list[Flowable]:
    """Tax the client has provisioned per account — for context, not a return entry."""
    rows: list[list[Any]] = [["Account", "Reference", "Tax provisioned (£)"]]
    total = 0.0
    for item in in_scope:
        due = to_float(getattr(item.get("tax_return"), "tax_due", None))
        if due:
            total += due
            rows.append(
                [_cell(item["account"].name, styles), _cell(account_ref(item), styles),
                 money_plain(due)])
    if len(rows) == 1:
        return []
    rows.append(["Total", "", money_plain(total)])
    return [
        Paragraph("4. Tax provisioned by the client", styles["h3"]),
        Paragraph(
            "The client's own estimate of tax set aside against this income and these gains "
            "— for context only.", styles["small"]),
        styled_table(rows, [90 * mm, 45 * mm, 35 * mm], right_cols=(2,), total_row=True),
    ]
