"""Assemble the Self Assessment supporting schedule PDF from section flowables."""
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
from app.services.tax_briefing_format import HEADER_BG
from app.services.tax_briefing_sa_sections import (
    capital_gains_section,
    commentary_flowables,
    dividends_section,
    figures_reference,
    interest_section,
    provisions_section,
)
from app.services.tax_briefing_sections import (
    documents_section,
    gifts_section,
    out_of_scope_section,
)


@dataclass
class BriefingData:  # pylint: disable=too-many-instance-attributes
    """Everything needed to render one member's Self Assessment schedule for a period."""

    member_name: str
    period_name: str
    portfolio_items: list[dict[str, Any]]
    in_scope: list[dict[str, Any]]
    eligible: list[dict[str, Any]]
    gifts: list[GiftSummary]
    out_of_scope: list[dict[str, Any]] = field(default_factory=list)
    generated_at: date = field(default_factory=date.today)
    period_start: date | None = None
    period_end: date | None = None
    utr: str | None = None
    commentary: str | None = None


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


def _tax_year_label(data: BriefingData) -> str:
    if data.period_start and data.period_end:
        start, end = data.period_start, data.period_end
        return f"{start.day} {start:%B %Y} to {end.day} {end:%B %Y}"
    return data.period_name


def _cover(styles: dict[str, Any], data: BriefingData) -> list[Flowable]:
    return [
        Spacer(1, 28 * mm),
        Paragraph("Self Assessment", styles["title"]),
        Paragraph("Supporting schedule", styles["h2"]),
        Spacer(1, 8 * mm),
        Paragraph(f"Taxpayer: <b>{data.member_name}</b>", styles["body"]),
        Paragraph(f"Tax year: <b>{_tax_year_label(data)}</b>", styles["body"]),
        Paragraph(
            f"Unique Taxpayer Reference (UTR): <b>{data.utr}</b>" if data.utr
            else "Unique Taxpayer Reference (UTR): _______________________", styles["body"]),
        Paragraph(f"Prepared: {data.generated_at.isoformat()}", styles["body"]),
        Spacer(1, 8 * mm),
        Paragraph(
            "A summary of the client's recorded income, gains and supporting documents for "
            "the year, organised to assist preparation of the Self Assessment return. Figures "
            "are as recorded; box references are a guide only.", styles["small"]),
        Spacer(1, 6 * mm),
        Paragraph("Summary of recorded figures", styles["h3"]),
        figures_reference(styles, data.in_scope),
    ]


def build_pdf(data: BriefingData) -> bytes:
    """Render the Self Assessment supporting schedule and return the PDF as bytes."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm, topMargin=20 * mm, bottomMargin=18 * mm,
        title=f"Self Assessment schedule {data.period_name}", author="WealthTrack",
    )
    styles = _styles()

    story: list[Flowable] = []
    story += _cover(styles, data)
    story.append(PageBreak())
    commentary = commentary_flowables(data.commentary, styles)
    if commentary:
        story += commentary
        story.append(PageBreak())
    story += interest_section(styles, data.in_scope)
    story.append(Spacer(1, 6 * mm))
    story += dividends_section(styles, data.in_scope)
    story.append(Spacer(1, 6 * mm))
    story += capital_gains_section(styles, data.in_scope)
    provisions = provisions_section(styles, data.in_scope)
    if provisions:
        story.append(Spacer(1, 6 * mm))
        story += provisions
    excluded = out_of_scope_section(styles, data.out_of_scope)
    if excluded:
        story.append(Spacer(1, 6 * mm))
        story += excluded
    story.append(PageBreak())
    story += gifts_section(styles, data.gifts)
    story.append(PageBreak())
    story += documents_section(styles, data.in_scope + data.eligible)

    doc.build(story)
    return buffer.getvalue()
