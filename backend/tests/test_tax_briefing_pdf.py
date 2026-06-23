"""Unit tests for the tax briefing PDF builders (no database)."""
import io
from datetime import date
from types import SimpleNamespace

from PIL import Image as PILImage

from app.schemas.gift import GiftSummary
from app.services.tax_briefing_format import category_for, exclusion_reason, money, to_float
from app.services.tax_briefing_images import compress_document_image, is_image
from app.services.tax_briefing_pdf import BriefingData, build_pdf
from app.services.tax_briefing_sections import build_portfolio_map


def _png_bytes() -> bytes:
    buf = io.BytesIO()
    PILImage.new("RGB", (40, 30), (200, 10, 10)).save(buf, format="PNG")
    return buf.getvalue()


def test_money_formats_and_handles_invalid():
    assert money(1234.5) == "£1,234.50"
    assert money("250") == "£250.00"
    assert money(None) == "—"
    assert money("abc") == "—"


def test_to_float():
    assert to_float("12.5") == 12.5
    assert to_float(None) == 0.0
    assert to_float("x") == 0.0


def test_category_for():
    assert category_for("Cash ISA") == "ISA"
    assert category_for("SIPP") == "Pensions"
    assert category_for("Current Account") == "Cash"
    assert category_for("Tax Liability") == "Tax Liability"
    assert category_for("Mystery") == "Other"


def test_exclusion_reason():
    assert "ISA" in exclusion_reason("Cash ISA")
    assert "Pension" in exclusion_reason("SIPP")
    assert "Premium Bonds" in exclusion_reason("Premium Bonds")
    assert exclusion_reason("Current Account") == "No taxable income or gains in period"


def test_is_image():
    assert is_image("image/png", "x.png")
    assert is_image(None, "scan.JPEG")
    assert not is_image("application/pdf", "statement.pdf")


def test_compress_document_image_returns_image_for_png():
    assert compress_document_image(_png_bytes()) is not None


def test_compress_document_image_rejects_non_image():
    assert compress_document_image(b"not an image") is None


def test_build_portfolio_map_skips_missing_ids():
    items = [
        {"account": {"id": 1, "name": "A"}, "accountType": "Cash ISA",
         "latestBalance": {"value": "100"}},
        {"account": {}, "accountType": "X", "latestBalance": {}},
    ]
    pmap = build_portfolio_map(items)
    assert pmap[1]["value"] == 100.0
    assert len(pmap) == 1


def test_build_pdf_smoke_produces_valid_pdf():
    account = SimpleNamespace(id=1, name="Savings")
    tax_return = SimpleNamespace(income=1000, capital_gain=0, tax_taken_off=0)
    item = {"account": account, "account_type": "Savings Account",
            "tax_return": tax_return, "documents": []}
    portfolio = [{"account": {"id": 1, "name": "Savings"}, "accountType": "Savings Account",
                  "latestBalance": {"value": "5000"}}]
    gift = GiftSummary(
        group_id=1, account_id=1, account_name="ISA", donor="Mum",
        gift_date=date(2024, 1, 1), gift_value_gbp="1000", num_shares=None,
        years_elapsed=2.5, iht_rate="0.32", iht_exposure="320",
    )
    data = BriefingData(
        member_name="Test User", period_name="2025/26",
        portfolio_items=portfolio, in_scope=[item], eligible=[], gifts=[gift],
    )
    pdf = build_pdf(data)
    assert pdf[:5] == b"%PDF-"
    assert len(pdf) > 1000


def test_build_pdf_handles_empty_data():
    data = BriefingData(
        member_name="Nobody", period_name="2024/25",
        portfolio_items=[], in_scope=[], eligible=[], gifts=[],
    )
    pdf = build_pdf(data)
    assert pdf[:5] == b"%PDF-"
