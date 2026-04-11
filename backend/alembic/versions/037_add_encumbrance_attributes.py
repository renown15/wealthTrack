"""Add missing Encumbrance and Unencumbered Balance attribute types.

These types were defined in the AttributeType enum but were missing from migrations.
Now added so backend type validation passes on startup.

Revision ID: 037
Revises: 036
Create Date: 2026-04-10
"""
from datetime import datetime

import sqlalchemy as sa

from alembic import op

revision = "037"
down_revision = "036"
branch_labels = None
depends_on = None

_reference_data_table = sa.table(
    "ReferenceData",
    sa.column("classkey", sa.String),
    sa.column("referencevalue", sa.String),
    sa.column("sortindex", sa.Integer),
    sa.column("created_at", sa.DateTime),
    sa.column("updated_at", sa.DateTime),
)

_NEW_ITEMS = [
    ("account_attribute_type", "Encumbrance", 14),
    ("account_attribute_type", "Unencumbered Balance", 15),
]


def upgrade() -> None:
    now = datetime.utcnow()
    # Make idempotent by checking if items already exist
    for classkey, referencevalue, sortindex in _NEW_ITEMS:
        # Check if this row already exists
        result = op.execute(
            f"""
            SELECT id FROM "ReferenceData"
            WHERE classkey = '{classkey}' AND referencevalue = '{referencevalue}'
            """
        )
        if not result.fetchone():
            # Only insert if it doesn't exist
            op.execute(
                f"""
                INSERT INTO "ReferenceData" (classkey, referencevalue, sortindex, created_at, updated_at)
                VALUES ('{classkey}', '{referencevalue}', {sortindex}, '{now.isoformat()}', '{now.isoformat()}')
                """
            )


def downgrade() -> None:
    for classkey, referencevalue, _ in _NEW_ITEMS:
        op.execute(
            f"""
            DELETE FROM "ReferenceData"
            WHERE classkey = '{classkey}'
            AND referencevalue = '{referencevalue}'
            """
        )
