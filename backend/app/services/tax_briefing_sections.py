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
    money_plain,
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

    # category_for only ever returns one of these labels, so rows always foot to grand.
    totals = {label: 0.0 for label, _ in WEALTH_CATEGORIES}
    totals["Tax Liability"] = 0.0
    totals["Other"] = 0.0
    grand = 0.0
    for item in items:
        value = to_float((item.get("latestBalance") or {}).get("value"))
        grand += value
        totals[category_for(item.get("accountType", ""))] += value
    summary = [["Category", "Total (£)"]]
    summary += [[label, money_plain(totals[label])] for label, _ in WEALTH_CATEGORIES]
    for extra in ("Tax Liability", "Other"):
        if totals[extra]:
            summary.append([extra, money_plain(totals[extra])])
    summary.append(["Total wealth", money_plain(grand)])
    flow.append(styled_table(summary, [120 * mm, 50 * mm], right_cols=(1,), total_row=True))
    flow.append(Spacer(1, 6 * mm))

    flow.append(Paragraph("Accounts in scope, eligible, and excluded", styles["h3"]))
    tax_ids = {i["account"].id for i in in_scope + eligible}
    rows: list[list[Any]] = [["Account", "Type", "Balance (£)", "Status / reason"]]
    running = 0.0
    for item in in_scope:
        value = _account_value(item, pmap)
        running += value
        rows.append([_cell(item["account"].name, styles), item["account_type"],
                     money_plain(value), _cell("In scope for return", styles)])
    for item in eligible:
        value = _account_value(item, pmap)
        running += value
        rows.append([_cell(item["account"].name, styles), item["account_type"],
                     money_plain(value), _cell("Eligible — review", styles)])
    for account_id, info in pmap.items():
        if account_id not in tax_ids:
            running += info["value"]
            rows.append([_cell(info["name"], styles), info["type"],
                         money_plain(info["value"]), _cell(exclusion_reason(info["type"]), styles)])
    rows.append(["Total", "", money_plain(running), ""])
    widths = [55 * mm, 38 * mm, 30 * mm, 47 * mm]
    flow.append(styled_table(rows, widths, right_cols=(2,), total_row=True))
    return flow


def tax_detail_section(
    styles: Styles, in_scope: list[dict[str, Any]]
) -> list[Flowable]:
    """Per in-scope account: income, capital gain, tax due, tax taken off, with totals."""
    flow: list[Flowable] = [Paragraph("2. Tax Return Detail", styles["h2"])]
    if not in_scope:
        flow.append(Paragraph("No accounts are in scope for this period.", styles["body"]))
        return flow

    header = ["Account", "Income (£)", "Capital gain (£)", "Tax due (£)",
              "Tax taken off (£)", "Net due (£)"]
    rows: list[list[Any]] = [header]
    t_income = t_gain = t_due = t_tax = t_net = 0.0
    for item in in_scope:
        tax_return = item.get("tax_return")
        income = to_float(getattr(tax_return, "income", None))
        gain = to_float(getattr(tax_return, "capital_gain", None))
        due = to_float(getattr(tax_return, "tax_due", None))
        tax = to_float(getattr(tax_return, "tax_taken_off", None))
        net = due - tax
        t_income += income
        t_gain += gain
        t_due += due
        t_tax += tax
        t_net += net
        rows.append([_cell(item["account"].name, styles), money_plain(income), money_plain(gain),
                     money_plain(due), money_plain(tax), money_plain(net)])
    rows.append(["Totals", money_plain(t_income), money_plain(t_gain),
                 money_plain(t_due), money_plain(t_tax), money_plain(t_net)])
    widths = [40 * mm, 26 * mm, 26 * mm, 26 * mm, 26 * mm, 26 * mm]
    flow.append(styled_table(rows, widths, right_cols=(1, 2, 3, 4, 5), total_row=True))
    return flow


def out_of_scope_section(
    styles: Styles, items: list[dict[str, Any]]
) -> list[Flowable]:
    """Accounts manually excluded from the return, each with its recorded reason."""
    if not items:
        return []
    flow: list[Flowable] = [Paragraph("Accounts excluded from scope", styles["h3"])]
    rows: list[list[Any]] = [["Account", "Type", "Reason"]]
    for item in items:
        note = getattr(item.get("tax_return"), "note", None) or "—"
        rows.append(
            [_cell(item["account"].name, styles), item["account_type"], _cell(note, styles)]
        )
    flow.append(styled_table(rows, [55 * mm, 35 * mm, 80 * mm]))
    return flow


def gifts_section(styles: Styles, gifts: list[GiftSummary]) -> list[Flowable]:
    """Gift register with current IHT taper rate and exposure."""
    flow: list[Flowable] = [Paragraph("3. Gifts & IHT Taper", styles["h2"])]
    if not gifts:
        flow.append(Paragraph("No gifts recorded.", styles["body"]))
        return flow

    rows: list[list[Any]] = [
        ["Donor", "Account", "Date", "Value (£)", "Years", "Taper", "Exposure (£)"]]
    t_value = t_exposure = 0.0
    for gift in gifts:
        t_value += to_float(gift.gift_value_gbp)
        t_exposure += to_float(gift.iht_exposure)
        rows.append([
            _cell(gift.donor, styles),
            _cell(gift.account_name, styles),
            gift.gift_date.strftime("%d %b %Y"),
            money_plain(gift.gift_value_gbp),
            f"{gift.years_elapsed:.1f}",
            f"{to_float(gift.iht_rate) * 100:.0f}%",
            money_plain(gift.iht_exposure),
        ])
    rows.append(["Total", "", "", money_plain(t_value), "", "", money_plain(t_exposure)])
    widths = [26 * mm, 34 * mm, 24 * mm, 24 * mm, 16 * mm, 18 * mm, 28 * mm]
    flow.append(styled_table(rows, widths, right_cols=(3, 4, 5, 6), total_row=True))
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
