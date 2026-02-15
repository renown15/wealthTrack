"""Add Deferred Cash and Deferred Shares account types to reference data.

Revision ID: 016
Revises: 015
Create Date: 2026-02-14 00:00:00.000000

"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "016"
down_revision: Union[str, None] = "015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Deferred Cash and Deferred Shares account types."""
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
                "referencevalue": "Deferred Cash",
                "sortindex": 8,
                "created_at": now,
                "updated_at": now,
            },
            {
                "classkey": "account_type",
                "referencevalue": "Deferred Shares",
                "sortindex": 9,
                "created_at": now,
                "updated_at": now,
            },
        ],
    )


def downgrade() -> None:
    """Remove Deferred Cash and Deferred Shares account types."""
    op.execute(
        """
        DELETE FROM "ReferenceData"
        WHERE classkey = 'account_type' AND referencevalue IN ('Deferred Cash', 'Deferred Shares')
        """
    )
