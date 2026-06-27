"""Add outgoing account types and renewal_date/monthly_cost attribute types.

Revision ID: 049
Revises: 048
"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = '049'
down_revision: Union[str, None] = '048'
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

_ACCOUNT_TYPES = [
    ('account_type', 'Utility - Gas', 50),
    ('account_type', 'Utility - Electric', 51),
    ('account_type', 'Utility - Water', 52),
    ('account_type', 'Utility - Broadband', 53),
    ('account_type', 'Insurance - Home', 54),
    ('account_type', 'Insurance - Car', 55),
    ('account_type', 'Insurance - Life', 56),
    ('account_type', 'Insurance - Health', 57),
    ('account_type', 'Insurance - Income Protection', 58),
    ('account_type', 'Subscription', 59),
    ('account_attribute_type', 'Renewal Date', 30),
    ('account_attribute_type', 'Monthly Cost', 31),
]


def upgrade() -> None:
    now = datetime.utcnow()
    op.bulk_insert(
        _reference_data_table,
        [
            {"classkey": ck, "referencevalue": rv, "sortindex": si,
             "created_at": now, "updated_at": now}
            for ck, rv, si in _ACCOUNT_TYPES
        ],
    )


def downgrade() -> None:
    for _ck, rv, _si in _ACCOUNT_TYPES:
        op.execute(
            sa.text('DELETE FROM "ReferenceData" WHERE referencevalue = :v'),
            {"v": rv},
        )
