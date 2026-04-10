"""Add cgt_rate config entry to ReferenceData.

Revision ID: 036
Revises: 035
Create Date: 2026-04-10
"""
from datetime import datetime

import sqlalchemy as sa

from alembic import op

revision = "036"
down_revision = "035"
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
                "classkey": "cgt_rate",
                "referencevalue": "20",
                "sortindex": 0,
                "created_at": now,
                "updated_at": now,
            }
        ],
    )


def downgrade() -> None:
    op.execute("DELETE FROM \"ReferenceData\" WHERE classkey = 'cgt_rate'")
