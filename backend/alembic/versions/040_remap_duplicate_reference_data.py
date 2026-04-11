"""Remap duplicate ReferenceData entries and remove duplicates.

Encumbrance and Unencumbered Balance got added twice:
- IDs 105-106: first batch (in use)
- IDs 118-119: duplicates

Remap any accounts using the higher IDs to the lower ones, then delete the duplicates.

Revision ID: 040
Revises: 039
Create Date: 2026-04-11
"""
from typing import Sequence, Union

from alembic import op

revision = "040"
down_revision = "039"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Remap duplicate ReferenceData IDs, keeping lower ID and deleting higher ID."""
    # Remap Encumbrance: 118 → 105
    op.execute("""
        UPDATE "AccountAttribute"
        SET typeid = 105
        WHERE typeid = 118
    """)
    
    # Remap Unencumbered Balance: 119 → 106
    op.execute("""
        UPDATE "AccountAttribute"
        SET typeid = 106
        WHERE typeid = 119
    """)
    
    # Now delete the duplicate ReferenceData entries
    op.execute('DELETE FROM "ReferenceData" WHERE id = 118')
    op.execute('DELETE FROM "ReferenceData" WHERE id = 119')


def downgrade() -> None:
    """No downgrade path — duplicate removal is permanent."""
    pass
