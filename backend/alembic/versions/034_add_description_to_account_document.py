"""Add description column to AccountDocument table.

Revision ID: 034
Revises: 033
Create Date: 2026-04-08
"""
import sqlalchemy as sa
from alembic import op

revision = "034"
down_revision = "033"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("AccountDocument", sa.Column("description", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("AccountDocument", "description")
