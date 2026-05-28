"""Add Family and FamilyMemberAccount tables.

Revision ID: 045
Revises: 044
"""
from datetime import datetime

import sqlalchemy as sa
from alembic import op

revision = "045"
down_revision = "044"
branch_labels = None
depends_on = None


def upgrade() -> None:
    now = datetime.utcnow()
    op.create_table(
        "Family",
        sa.Column("familyid", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column(
            "owningaccountid",
            sa.Integer,
            sa.ForeignKey("UserProfile.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("created_at", sa.DateTime, nullable=False, default=now),
        sa.Column("updated_at", sa.DateTime, nullable=False, default=now),
    )
    op.create_table(
        "FamilyMemberAccount",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "familyid",
            sa.Integer,
            sa.ForeignKey("Family.familyid"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "accountid",
            sa.Integer,
            sa.ForeignKey("UserProfile.id"),
            nullable=False,
            index=True,
        ),
        sa.Column("created_at", sa.DateTime, nullable=False, default=now),
        sa.Column("updated_at", sa.DateTime, nullable=False, default=now),
    )


def downgrade() -> None:
    op.drop_table("FamilyMemberAccount")
    op.drop_table("Family")
