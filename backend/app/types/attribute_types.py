"""Typed enumeration for account attribute types."""
import re
from enum import StrEnum
from typing import Literal

ValueType = Literal["string", "sort_code", "percentage", "number", "date", "asset_class_ref"]


class AttributeType(StrEnum):
    """Account attribute type names matching ReferenceData.reference_value."""

    ACCOUNT_NUMBER = "Account Number"
    SORT_CODE = "Sort Code"
    ROLL_REF_NUMBER = "Roll / Ref Number"
    INTEREST_RATE = "Interest Rate"
    FIXED_BONUS_RATE = "Fixed Bonus Rate"
    FIXED_BONUS_RATE_END_DATE = "Fixed Bonus Rate End Date"
    RELEASE_DATE = "Release Date"
    NUMBER_OF_SHARES = "Number of Shares"
    UNDERLYING = "Underlying"
    PRICE = "Price"
    PURCHASE_PRICE = "Purchase Price"
    PENSION_MONTHLY_PAYMENT = "Pension Monthly Payment"
    ASSET_CLASS = "Asset Class"
    ENCUMBRANCE = "Encumbrance"
    UNENCUMBERED_BALANCE = "Unencumbered Balance"
    TAX_YEAR = "Tax Year"

    @property
    def value_type(self) -> ValueType:
        """Return the semantic type of this attribute's value."""
        return _VALUE_TYPES[self]


_VALUE_TYPES: dict[AttributeType, ValueType] = {
    AttributeType.ACCOUNT_NUMBER: "string",
    AttributeType.SORT_CODE: "sort_code",
    AttributeType.ROLL_REF_NUMBER: "string",
    AttributeType.INTEREST_RATE: "percentage",
    AttributeType.FIXED_BONUS_RATE: "percentage",
    AttributeType.FIXED_BONUS_RATE_END_DATE: "date",
    AttributeType.RELEASE_DATE: "date",
    AttributeType.NUMBER_OF_SHARES: "number",
    AttributeType.UNDERLYING: "string",
    AttributeType.PRICE: "number",
    AttributeType.PURCHASE_PRICE: "number",
    AttributeType.PENSION_MONTHLY_PAYMENT: "number",
    AttributeType.ASSET_CLASS: "asset_class_ref",
    AttributeType.ENCUMBRANCE: "number",
    AttributeType.UNENCUMBERED_BALANCE: "number",
    AttributeType.TAX_YEAR: "string",
}

# Maps snake_case field shorthands → AttributeType (for validation lookups)
FIELD_TO_ATTR_TYPE: dict[str, AttributeType] = {
    "account_number": AttributeType.ACCOUNT_NUMBER,
    "sort_code": AttributeType.SORT_CODE,
    "roll_ref_number": AttributeType.ROLL_REF_NUMBER,
    "interest_rate": AttributeType.INTEREST_RATE,
    "fixed_bonus_rate": AttributeType.FIXED_BONUS_RATE,
    "fixed_bonus_rate_end_date": AttributeType.FIXED_BONUS_RATE_END_DATE,
    "release_date": AttributeType.RELEASE_DATE,
    "number_of_shares": AttributeType.NUMBER_OF_SHARES,
    "underlying": AttributeType.UNDERLYING,
    "price": AttributeType.PRICE,
    "purchase_price": AttributeType.PURCHASE_PRICE,
    "pension_monthly_payment": AttributeType.PENSION_MONTHLY_PAYMENT,
    "asset_class": AttributeType.ASSET_CLASS,
    "encumbrance": AttributeType.ENCUMBRANCE,
    "unencumbered_balance": AttributeType.UNENCUMBERED_BALANCE,
    "tax_year": AttributeType.TAX_YEAR,
}

_SORT_CODE_RE = re.compile(r"^\d{2}-\d{2}-\d{2}$")


def validate_attribute_field(field: str, value: str) -> None:
    """Raise ValueError if value does not match the field's expected type."""
    attr_type = FIELD_TO_ATTR_TYPE.get(field)
    if attr_type is None or not value:
        return
    vtype = attr_type.value_type
    if vtype == "sort_code" and not _SORT_CODE_RE.match(value):
        raise ValueError(f"Sort code must be in XX-YY-ZZ format, got: {value!r}")
    if vtype == "percentage":
        try:
            pct = float(value)
        except (ValueError, TypeError) as exc:
            raise ValueError(f"{field} must be a number, got: {value!r}") from exc
        if not 0 <= pct <= 100:
            raise ValueError(f"{field} must be between 0 and 100, got: {pct}")
    if vtype == "number":
        try:
            float(value)
        except (ValueError, TypeError) as exc:
            raise ValueError(f"{field} must be a number, got: {value!r}") from exc
