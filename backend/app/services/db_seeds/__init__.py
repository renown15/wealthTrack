"""Database seed data for reference lookups."""
from app.services.db_seeds.account import ACCOUNT_ITEMS
from app.services.db_seeds.credentials import CREDENTIAL_ITEMS
from app.services.db_seeds.misc import MISC_ITEMS

# Canonical reference data items — single source of truth for all lookup rows.
REFERENCE_DATA_ITEMS = ACCOUNT_ITEMS + CREDENTIAL_ITEMS + MISC_ITEMS

# Re-export the ReferenceDataItem class for compatibility
from app.services.db_seeds.account import ReferenceDataItem

__all__ = ["REFERENCE_DATA_ITEMS", "ReferenceDataItem"]
