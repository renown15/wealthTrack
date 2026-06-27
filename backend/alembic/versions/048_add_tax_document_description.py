"""Add description column to TaxDocument.

Revision ID: 048
Revises: 047
"""
import sqlalchemy as sa
from alembic import op

revision = '048'
down_revision = '047'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('TaxDocument', sa.Column('description', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('TaxDocument', 'description')
