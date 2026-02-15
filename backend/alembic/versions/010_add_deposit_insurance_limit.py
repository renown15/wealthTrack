"""Add DEPOSIT_INSURANCE_LIMIT to reference data.

Revision ID: 010
Revises: 009
Create Date: 2026-02-13 00:00:00.000000

"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add DEPOSIT_INSURANCE_LIMIT reference data."""
    reference_data_table = sa.table(
        "ReferenceData",
        sa.column("classkey", sa.String),
        sa.column("referencevalue", sa.String),
        sa.column("sortindex", sa.Integer),
        sa.column("created_at", sa.DateTime),
        sa.column("updated_at", sa.DateTime),
    )

    now = datetime.utcnow()

    op.execute(
        reference_data_table.insert().values(
            **{
                "classkey": "deposit_insurance_limit",
                "referencevalue": "125000",
                "sortindex": 1,
                "created_at": now,
                "updated_at": now,
            }
        )
    )


def downgrade() -> None:
    """Remove DEPOSIT_INSURANCE_LIMIT reference data."""
    op.execute(
        "DELETE FROM \"ReferenceData\" WHERE classkey = 'deposit_insurance_limit'"
    )
