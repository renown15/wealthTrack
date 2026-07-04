"""Gifts (IHT) and supporting-documents sections of the tax briefing PDF."""
from __future__ import annotations

from typing import Any

from reportlab.lib.units import mm
from reportlab.platypus import Flowable, Paragraph, Spacer

from app.schemas.gift import GiftSummary
from app.services.tax_briefing_format import (
    account_ref,
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
    safe = str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return Paragraph(safe, styles["cell"])


def _inst_name(item: dict[str, Any]) -> str:
    inst = getattr(item["account"], "institution", None)
    return (getattr(inst, "name", "") or "") if inst is not None else ""


def _by_type(items: list[dict[str, Any]]) -> list[tuple[str, list[dict[str, Any]]]]:
    """Group items by account type; within each type sort by institution then account name."""
    groups: dict[str, list[dict[str, Any]]] = {}
    for item in items:
        groups.setdefault(item["account_type"], []).append(item)
    for group in groups.values():
        group.sort(key=lambda i: (_inst_name(i).lower(), i["account"].name.lower()))
    return sorted(groups.items(), key=lambda kv: kv[0].lower())


def out_of_scope_section(styles: Styles, items: list[dict[str, Any]]) -> list[Flowable]:
    """Accounts the client marked out of scope — grouped by type, with institution and ref."""
    if not items:
        return []
    flow: list[Flowable] = [
        Paragraph("Accounts excluded by the client", styles["h3"]),
        Paragraph(
            "Marked out of scope by the client and not included above; shown for completeness.",
            styles["small"]),
    ]
    for account_type, group in _by_type(items):
        flow.append(Paragraph(f"<b>{account_type}</b>", styles["cell"]))
        rows: list[list[Any]] = [["Institution", "Account", "Account no. / ref", "Reason"]]
        for item in group:
            note = getattr(item.get("tax_return"), "note", None) or "—"
            rows.append([
                _cell(_inst_name(item) or "—", styles), _cell(item["account"].name, styles),
                _cell(account_ref(item) or "—", styles), _cell(note, styles)])
        flow.append(styled_table(rows, [42 * mm, 45 * mm, 43 * mm, 40 * mm]))
    return flow


def rules_excluded_section(styles: Styles, items: list[dict[str, Any]]) -> list[Flowable]:
    """Accounts the rules excluded — grouped by type (with reason), institution and ref."""
    if not items:
        return []
    flow: list[Flowable] = [
        Paragraph("Accounts excluded by the rules", styles["h3"]),
        Paragraph(
            "Held but automatically excluded from the return — tax-free wrappers, pensions, "
            "trust holdings, and accounts with no taxable income or gains in the period. "
            "Grouped by type; listed so nothing is overlooked.", styles["small"]),
    ]
    for account_type, group in _by_type(items):
        flow.append(
            Paragraph(f"<b>{account_type}</b> — {exclusion_reason(account_type)}", styles["cell"]))
        rows: list[list[Any]] = [["Institution", "Account", "Account no. / ref"]]
        for item in group:
            rows.append([
                _cell(_inst_name(item) or "—", styles), _cell(item["account"].name, styles),
                _cell(account_ref(item) or "—", styles)])
        flow.append(styled_table(rows, [55 * mm, 55 * mm, 60 * mm]))
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
