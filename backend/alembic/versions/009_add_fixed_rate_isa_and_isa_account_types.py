"""Add Fixed Rate ISA and ISA account types.

Revision ID: 009
Revises: 008
Create Date: 2026-02-13 19:30:00.000000

"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add new account types: Fixed Rate ISA and ISA."""
    reference_data_table = sa.table(
        "ReferenceData",
        sa.column("classkey", sa.String),
        sa.column("referencevalue", sa.String),
        sa.column("sortindex", sa.Integer),
        sa.column("created_at", sa.DateTime),
        sa.column("updated_at", sa.DateTime),
    )

    now = datetime.utcnow()

    # Insert new account types
    # Fixed Rate ISA (sort index 8) - will show fixed bonus rate fields
    # ISA (sort index 9) - will show same fields as Savings
    op.bulk_insert(
        reference_data_table,
        [
            {
                "classkey": "account_type",
                "referencevalue": "Fixed Rate ISA",
                "sortindex": 8,
                "created_at": now,
                "updated_at": now,
            },
            {
                "classkey": "account_type",
                "referencevalue": "ISA",
                "sortindex": 9,
                "created_at": now,
                "updated_at": now,
            },
        ],
    )


def downgrade() -> None:
    """Remove the new account types."""
    op.execute(
        """
        DELETE FROM "ReferenceData"
        WHERE classkey = 'account_type'
        AND referencevalue IN ('Fixed Rate ISA', 'ISA')
        """
    )
