"""Add Charity institution type and Charitable giving account type (outgoing).

Revision ID: 060
Revises: 059
"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = '060'
down_revision: Union[str, None] = '059'
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
    ("outgoing_institution_type", "Charity", 13),
    ("outgoing_account_type", "Charitable giving", 65),
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
            "(classkey = 'outgoing_institution_type' AND referencevalue = 'Charity') "
            "OR (classkey = 'outgoing_account_type' AND referencevalue = 'Charitable giving')"
        )
    )
