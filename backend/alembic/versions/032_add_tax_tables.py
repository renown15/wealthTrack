"""Add TaxPeriod, TaxReturn, TaxDocument tables.

Revision ID: 032
Revises: 031
Create Date: 2026-04-04
"""
import sqlalchemy as sa

from alembic import op

revision = "032"
down_revision = "031"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "TaxPeriod",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("userid", sa.Integer, sa.ForeignKey("UserProfile.id"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("end_date", sa.Date, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_TaxPeriod_id", "TaxPeriod", ["id"])
    op.create_index("ix_TaxPeriod_userid", "TaxPeriod", ["userid"])

    op.create_table(
        "TaxReturn",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("userid", sa.Integer, sa.ForeignKey("UserProfile.id"), nullable=False),
        sa.Column("accountid", sa.Integer, sa.ForeignKey("Account.id"), nullable=False),
        sa.Column("taxperiodid", sa.Integer, sa.ForeignKey("TaxPeriod.id"), nullable=False),
        sa.Column("income", sa.Numeric(15, 2), nullable=True),
        sa.Column("capital_gain", sa.Numeric(15, 2), nullable=True),
        sa.Column("tax_taken_off", sa.Numeric(15, 2), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_TaxReturn_id", "TaxReturn", ["id"])
    op.create_index("ix_TaxReturn_userid", "TaxReturn", ["userid"])
    op.create_index("ix_TaxReturn_accountid", "TaxReturn", ["accountid"])
    op.create_index("ix_TaxReturn_taxperiodid", "TaxReturn", ["taxperiodid"])
    op.create_unique_constraint(
        "uq_tax_return_user_account_period",
        "TaxReturn",
        ["userid", "accountid", "taxperiodid"],
    )

    op.create_table(
        "TaxDocument",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("userid", sa.Integer, sa.ForeignKey("UserProfile.id"), nullable=False),
        sa.Column("taxreturnid", sa.Integer, sa.ForeignKey("TaxReturn.id"), nullable=False),
        sa.Column("filename", sa.String(500), nullable=False),
        sa.Column("content_type", sa.String(255), nullable=True),
        sa.Column("file_data", sa.LargeBinary, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_TaxDocument_id", "TaxDocument", ["id"])
    op.create_index("ix_TaxDocument_userid", "TaxDocument", ["userid"])
    op.create_index("ix_TaxDocument_taxreturnid", "TaxDocument", ["taxreturnid"])


def downgrade() -> None:
    op.drop_table("TaxDocument")
    op.drop_table("TaxReturn")
    op.drop_table("TaxPeriod")
