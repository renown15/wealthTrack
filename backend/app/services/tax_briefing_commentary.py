"""Render the tax-period commentary (rich-text HTML) for the briefing PDF."""
from __future__ import annotations

import html as html_lib
import re
from typing import Any

from reportlab.platypus import Flowable, Paragraph

Styles = dict[str, Any]


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
