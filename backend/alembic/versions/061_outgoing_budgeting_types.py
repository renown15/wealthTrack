"""Add outgoing budgeting reference data.

Costing method (Fixed / Provision), Actual Cost event types + group type,
and the Costing Method / Outgoing End Date account attribute types.

Revision ID: 061
Revises: 060
"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = '061'
down_revision: Union[str, None] = '060'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_reference_data_table = sa.table(
    "ReferenceData",
    sa.column("classkey", sa.String),
    sa.column("referencevalue", sa.String),
    sa.column("sortindex", sa.Integer),
    sa.column("created_at", sa.DateTime),
    sa.column("updated_at", sa.DateTime),
)

# (class_key, reference_value, sort_index)
_ROWS = [
    ("costing_method", "Fixed", 1),
    ("costing_method", "Provision", 2),
    ("account_event_type", "Actual Cost", 18),
    ("account_event_type", "Actual Cost Date", 19),
    ("event_group_type", "Actual Cost", 4),
    ("account_attribute_type", "Costing Method", 34),
    ("account_attribute_type", "Outgoing End Date", 35),
]


def upgrade() -> None:
    bind = op.get_bind()
    now = datetime.utcnow()
    to_insert = []
    for class_key, value, sort_index in _ROWS:
        existing = bind.execute(
            sa.text(
                "SELECT 1 FROM \"ReferenceData\" "
                "WHERE classkey = :ck AND referencevalue = :rv LIMIT 1"
            ),
            {"ck": class_key, "rv": value},
        ).first()
        if not existing:
            to_insert.append({
                "classkey": class_key, "referencevalue": value, "sortindex": sort_index,
                "created_at": now, "updated_at": now,
            })
    if to_insert:
        op.bulk_insert(_reference_data_table, to_insert)


def downgrade() -> None:
    op.execute(
        sa.text(
            "DELETE FROM \"ReferenceData\" WHERE "
            "classkey = 'costing_method' "
            "OR (classkey = 'account_event_type' "
            "    AND referencevalue IN ('Actual Cost', 'Actual Cost Date')) "
            "OR (classkey = 'event_group_type' AND referencevalue = 'Actual Cost') "
            "OR (classkey = 'account_attribute_type' "
            "    AND referencevalue IN ('Costing Method', 'Outgoing End Date'))"
        )
    )
