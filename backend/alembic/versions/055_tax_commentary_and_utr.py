"""Tax period commentary, user UTR, and account-level UTR attribute.

Revision ID: 055
Revises: 054
"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = '055'
down_revision: Union[str, None] = '054'
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
    op.add_column("TaxPeriod", sa.Column("commentary", sa.Text(), nullable=True))
    op.add_column("UserProfile", sa.Column("utr", sa.String(length=20), nullable=True))
    existing = op.get_bind().execute(
        sa.text(
            "SELECT 1 FROM \"ReferenceData\" "
            "WHERE classkey = 'account_attribute_type' AND referencevalue = 'UTR' LIMIT 1"
        )
    ).first()
    if not existing:
        now = datetime.utcnow()
        op.bulk_insert(
            _reference_data_table,
            [{"classkey": "account_attribute_type", "referencevalue": "UTR", "sortindex": 32,
              "created_at": now, "updated_at": now}],
        )


def downgrade() -> None:
    op.execute(
        sa.text(
            "DELETE FROM \"ReferenceData\" "
            "WHERE classkey = 'account_attribute_type' AND referencevalue = 'UTR'"
        )
    )
    op.drop_column("UserProfile", "utr")
    op.drop_column("TaxPeriod", "commentary")
