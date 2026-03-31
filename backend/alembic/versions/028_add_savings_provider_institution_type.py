"""Add Savings Provider institution type to reference data.

Revision ID: 028
Revises: 027
Create Date: 2026-03-20 00:00:00.000000

"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "028"
down_revision: Union[str, None] = "027"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Savings Provider institution type."""
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
                "classkey": "institution_type",
                "referencevalue": "Savings Provider",
                "sortindex": 6,
                "created_at": now,
                "updated_at": now,
            },
        ],
    )


def downgrade() -> None:
    """Remove Savings Provider institution type."""
    op.execute(
        """
        DELETE FROM "ReferenceData"
        WHERE classkey = 'institution_type' AND referencevalue = 'Savings Provider'
        """
    )
