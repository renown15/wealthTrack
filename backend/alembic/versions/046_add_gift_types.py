"""Add Gift event types and group type for IHT tracking.

Revision ID: 046
Revises: 045
"""
from datetime import datetime

import sqlalchemy as sa
from alembic import op

revision = "046"
down_revision = "045"
branch_labels = None
depends_on = None


def upgrade() -> None:
    now = datetime.utcnow()
    ref_table = sa.table(
        "ReferenceData",
        sa.column("classkey", sa.String),
        sa.column("referencevalue", sa.String),
        sa.column("sortindex", sa.Integer),
        sa.column("created_at", sa.DateTime),
        sa.column("updated_at", sa.DateTime),
    )
    op.bulk_insert(ref_table, [
        {"classkey": "account_event_type", "referencevalue": "Gift", "sortindex": 14, "created_at": now, "updated_at": now},
        {"classkey": "account_event_type", "referencevalue": "Gift Date", "sortindex": 15, "created_at": now, "updated_at": now},
        {"classkey": "account_event_type", "referencevalue": "Gift Donor", "sortindex": 16, "created_at": now, "updated_at": now},
        {"classkey": "account_event_type", "referencevalue": "Gift Shares", "sortindex": 17, "created_at": now, "updated_at": now},
        {"classkey": "event_group_type", "referencevalue": "Gift", "sortindex": 3, "created_at": now, "updated_at": now},
    ])


def downgrade() -> None:
    op.execute(
        "DELETE FROM \"ReferenceData\" WHERE classkey = 'account_event_type'"
        " AND referencevalue IN ('Gift', 'Gift Date', 'Gift Donor', 'Gift Shares')"
    )
    op.execute(
        "DELETE FROM \"ReferenceData\" WHERE classkey = 'event_group_type' AND referencevalue = 'Gift'"
    )
