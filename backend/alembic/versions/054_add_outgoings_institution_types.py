"""Add Outgoings-hub institution types (provider types for utilities/insurance/subs).

Revision ID: 054
Revises: 053
"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = '054'
down_revision: Union[str, None] = '053'
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

_TYPES = [
    ("Utility Provider", 7),
    ("Insurer", 8),
    ("Subscription Service", 9),
]


def upgrade() -> None:
    now = datetime.utcnow()
    existing = {
        row[0] for row in op.get_bind().execute(
            sa.text("SELECT referencevalue FROM \"ReferenceData\" WHERE classkey = 'institution_type'")
        )
    }
    rows = [
        {"classkey": "institution_type", "referencevalue": name, "sortindex": idx,
         "created_at": now, "updated_at": now}
        for name, idx in _TYPES if name not in existing
    ]
    if rows:
        op.bulk_insert(_reference_data_table, rows)


def downgrade() -> None:
    for name, _idx in _TYPES:
        op.execute(
            sa.text(
                "DELETE FROM \"ReferenceData\" "
                "WHERE classkey = 'institution_type' AND referencevalue = :v"
            ),
            {"v": name},
        )
