"""Add RSU Balance account attribute.

Revision ID: 024
Revises: 023
Create Date: 2026-02-15 00:00:00.000000

"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "024"
down_revision: Union[str, None] = "023"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add RSU Balance account attribute."""
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
                "referencevalue": "RSU Balance",
                "sortindex": 15,
                "created_at": now,
                "updated_at": now,
            },
        ],
    )


def downgrade() -> None:
    """Remove RSU Balance account attribute."""
    op.execute(
        """
        DELETE FROM "ReferenceData"
        WHERE classkey = 'account_attribute_type' AND referencevalue = 'RSU Balance'
        """
    )
