"""Renewal Type attribute + renewal_type reference data (outgoing cadence).

Revision ID: 056
Revises: 055
"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = '056'
down_revision: Union[str, None] = '055'
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
    ("account_attribute_type", "Renewal Type", 33),
    ("renewal_type", "Monthly", 1),
    ("renewal_type", "Quarterly", 2),
    ("renewal_type", "Termly", 3),
    ("renewal_type", "Annually", 4),
    ("renewal_type", "One-off", 5),
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
            "DELETE FROM \"ReferenceData\" "
            "WHERE (classkey = 'account_attribute_type' AND referencevalue = 'Renewal Type') "
            "OR classkey = 'renewal_type'"
        )
    )
