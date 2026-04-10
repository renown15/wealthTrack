"""Add Trust Bank Account and Trust Stocks Investment Account types.

Revision ID: 025
Revises: 024
Create Date: 2026-02-15 12:00:00.000000

"""
from datetime import datetime

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "025"
down_revision = "024"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add Trust account types to reference_data."""
    reference_data_table = sa.table(
        "ReferenceData",
        sa.column("classkey", sa.String),
        sa.column("referencevalue", sa.String),
        sa.column("sortindex", sa.Integer),
        sa.column("created_at", sa.DateTime),
        sa.column("updated_at", sa.DateTime),
    )

    now = datetime.utcnow()

    trust_account_types = [
        ("account_type", "TRUST_BANK_ACCOUNT", "Trust Bank Account", 8),
        ("account_type", "TRUST_STOCKS_INVESTMENT", "Trust Stocks Investment Account", 9),
    ]

    op.bulk_insert(
        reference_data_table,
        [
            {
                "classkey": class_key,
                "referencevalue": value,
                "sortindex": sort_index,
                "created_at": now,
                "updated_at": now,
            }
            for class_key, _, value, sort_index in trust_account_types
        ],
    )


def downgrade() -> None:
    """Remove Trust account types from reference_data."""
    op.execute(
        "DELETE FROM \"ReferenceData\" WHERE classkey = 'account_type' AND referencevalue IN ('Trust Bank Account', 'Trust Stocks Investment Account')"
    )
