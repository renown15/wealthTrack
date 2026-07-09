"""Database seed items for the Outgoings Hub (types, cadence, budgeting)."""
from app.services.db_seeds.account import ReferenceDataItem

OUTGOING_ITEMS: list[ReferenceDataItem] = [
    # -----------------------------------------------------------------------
    # Outgoings-hub account types (class key outgoing_account_type; migration 059).
    # Adding a new outgoing type here (or via the same-class migration) is all
    # that's needed — the Outgoings/wealth split is derived from the class key.
    # -----------------------------------------------------------------------
    ReferenceDataItem(
        class_key="outgoing_account_type", reference_value="Utility - Gas", sort_index=50),
    ReferenceDataItem(
        class_key="outgoing_account_type", reference_value="Utility - Electric", sort_index=51),
    ReferenceDataItem(
        class_key="outgoing_account_type", reference_value="Utility - Water", sort_index=52),
    ReferenceDataItem(
        class_key="outgoing_account_type", reference_value="Utility - Broadband", sort_index=53),
    ReferenceDataItem(
        class_key="outgoing_account_type", reference_value="Insurance - Home", sort_index=54),
    ReferenceDataItem(
        class_key="outgoing_account_type", reference_value="Insurance - Car", sort_index=55),
    ReferenceDataItem(
        class_key="outgoing_account_type", reference_value="Insurance - Life", sort_index=56),
    ReferenceDataItem(
        class_key="outgoing_account_type", reference_value="Insurance - Health", sort_index=57),
    ReferenceDataItem(
        class_key="outgoing_account_type",
        reference_value="Insurance - Income Protection", sort_index=58),
    ReferenceDataItem(
        class_key="outgoing_account_type", reference_value="Subscription", sort_index=59),
    ReferenceDataItem(
        class_key="outgoing_account_type", reference_value="Household", sort_index=60),
    ReferenceDataItem(
        class_key="outgoing_account_type", reference_value="Membership", sort_index=61),
    ReferenceDataItem(
        class_key="outgoing_account_type", reference_value="Tax", sort_index=62),
    ReferenceDataItem(
        class_key="outgoing_account_type", reference_value="School Fees", sort_index=63),
    ReferenceDataItem(
        class_key="outgoing_account_type", reference_value="Mobile phone", sort_index=64),
    ReferenceDataItem(
        class_key="outgoing_account_type", reference_value="Charitable giving", sort_index=65),
    # -----------------------------------------------------------------------
    # Renewal types (outgoing payment cadence; see migration 056)
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="renewal_type", reference_value="Monthly", sort_index=1),
    ReferenceDataItem(class_key="renewal_type", reference_value="Quarterly", sort_index=2),
    ReferenceDataItem(class_key="renewal_type", reference_value="Termly", sort_index=3),
    ReferenceDataItem(class_key="renewal_type", reference_value="Annually", sort_index=4),
    ReferenceDataItem(class_key="renewal_type", reference_value="One-off", sort_index=5),
    # -----------------------------------------------------------------------
    # Costing methods (outgoing budgeting; see migration 061)
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="costing_method", reference_value="Fixed", sort_index=1),
    ReferenceDataItem(class_key="costing_method", reference_value="Provision", sort_index=2),
]
