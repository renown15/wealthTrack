"""Add institution type to Institution table with INSTITUTION_TYPE reference data.

Revision ID: 011
Revises: 010
Create Date: 2026-02-14 00:00:00.000000

"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "011"
down_revision: Union[str, None] = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add institution type column and reference data."""
    
    # Add institutiontype column to Institution table
    op.add_column(
        "Institution",
        sa.Column("institutiontype", sa.String(length=100), nullable=True)
    )
    
    # Add INSTITUTION_TYPE reference data
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
                "referencevalue": "Bank",
                "sortindex": 1,
                "created_at": now,
                "updated_at": now,
            },
            {
                "classkey": "institution_type",
                "referencevalue": "Building Society",
                "sortindex": 2,
                "created_at": now,
                "updated_at": now,
            },
            {
                "classkey": "institution_type",
                "referencevalue": "HM Government",
                "sortindex": 3,
                "created_at": now,
                "updated_at": now,
            },
            {
                "classkey": "institution_type",
                "referencevalue": "Fund Manager",
                "sortindex": 4,
                "created_at": now,
                "updated_at": now,
            },
        ],
    )


def downgrade() -> None:
    """Remove institution type column and reference data."""
    
    # Remove INSTITUTION_TYPE reference data
    op.execute(
        """
        DELETE FROM "ReferenceData"
        WHERE classkey = 'institution_type'
        """
    )
    
    # Remove institutiontype column from Institution table
    op.drop_column("Institution", "institutiontype")
