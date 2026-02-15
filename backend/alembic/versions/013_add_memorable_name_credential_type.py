"""Add Memorable Name credential type to reference data.

Revision ID: 013
Revises: 012
Create Date: 2026-02-14 00:00:00.000000

"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "013"
down_revision: Union[str, None] = "012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add Memorable Name credential type."""
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
                "classkey": "credential_type",
                "referencevalue": "Memorable Name",
                "sortindex": 7,
                "created_at": now,
                "updated_at": now,
            },
        ],
    )


def downgrade() -> None:
    """Remove Memorable Name credential type."""
    op.execute(
        "DELETE FROM \"ReferenceData\" WHERE classkey = 'credential_type' AND referencevalue = 'Memorable Name'"
    )
