"""Add Deposit, Withdrawal, Fee, Tax event types to reference data.

Revision ID: 031
Revises: 030
Create Date: 2026-04-04
"""
from datetime import datetime

import sqlalchemy as sa

from alembic import op

revision = "031"
down_revision = "030"
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

_NEW_EVENT_TYPES = ["Deposit", "Withdrawal", "Fee", "Tax"]


def upgrade() -> None:
    now = datetime.utcnow()
    op.bulk_insert(
        _reference_data_table,
        [
            {
                "classkey": "account_event_type",
                "referencevalue": value,
                "sortindex": i,
                "created_at": now,
                "updated_at": now,
            }
            for i, value in enumerate(_NEW_EVENT_TYPES, start=5)
        ],
    )


def downgrade() -> None:
    for value in _NEW_EVENT_TYPES:
        op.execute(
            f"""
            DELETE FROM "ReferenceData"
            WHERE classkey = 'account_event_type'
            AND referencevalue = '{value}'
            """
        )
