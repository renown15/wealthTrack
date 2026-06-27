"""Assemble the tax briefing PDF document from section flowables."""
from __future__ import annotations

import io
from dataclasses import dataclass, field
from datetime import date
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Flowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer

from app.schemas.gift import GiftSummary
from app.services.tax_briefing_format import HEADER_BG, money, to_float
from app.services.tax_briefing_sections import (
    build_portfolio_map,
    documents_section,
    gifts_section,
    out_of_scope_section,
    tax_detail_section,
    wealth_section,
)


@dataclass
class BriefingData:
    """Everything needed to render one member's briefing pack for a period."""

    member_name: str
    period_name: str
    portfolio_items: list[dict[str, Any]]
    in_scope: list[dict[str, Any]]
    eligible: list[dict[str, Any]]
    gifts: list[GiftSummary]
    out_of_scope: list[dict[str, Any]] = field(default_factory=list)
    generated_at: date = field(default_factory=date.today)


def _styles() -> dict[str, Any]:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle("bp_title", parent=base["Title"], fontSize=24, textColor=HEADER_BG),
        "h2": ParagraphStyle(
            "bp_h2", parent=base["Heading2"], textColor=HEADER_BG, spaceBefore=6, spaceAfter=6),
        "h3": ParagraphStyle("bp_h3", parent=base["Heading3"], spaceBefore=6, spaceAfter=2),
        "body": base["BodyText"],
        "small": ParagraphStyle(
            "bp_small", parent=base["BodyText"], fontSize=8,
            textColor=colors.HexColor("#475569")),
        "cell": ParagraphStyle("bp_cell", parent=base["BodyText"], fontSize=8, leading=10),
    }


def _cover(styles: dict[str, Any], data: BriefingData) -> list[Flowable]:
    grand = sum(to_float((i.get("latestBalance") or {}).get("value")) for i in data.portfolio_items)
    return [
        Spacer(1, 40 * mm),
        Paragraph("Tax Briefing Pack", styles["title"]),
        Spacer(1, 8 * mm),
        Paragraph(f"Prepared for: <b>{data.member_name}</b>", styles["body"]),
        Paragraph(f"Tax year: <b>{data.period_name}</b>", styles["body"]),
        Paragraph(f"Generated: {data.generated_at.isoformat()}", styles["body"]),
        Spacer(1, 10 * mm),
        Paragraph(f"Total wealth: <b>{money(grand)}</b>", styles["body"]),
        Paragraph(f"Accounts in scope for return: <b>{len(data.in_scope)}</b>", styles["body"]),
        Paragraph(
            "This pack reconciles total wealth to the accounts relevant to the self-assessment "
            "return, details the taxable figures, summarises gift/IHT exposure, and lists the "
            "supporting documents held for the period.",
            styles["small"],
        ),
    ]


def build_pdf(data: BriefingData) -> bytes:
    """Render the briefing pack and return the PDF as bytes."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm, topMargin=20 * mm, bottomMargin=18 * mm,
        title=f"Tax Briefing {data.period_name}", author="WealthTrack",
    )
    styles = _styles()
    pmap = build_portfolio_map(data.portfolio_items)

    story: list[Flowable] = []
    story += _cover(styles, data)
    story.append(PageBreak())
    story += wealth_section(styles, data.portfolio_items, data.in_scope, data.eligible, pmap)
    story.append(Spacer(1, 6 * mm))
    story += tax_detail_section(styles, data.in_scope)
    out_of_scope = out_of_scope_section(styles, data.out_of_scope)
    if out_of_scope:
        story.append(Spacer(1, 6 * mm))
        story += out_of_scope
    story.append(PageBreak())
    story += gifts_section(styles, data.gifts)
    story.append(PageBreak())
    story += documents_section(styles, data.in_scope + data.eligible)

    doc.build(story)
    return buffer.getvalue()
