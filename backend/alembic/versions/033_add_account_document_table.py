"""Add AccountDocument table for account-level file attachments.

Revision ID: 033
Revises: 032
Create Date: 2026-04-08
"""
import sqlalchemy as sa

from alembic import op

revision = "033"
down_revision = "032"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "AccountDocument",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("userid", sa.Integer, sa.ForeignKey("UserProfile.id"), nullable=False),
        sa.Column("accountid", sa.Integer, sa.ForeignKey("Account.id"), nullable=False),
        sa.Column("filename", sa.String(500), nullable=False),
        sa.Column("content_type", sa.String(255), nullable=True),
        sa.Column("file_data", sa.LargeBinary, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_AccountDocument_id", "AccountDocument", ["id"])
    op.create_index("ix_AccountDocument_userid", "AccountDocument", ["userid"])
    op.create_index("ix_AccountDocument_accountid", "AccountDocument", ["accountid"])


def downgrade() -> None:
    op.drop_index("ix_AccountDocument_accountid", "AccountDocument")
    op.drop_index("ix_AccountDocument_userid", "AccountDocument")
    op.drop_index("ix_AccountDocument_id", "AccountDocument")
    op.drop_table("AccountDocument")
