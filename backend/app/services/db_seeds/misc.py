"""Database seed items for analytics, insurance, and calculation configuration."""
from typing import NamedTuple


class ReferenceDataItem(NamedTuple):
    """Structured data for seeding reference data rows."""

    class_key: str
    reference_value: str
    sort_index: int


MISC_ITEMS: list[ReferenceDataItem] = [
    # -----------------------------------------------------------------------
    # Analytics baseline date
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="analytics_baseline_date", reference_value="", sort_index=0),
    # -----------------------------------------------------------------------
    # Deposit insurance limit (FSCS limit in GBP)
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="deposit_insurance_limit", reference_value="125000", sort_index=1),
    # -----------------------------------------------------------------------
    # Pension calculation assumptions
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="life_expectancy", reference_value="36", sort_index=1),
    ReferenceDataItem(class_key="annuity_assumption_rate", reference_value="0.075", sort_index=1),
    # -----------------------------------------------------------------------
    # Stock target reference prices (format: "TICKER:PRICE_IN_PENCE")
    # -----------------------------------------------------------------------
    ReferenceDataItem(
        class_key="stock_target_ref_price", reference_value="HSBA.L:1400", sort_index=1
    ),
    # -----------------------------------------------------------------------
    # Tax scope status — explicit per-return scope override (NULL = derived).
    # Add further values here (e.g. "Deferred", "Queried") with no migration.
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="tax_scope_status", reference_value="Out of Scope", sort_index=1),
    # -----------------------------------------------------------------------
    # Savings interest tax — flat highest-rate provision on in-scope interest
    # income. Applied as tax_due = income × rate. Edit the % here or in admin.
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="savings_tax_rate", reference_value="45", sort_index=1),
    # -----------------------------------------------------------------------
    # Dividend tax — provision rate applied when recording a dividend and shown
    # per share account in the Tax Hub. Edit the % here or in admin.
    # -----------------------------------------------------------------------
    ReferenceDataItem(class_key="dividend_tax_rate", reference_value="40", sort_index=1),
]
