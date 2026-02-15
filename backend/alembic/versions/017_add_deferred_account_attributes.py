"""Add Release Date, Number of Shares, and Underlying account attributes.

Revision ID: 017
Revises: 016
Create Date: 2026-02-14 00:00:00.000000

"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "017"
down_revision: Union[str, None] = "016"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Release Date, Number of Shares, and Underlying account attributes."""
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
                "referencevalue": "Release Date",
                "sortindex": 8,
                "created_at": now,
                "updated_at": now,
            },
            {
                "classkey": "account_attribute_type",
                "referencevalue": "Number of Shares",
                "sortindex": 9,
                "created_at": now,
                "updated_at": now,
            },
            {
                "classkey": "account_attribute_type",
                "referencevalue": "Underlying",
                "sortindex": 10,
                "created_at": now,
                "updated_at": now,
            },
        ],
    )


def downgrade() -> None:
    """Remove Release Date, Number of Shares, and Underlying account attributes."""
    op.execute(
        """
        DELETE FROM "ReferenceData"
        WHERE classkey = 'account_attribute_type' AND referencevalue IN ('Release Date', 'Number of Shares', 'Underlying')
        """
    )
