"""Database seed items for user, credential, asset class, and institution types."""
from typing import NamedTuple


class ReferenceDataItem(NamedTuple):
    """Structured data for seeding reference data rows."""

    class_key: str
    reference_value: str
    sort_index: int


CREDENTIAL_ITEMS: list[ReferenceDataItem] = [
    # -----------------------------------------------------------------------
    # User types
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="user_type", reference_value="User", sort_index=1),
    ReferenceDataItem(class_key="user_type", reference_value="SuperUser", sort_index=2),
    # -----------------------------------------------------------------------
    # Asset class values
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="asset_class", reference_value="Cash", sort_index=1),
    ReferenceDataItem(class_key="asset_class", reference_value="Single Stock", sort_index=2),
    ReferenceDataItem(class_key="asset_class", reference_value="Equity Index", sort_index=3),
    # -----------------------------------------------------------------------
    # Credential types
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="credential_type", reference_value="Username", sort_index=1),
    ReferenceDataItem(class_key="credential_type", reference_value="Password", sort_index=2),
    ReferenceDataItem(class_key="credential_type", reference_value="Phone PIN", sort_index=3),
    ReferenceDataItem(
        class_key="credential_type", reference_value="Security Question", sort_index=4
    ),
    ReferenceDataItem(
        class_key="credential_type", reference_value="Mother's Maiden Name", sort_index=5
    ),
    ReferenceDataItem(
        class_key="credential_type", reference_value="Childhood freind", sort_index=6
    ),
    ReferenceDataItem(
        class_key="credential_type", reference_value="Middle name of eldest child", sort_index=7
    ),
    ReferenceDataItem(class_key="credential_type", reference_value="Memorable Date", sort_index=8),
    ReferenceDataItem(class_key="credential_type", reference_value="Memorable Name", sort_index=9),
    ReferenceDataItem(
        class_key="credential_type", reference_value="Memorable Place", sort_index=10
    ),
    ReferenceDataItem(class_key="credential_type", reference_value="Secret Word", sort_index=11),
    # -----------------------------------------------------------------------
    # Institution types
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="institution_type", reference_value="Bank", sort_index=1),
    ReferenceDataItem(
        class_key="institution_type", reference_value="Building Society", sort_index=2
    ),
    ReferenceDataItem(class_key="institution_type", reference_value="HM Government", sort_index=3),
    ReferenceDataItem(class_key="institution_type", reference_value="Fund Manager", sort_index=4),
    ReferenceDataItem(
        class_key="institution_type", reference_value="Pensions Provider", sort_index=5
    ),
    ReferenceDataItem(
        class_key="institution_type", reference_value="Share Registrar", sort_index=6
    ),
]
