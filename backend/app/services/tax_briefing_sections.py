"""Gifts (IHT) and supporting-documents sections of the tax briefing PDF."""
from __future__ import annotations

from typing import Any

from reportlab.lib.units import mm
from reportlab.platypus import Flowable, Paragraph, Spacer

from app.schemas.gift import GiftSummary
from app.services.tax_briefing_format import (
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


def out_of_scope_section(styles: Styles, items: list[dict[str, Any]]) -> list[Flowable]:
    """Accounts the client marked out of scope, with the reason — so nothing is missed."""
    if not items:
        return []
    flow: list[Flowable] = [
        Paragraph("Accounts excluded by the client", styles["h3"]),
        Paragraph(
            "Marked out of scope by the client and not included above; shown for completeness.",
            styles["small"]),
    ]
    rows: list[list[Any]] = [["Account", "Type", "Reason"]]
    for item in items:
        note = getattr(item.get("tax_return"), "note", None) or "—"
        rows.append(
            [_cell(item["account"].name, styles), item["account_type"], _cell(note, styles)]
        )
    flow.append(styled_table(rows, [55 * mm, 35 * mm, 80 * mm]))
    return flow


def rules_excluded_section(styles: Styles, items: list[dict[str, Any]]) -> list[Flowable]:
    """Accounts the eligibility rules excluded automatically, with the reason for each."""
    if not items:
        return []
    flow: list[Flowable] = [
        Paragraph("Accounts excluded by the rules", styles["h3"]),
        Paragraph(
            "Held but automatically excluded from the return — tax-free wrappers, pensions, "
            "trust holdings, and accounts with no taxable income or gains in the period. "
            "Listed so nothing is overlooked.", styles["small"]),
    ]
    rows: list[list[Any]] = [["Account", "Type", "Reason"]]
    for item in items:
        rows.append([
            _cell(item["account"].name, styles),
            item["account_type"],
            _cell(exclusion_reason(item["account_type"]), styles),
        ])
    flow.append(styled_table(rows, [55 * mm, 35 * mm, 80 * mm]))
    return flow


def gifts_section(styles: Styles, gifts: list[GiftSummary]) -> list[Flowable]:
    """Gifts recorded for IHT — context for the accountant, not part of the SA return."""
    flow: list[Flowable] = [Paragraph("6. Gifts made (Inheritance Tax)", styles["h2"])]
    if not gifts:
        flow.append(Paragraph("No gifts recorded.", styles["body"]))
        return flow
    flow.append(Paragraph(
        "Recorded for inheritance tax planning — not part of the income tax Self "
        "Assessment return. Shown for completeness.", styles["small"]))
    rows: list[list[Any]] = [
        ["Donor", "Recipient", "Date", "Value (£)", "Years", "Taper", "Exposure (£)"]]
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
    flow: list[Flowable] = [Paragraph("7. Supporting documents", styles["h2"])]
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
