"""Add asset_class column to Account table.

Revision ID: 027
Revises: 026
Create Date: 2026-02-16 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "027"
down_revision: Union[str, None] = "026"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add asset_class column to Account table."""
    op.add_column(
        "Account",
        sa.Column("asset_class", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    """Remove asset_class column from Account table."""
    op.drop_column("Account", "asset_class")
