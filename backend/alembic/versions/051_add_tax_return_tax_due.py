"""Add tax_due column to TaxReturn.

Separates estimated/owed tax (e.g. CGT and the dividend provision, held on the
Tax Liability account) from tax_taken_off, which is reserved for tax actually
withheld at source.

Revision ID: 051
Revises: 050
"""
import sqlalchemy as sa
from alembic import op

revision = "051"
down_revision = "050"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("TaxReturn", sa.Column("tax_due", sa.Numeric(15, 2), nullable=True))


def downgrade() -> None:
    op.drop_column("TaxReturn", "tax_due")
