"""Add Capital Gains Tax event type to reference data.

Replaces the generic 'Liability' event used for CGT on share sales
with a specific 'Capital Gains Tax' event type.

Revision ID: 039
Revises: 038
Create Date: 2026-04-11
"""
from datetime import datetime

import sqlalchemy as sa

from alembic import op

revision = "039"
down_revision = "038"
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


def upgrade() -> None:
    now = datetime.utcnow()
    op.bulk_insert(
        _reference_data_table,
        [
            {
                "classkey": "account_event_type",
                "referencevalue": "Capital Gains Tax",
                "sortindex": 11,
                "created_at": now,
                "updated_at": now,
            }
        ],
    )


def downgrade() -> None:
    op.execute(
        """
        DELETE FROM "ReferenceData"
        WHERE classkey = 'account_event_type'
        AND referencevalue = 'Capital Gains Tax'
        """
    )
