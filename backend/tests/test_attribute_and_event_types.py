"""Tests for AttributeType, EventType enums and attribute validation."""
import pytest

from app.types.attribute_types import (
    FIELD_TO_ATTR_TYPE,
    AttributeType,
    validate_attribute_field,
)
from app.types.event_types import EventType


class TestAttributeType:
    def test_all_members_have_value_type(self):
        for at in AttributeType:
            assert at.value_type in (
                "string", "sort_code", "percentage", "number", "date", "asset_class_ref"
            ), f"{at} has unexpected value_type {at.value_type}"

    def test_sort_code_value_type(self):
        assert AttributeType.SORT_CODE.value_type == "sort_code"

    def test_interest_rate_value_type(self):
        assert AttributeType.INTEREST_RATE.value_type == "percentage"

    def test_fixed_bonus_rate_value_type(self):
        assert AttributeType.FIXED_BONUS_RATE.value_type == "percentage"

    def test_encumbrance_value_type(self):
        assert AttributeType.ENCUMBRANCE.value_type == "number"

    def test_asset_class_value_type(self):
        assert AttributeType.ASSET_CLASS.value_type == "asset_class_ref"

    def test_account_number_value_type(self):
        assert AttributeType.ACCOUNT_NUMBER.value_type == "string"

    def test_release_date_value_type(self):
        assert AttributeType.RELEASE_DATE.value_type == "date"

    def test_str_values_match_reference_data_labels(self):
        assert str(AttributeType.SORT_CODE) == "Sort Code"
        assert str(AttributeType.INTEREST_RATE) == "Interest Rate"
        assert str(AttributeType.ENCUMBRANCE) == "Encumbrance"

    def test_field_to_attr_type_has_all_typed_fields(self):
        typed_fields = [
            "account_number", "sort_code", "interest_rate", "fixed_bonus_rate",
            "encumbrance", "unencumbered_balance", "asset_class",
        ]
        for field in typed_fields:
            assert field in FIELD_TO_ATTR_TYPE, f"{field} missing from FIELD_TO_ATTR_TYPE"


class TestEventType:
    def test_all_members_have_number_value_type(self):
        for et in EventType:
            assert et.value_type == "number"

    def test_str_values(self):
        assert str(EventType.BALANCE_UPDATE) == "Balance Update"
        assert str(EventType.WIN) == "Win"
        assert str(EventType.INTEREST) == "Interest"


class TestValidateAttributeField:
    def test_valid_sort_code(self):
        validate_attribute_field("sort_code", "12-34-56")  # no exception

    def test_invalid_sort_code_no_dashes(self):
        with pytest.raises(ValueError, match="XX-YY-ZZ"):
            validate_attribute_field("sort_code", "123456")

    def test_invalid_sort_code_wrong_format(self):
        with pytest.raises(ValueError, match="XX-YY-ZZ"):
            validate_attribute_field("sort_code", "12/34/56")

    def test_valid_percentage(self):
        validate_attribute_field("interest_rate", "4.5")  # no exception
        validate_attribute_field("fixed_bonus_rate", "0")
        validate_attribute_field("interest_rate", "100")

    def test_percentage_above_100(self):
        with pytest.raises(ValueError, match="between 0 and 100"):
            validate_attribute_field("interest_rate", "101")

    def test_percentage_negative(self):
        with pytest.raises(ValueError, match="between 0 and 100"):
            validate_attribute_field("interest_rate", "-1")

    def test_percentage_not_a_number(self):
        with pytest.raises(ValueError, match="must be a number"):
            validate_attribute_field("interest_rate", "abc")

    def test_valid_number(self):
        validate_attribute_field("encumbrance", "5000.50")  # no exception

    def test_number_not_a_number(self):
        with pytest.raises(ValueError, match="must be a number"):
            validate_attribute_field("encumbrance", "bad")

    def test_empty_value_skips_validation(self):
        validate_attribute_field("sort_code", "")  # no exception
        validate_attribute_field("interest_rate", "")

    def test_none_value_skips_validation(self):
        validate_attribute_field("sort_code", None)  # type: ignore[arg-type]

    def test_unknown_field_skips_validation(self):
        validate_attribute_field("unknown_field", "anything")  # no exception

    def test_string_field_always_valid(self):
        validate_attribute_field("account_number", "any-value-123")  # no exception

    def test_asset_class_ref_not_validated_by_value(self):
        validate_attribute_field("asset_class", "Cash")  # no exception
        validate_attribute_field("asset_class", "Equity Index")
