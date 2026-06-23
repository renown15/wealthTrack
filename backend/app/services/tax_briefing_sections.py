"""Flowable builders for each section of the tax briefing PDF."""
from __future__ import annotations

from typing import Any

from reportlab.lib.units import mm
from reportlab.platypus import Flowable, Paragraph, Spacer

from app.schemas.gift import GiftSummary
from app.services.tax_briefing_format import (
    WEALTH_CATEGORIES,
    category_for,
    exclusion_reason,
    money,
    styled_table,
    to_float,
)
from app.services.tax_briefing_images import (
    compress_document_image,
    is_image,
    is_pdf,
    render_pdf_pages,
)

Styles = dict[str, Any]


def build_portfolio_map(items: list[dict[str, Any]]) -> dict[int, dict[str, Any]]:
    """Map account id -> {name, type, value} from portfolio item dicts."""
    result: dict[int, dict[str, Any]] = {}
    for item in items:
        account = item.get("account") or {}
        account_id = account.get("id")
        if account_id is None:
            continue
        balance = item.get("latestBalance") or {}
        result[int(account_id)] = {
            "name": account.get("name", ""),
            "type": item.get("accountType", ""),
            "value": to_float(balance.get("value")),
        }
    return result


def _cell(text: str, styles: Styles) -> Paragraph:
    return Paragraph(text, styles["cell"])


def _account_value(item: dict[str, Any], pmap: dict[int, dict[str, Any]]) -> float:
    info = pmap.get(item["account"].id)
    return float(info["value"]) if info else 0.0


def wealth_section(
    styles: Styles,
    items: list[dict[str, Any]],
    in_scope: list[dict[str, Any]],
    eligible: list[dict[str, Any]],
    pmap: dict[int, dict[str, Any]],
) -> list[Flowable]:
    """Total wealth by category + reconciliation of in-scope vs excluded accounts."""
    flow: list[Flowable] = [Paragraph("1. Wealth Reconciliation", styles["h2"])]

    totals = {label: 0.0 for label, _ in WEALTH_CATEGORIES}
    grand = 0.0
    for item in items:
        value = to_float((item.get("latestBalance") or {}).get("value"))
        grand += value
        label = category_for(item.get("accountType", ""))
        if label in totals:
            totals[label] += value
    summary = [["Category", "Total"]]
    summary += [[label, money(totals[label])] for label, _ in WEALTH_CATEGORIES]
    summary.append(["Total wealth", money(grand)])
    flow.append(styled_table(summary, [110 * mm, 50 * mm]))
    flow.append(Spacer(1, 6 * mm))

    flow.append(Paragraph("Accounts in scope, eligible, and excluded", styles["h3"]))
    tax_ids = {i["account"].id for i in in_scope + eligible}
    rows: list[list[Any]] = [["Account", "Type", "Balance", "Status / reason"]]
    for item in in_scope:
        rows.append([_cell(item["account"].name, styles), item["account_type"],
                     money(_account_value(item, pmap)), "In scope for return"])
    for item in eligible:
        rows.append([_cell(item["account"].name, styles), item["account_type"],
                     money(_account_value(item, pmap)), "Eligible — review"])
    for account_id, info in pmap.items():
        if account_id not in tax_ids:
            rows.append([_cell(info["name"], styles), info["type"],
                         money(info["value"]), exclusion_reason(info["type"])])
    flow.append(styled_table(rows, [55 * mm, 38 * mm, 30 * mm, 47 * mm]))
    return flow


def tax_detail_section(
    styles: Styles, in_scope: list[dict[str, Any]]
) -> list[Flowable]:
    """Per in-scope account: income, capital gain, tax taken off, with totals."""
    flow: list[Flowable] = [Paragraph("2. Tax Return Detail", styles["h2"])]
    if not in_scope:
        flow.append(Paragraph("No accounts are in scope for this period.", styles["body"]))
        return flow

    rows: list[list[Any]] = [["Account", "Income", "Capital gain", "Tax taken off"]]
    t_income = t_gain = t_tax = 0.0
    for item in in_scope:
        tax_return = item.get("tax_return")
        income = to_float(getattr(tax_return, "income", None))
        gain = to_float(getattr(tax_return, "capital_gain", None))
        tax = to_float(getattr(tax_return, "tax_taken_off", None))
        t_income += income
        t_gain += gain
        t_tax += tax
        rows.append([_cell(item["account"].name, styles), money(income), money(gain), money(tax)])
    rows.append(["Totals", money(t_income), money(t_gain), money(t_tax)])
    flow.append(styled_table(rows, [70 * mm, 33 * mm, 33 * mm, 34 * mm]))
    return flow


def gifts_section(styles: Styles, gifts: list[GiftSummary]) -> list[Flowable]:
    """Gift register with current IHT taper rate and exposure."""
    flow: list[Flowable] = [Paragraph("3. Gifts & IHT Taper", styles["h2"])]
    if not gifts:
        flow.append(Paragraph("No gifts recorded.", styles["body"]))
        return flow

    rows: list[list[Any]] = [["Donor", "Account", "Date", "Value", "Yrs", "Taper", "Exposure"]]
    for gift in gifts:
        rows.append([
            _cell(gift.donor, styles),
            _cell(gift.account_name, styles),
            gift.gift_date.isoformat(),
            money(gift.gift_value_gbp),
            f"{gift.years_elapsed:.1f}",
            f"{to_float(gift.iht_rate) * 100:.0f}%",
            money(gift.iht_exposure),
        ])
    flow.append(styled_table(
        rows, [28 * mm, 32 * mm, 22 * mm, 24 * mm, 12 * mm, 16 * mm, 24 * mm]))
    return flow


def _document_flowables(doc: Any, styles: Styles) -> list[Flowable]:
    """Render one document: images and PDF pages embed as compressed images."""
    flow: list[Flowable] = []
    if is_image(doc.content_type, doc.filename):
        image = compress_document_image(doc.file_data)
        if image:
            flow.extend([image, Spacer(1, 4 * mm)])
    elif is_pdf(doc.content_type, doc.filename):
        pages = render_pdf_pages(doc.file_data)
        for page in pages:
            flow.extend([page, Spacer(1, 4 * mm)])
        if not pages:
            flow.append(Paragraph("  (could not render PDF)", styles["small"]))
    else:
        flow.append(
            Paragraph("  (unsupported document type — attached separately)", styles["small"])
        )
    return flow


def documents_section(styles: Styles, items: list[dict[str, Any]]) -> list[Flowable]:
    """Supporting-document checklist; image documents are embedded (compressed)."""
    flow: list[Flowable] = [Paragraph("4. Supporting Documents", styles["h2"])]
    any_docs = False
    for item in items:
        documents = item.get("documents") or []
        if not documents:
            continue
        any_docs = True
        flow.append(Paragraph(item["account"].name, styles["h3"]))
        for doc in documents:
            label = f"• {doc.filename} ({doc.content_type or 'unknown type'})"
            flow.append(Paragraph(label, styles["small"]))
            flow.extend(_document_flowables(doc, styles))
    if not any_docs:
        flow.append(Paragraph("No supporting documents uploaded.", styles["body"]))
    return flow
