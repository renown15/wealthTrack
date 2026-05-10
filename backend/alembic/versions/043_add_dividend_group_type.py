"""Seed Dividend event group type and Dividend Payment Date event type.

Revision ID: 043
Revises: 041
"""
from datetime import datetime

from alembic import op
import sqlalchemy as sa

revision = "043"
down_revision = "041"
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
            {"classkey": "event_group_type", "referencevalue": "Dividend", "sortindex": 2, "created_at": now, "updated_at": now},
            {"classkey": "account_event_type", "referencevalue": "Dividend Payment Date", "sortindex": 11, "created_at": now, "updated_at": now},
        ],
    )


def downgrade() -> None:
    op.execute(
        "DELETE FROM \"ReferenceData\" WHERE classkey = 'event_group_type' AND referencevalue = 'Dividend'"
    )
    op.execute(
        "DELETE FROM \"ReferenceData\" WHERE classkey = 'account_event_type' AND referencevalue = 'Dividend Payment Date'"
    )
