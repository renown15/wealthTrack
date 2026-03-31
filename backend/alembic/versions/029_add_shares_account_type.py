"""Add Shares account type and Shares Balance attribute type.

Revision ID: 029
Revises: 028
Create Date: 2026-03-20 00:00:00.000000

"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "029"
down_revision: Union[str, None] = "028"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Shares account type and Shares Balance attribute type."""
    reference_data_table = sa.table(
        "ReferenceData",
        sa.column("classkey", sa.String),
        sa.column("referencevalue", sa.String),
        sa.column("sortindex", sa.Integer),
        sa.column("created_at", sa.DateTime),
        sa.column("updated_at", sa.DateTime),
    )

    now = datetime.utcnow()

    op.bulk_insert(
        reference_data_table,
        [
            {
                "classkey": "account_type",
                "referencevalue": "Shares",
                "sortindex": 15,
                "created_at": now,
                "updated_at": now,
            },
            {
                "classkey": "account_attribute_type",
                "referencevalue": "Shares Balance",
                "sortindex": 20,
                "created_at": now,
                "updated_at": now,
            },
        ],
    )


def downgrade() -> None:
    """Remove Shares account type and Shares Balance attribute type."""
    op.execute(
        """
        DELETE FROM "ReferenceData"
        WHERE classkey = 'account_type' AND referencevalue = 'Shares'
        """
    )
    op.execute(
        """
        DELETE FROM "ReferenceData"
        WHERE classkey = 'account_attribute_type' AND referencevalue = 'Shares Balance'
        """
    )
