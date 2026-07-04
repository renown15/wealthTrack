"""Unit tests for portfolio attribute surfacing (guards the outgoings read bug).

Renewal Date, Renewal Type and Monthly Cost were written to the DB but never
copied onto the portfolio output, so the Outgoings Hub always saw null. These
tests lock in that build_attributes_dict surfaces them (and UTR).
"""
from app.repositories.portfolio_builders import _LABEL_TO_KEY, build_attributes_dict


def test_label_to_key_maps_outgoing_and_utr_labels():
    assert _LABEL_TO_KEY["Renewal Date"] == "renewal_date"
    assert _LABEL_TO_KEY["Renewal Type"] == "renewal_type"
    assert _LABEL_TO_KEY["Monthly Cost"] == "monthly_cost"
    assert _LABEL_TO_KEY["UTR"] == "utr"


def test_build_attributes_dict_surfaces_outgoing_fields():
    raw = {
        "Monthly Cost": "45.00",
        "Renewal Type": "Quarterly",
        "Renewal Date": "15/06/2027",
        "UTR": "1234567890",
    }
    result = build_attributes_dict(raw)
    assert result["monthly_cost"] == "45.00"
    assert result["renewal_type"] == "Quarterly"
    assert result["renewal_date"] == "15/06/2027"
    assert result["utr"] == "1234567890"


def test_build_attributes_dict_defaults_missing_to_none():
    result = build_attributes_dict({})
    assert result["monthly_cost"] is None
    assert result["renewal_type"] is None
    assert result["renewal_date"] is None
    assert result["utr"] is None
