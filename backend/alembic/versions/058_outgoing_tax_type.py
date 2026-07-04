"""Add "Tax" outgoing account type.

Revision ID: 058
Revises: 057
"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = '058'
down_revision: Union[str, None] = '057'
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


def upgrade() -> None:
    bind = op.get_bind()
    existing = bind.execute(
        sa.text(
            "SELECT 1 FROM \"ReferenceData\" "
            "WHERE classkey = 'account_type' AND referencevalue = 'Tax' LIMIT 1"
        )
    ).first()
    if not existing:
        now = datetime.utcnow()
        op.bulk_insert(
            _reference_data_table,
            [{"classkey": "account_type", "referencevalue": "Tax", "sortindex": 62,
              "created_at": now, "updated_at": now}],
        )


def downgrade() -> None:
    op.execute(
        sa.text(
            "DELETE FROM \"ReferenceData\" "
            "WHERE classkey = 'account_type' AND referencevalue = 'Tax'"
        )
    )
