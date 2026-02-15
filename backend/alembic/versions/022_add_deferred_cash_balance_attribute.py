"""Add Deferred Cash Balance account attribute.

Revision ID: 022
Revises: 021
Create Date: 2026-02-15 00:00:00.000000

"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "022"
down_revision: Union[str, None] = "021"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Deferred Cash Balance account attribute."""
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
                "classkey": "account_attribute_type",
                "referencevalue": "Deferred Cash Balance",
                "sortindex": 14,
                "created_at": now,
                "updated_at": now,
            },
        ],
    )


def downgrade() -> None:
    """Remove Deferred Cash Balance account attribute."""
    op.execute(
        """
        DELETE FROM "ReferenceData"
        WHERE classkey = 'account_attribute_type' AND referencevalue = 'Deferred Cash Balance'
        """
    )
