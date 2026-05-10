"""Seed Dividend Tax account event type.

Revision ID: 044
Revises: 043
"""
from datetime import datetime

from alembic import op
import sqlalchemy as sa

revision = "044"
down_revision = "043"
branch_labels = None
depends_on = None


def upgrade() -> None:
    now = datetime.utcnow()
    op.bulk_insert(
        sa.table(
            "ReferenceData",
            sa.column("classkey", sa.String),
            sa.column("referencevalue", sa.String),
            sa.column("sortindex", sa.Integer),
            sa.column("created_at", sa.DateTime),
            sa.column("updated_at", sa.DateTime),
        ),
        [
            {
                "classkey": "account_event_type",
                "referencevalue": "Dividend Tax",
                "sortindex": 13,
                "created_at": now,
                "updated_at": now,
            },
        ],
    )


def downgrade() -> None:
    op.execute(
        "DELETE FROM \"ReferenceData\" WHERE classkey = 'account_event_type' AND referencevalue = 'Dividend Tax'"
    )
