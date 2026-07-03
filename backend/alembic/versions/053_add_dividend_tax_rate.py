"""Add dividend_tax_rate reference data (moves the hardcoded 40% into ReferenceData).

Revision ID: 053
Revises: 052
"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = '053'
down_revision: Union[str, None] = '052'
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

_CLASS_KEY = "dividend_tax_rate"
_RATE = "40"  # higher-rate dividend provision; edit here or via the ReferenceData admin


def upgrade() -> None:
    now = datetime.utcnow()
    # Idempotent: skip if a value already exists for this class key.
    existing = op.get_bind().execute(
        sa.text('SELECT 1 FROM "ReferenceData" WHERE classkey = :ck LIMIT 1'),
        {"ck": _CLASS_KEY},
    ).first()
    if existing:
        return
    op.bulk_insert(
        _reference_data_table,
        [{"classkey": _CLASS_KEY, "referencevalue": _RATE, "sortindex": 1,
          "created_at": now, "updated_at": now}],
    )


def downgrade() -> None:
    op.execute(
        sa.text('DELETE FROM "ReferenceData" WHERE classkey = :ck'),
        {"ck": _CLASS_KEY},
    )
