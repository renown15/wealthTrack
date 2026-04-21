"""Add account_group_id FK to TaxPeriod.

Revision ID: 041
Revises: 040
"""

revision = "041"
down_revision = "040"
branch_labels = None
depends_on = None

import sqlalchemy as sa
from alembic import op


def upgrade() -> None:
    op.add_column(
        "TaxPeriod",
        sa.Column("account_group_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_taxperiod_account_group",
        "TaxPeriod",
        "AccountGroup",
        ["account_group_id"],
        ["accountgroupid"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_taxperiod_account_group_id",
        "TaxPeriod",
        ["account_group_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_taxperiod_account_group_id", table_name="TaxPeriod")
    op.drop_constraint("fk_taxperiod_account_group", "TaxPeriod", type_="foreignkey")
    op.drop_column("TaxPeriod", "account_group_id")
