"""Backward compatibility shim for reference data items.

DEPRECATED: Import from app.services.db_seeds instead.

When adding new reference data:
1. Add item(s) to the appropriate db_seeds module (account.py, credentials.py, misc.py)
2. Run ``scripts/seed-db.py`` (or ``make seed-db``) against the target database.

Do NOT add seed-only Alembic migrations — those belong in db_seeds.
DDL changes (new tables, columns, indexes) still go in Alembic migrations.
"""
from app.services.db_seeds import REFERENCE_DATA_ITEMS, ReferenceDataItem

__all__ = ["REFERENCE_DATA_ITEMS", "ReferenceDataItem"]

