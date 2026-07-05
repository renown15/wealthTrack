"""Database seed items for account-related types."""
from typing import NamedTuple


class ReferenceDataItem(NamedTuple):
    """Structured data for seeding reference data rows."""

    class_key: str
    reference_value: str
    sort_index: int


ACCOUNT_ITEMS: list[ReferenceDataItem] = [
    # -----------------------------------------------------------------------
    # Account types
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="account_type", reference_value="Current Account", sort_index=1),
    ReferenceDataItem(class_key="account_type", reference_value="Savings Account", sort_index=2),
    ReferenceDataItem(class_key="account_type", reference_value="Cash ISA", sort_index=3),
    ReferenceDataItem(class_key="account_type", reference_value="Fixed Rate ISA", sort_index=4),
    ReferenceDataItem(class_key="account_type", reference_value="Stocks ISA", sort_index=5),
    ReferenceDataItem(
        class_key="account_type", reference_value="Fixed / Bonus Rate Saver", sort_index=6
    ),
    ReferenceDataItem(class_key="account_type", reference_value="Premium Bonds", sort_index=7),
    ReferenceDataItem(
        class_key="account_type", reference_value="Deferred DC Pension", sort_index=8
    ),
    ReferenceDataItem(
        class_key="account_type", reference_value="Deferred DB Pension", sort_index=9
    ),
    ReferenceDataItem(class_key="account_type", reference_value="Deferred Cash", sort_index=10),
    ReferenceDataItem(class_key="account_type", reference_value="Deferred Shares", sort_index=11),
    ReferenceDataItem(class_key="account_type", reference_value="RSU", sort_index=12),
    ReferenceDataItem(
        class_key="account_type", reference_value="Trust Bank Account", sort_index=13
    ),
    ReferenceDataItem(
        class_key="account_type", reference_value="Trust Stocks Investment Account", sort_index=14
    ),
    ReferenceDataItem(class_key="account_type", reference_value="Shares", sort_index=15),
    ReferenceDataItem(class_key="account_type", reference_value="Tax Liability", sort_index=16),
    # Outgoings-hub account types (class key outgoing_account_type; see migration 059).
    # Adding a new outgoing type here (or via the same-class migration) is all that's
    # needed — the Outgoings/wealth split is derived from the class key.
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
    ReferenceDataItem(
        class_key="account_type", reference_value="School Fees", sort_index=63),
    ReferenceDataItem(
        class_key="account_type", reference_value="Mobile phone", sort_index=64),
    # -----------------------------------------------------------------------
    # Account statuses
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="account_status", reference_value="Active", sort_index=1),
    ReferenceDataItem(class_key="account_status", reference_value="Closed", sort_index=2),
    # -----------------------------------------------------------------------
    # Account event types
    # -----------------------------------------------------------------------
    ReferenceDataItem(
        class_key="account_event_type", reference_value="Balance Update", sort_index=1
    ),
    ReferenceDataItem(class_key="account_event_type", reference_value="Interest", sort_index=2),
    ReferenceDataItem(class_key="account_event_type", reference_value="Dividend", sort_index=3),
    ReferenceDataItem(class_key="account_event_type", reference_value="Win", sort_index=4),
    ReferenceDataItem(class_key="account_event_type", reference_value="Share Sale", sort_index=8),
    ReferenceDataItem(class_key="account_event_type", reference_value="Liability", sort_index=9),
    ReferenceDataItem(
        class_key="account_event_type", reference_value="Dividend Payment Date", sort_index=11
    ),
    ReferenceDataItem(
        class_key="account_event_type", reference_value="Share Sale Date", sort_index=12
    ),
    # -----------------------------------------------------------------------
    # Account attribute types
    # -----------------------------------------------------------------------
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Account Opened Date", sort_index=1
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Account Closed Date", sort_index=2
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Account Number", sort_index=3
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Sort Code", sort_index=4
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Roll / Ref Number", sort_index=5
    ),
    ReferenceDataItem(class_key="account_attribute_type", reference_value="Notes", sort_index=6),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Interest Rate", sort_index=7
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Fixed Bonus Rate", sort_index=8
    ),
    ReferenceDataItem(
        class_key="account_attribute_type",
        reference_value="Fixed Bonus Rate End Date",
        sort_index=9,
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Release Date", sort_index=10
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Number of Shares", sort_index=11
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Underlying", sort_index=12
    ),
    ReferenceDataItem(class_key="account_attribute_type", reference_value="Price", sort_index=13),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Purchase Price", sort_index=14
    ),
    ReferenceDataItem(
        class_key="account_attribute_type",
        reference_value="Deferred Shares Balance",
        sort_index=15,
    ),
    ReferenceDataItem(
        class_key="account_attribute_type",
        reference_value="Deferred Cash Balance",
        sort_index=16,
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="RSU Balance", sort_index=17
    ),
    ReferenceDataItem(
        class_key="account_attribute_type",
        reference_value="Pension Monthly Payment",
        sort_index=18,
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Asset Class", sort_index=19
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Shares Balance", sort_index=20
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Encumbrance", sort_index=21
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Unencumbered Balance", sort_index=22
    ),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Tax Year", sort_index=23
    ),
    # Outgoings-hub account attribute types (see migration 049).
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Renewal Date", sort_index=30),
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Monthly Cost", sort_index=31),
    # Account-level UTR, shown for Trust accounts (see migration 055).
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="UTR", sort_index=32),
    # Renewal type for outgoings (see migration 056).
    ReferenceDataItem(
        class_key="account_attribute_type", reference_value="Renewal Type", sort_index=33),
    # -----------------------------------------------------------------------
    # Renewal types (outgoing payment cadence; see migration 056)
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="renewal_type", reference_value="Monthly", sort_index=1),
    ReferenceDataItem(class_key="renewal_type", reference_value="Quarterly", sort_index=2),
    ReferenceDataItem(class_key="renewal_type", reference_value="Termly", sort_index=3),
    ReferenceDataItem(class_key="renewal_type", reference_value="Annually", sort_index=4),
    ReferenceDataItem(class_key="renewal_type", reference_value="One-off", sort_index=5),
]
