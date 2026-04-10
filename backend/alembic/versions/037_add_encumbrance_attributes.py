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
    op.bulk_insert(
        _reference_data_table,
        [
            {
                "classkey": classkey,
                "referencevalue": referencevalue,
                "sortindex": sortindex,
                "created_at": now,
                "updated_at": now,
            }
            for classkey, referencevalue, sortindex in _NEW_ITEMS
        ],
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
