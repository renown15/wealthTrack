"""Add RiskScenario and RiskScenarioAccountGroup tables.

Revision ID: 047
Revises: 046
"""
from datetime import datetime

import sqlalchemy as sa
from alembic import op

revision = "047"
down_revision = "046"
branch_labels = None
depends_on = None


def upgrade() -> None:
    now = datetime.utcnow()
    op.create_table(
        "RiskScenario",
        sa.Column("scenarioid", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("userid", sa.Integer, sa.ForeignKey("UserProfile.id"), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False, default=now),
        sa.Column("updated_at", sa.DateTime, nullable=False, default=now),
    )
    op.create_table(
        "RiskScenarioAccountGroup",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column(
            "scenarioid",
            sa.Integer,
            sa.ForeignKey("RiskScenario.scenarioid", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "accountgroupid",
            sa.Integer,
            sa.ForeignKey("AccountGroup.accountgroupid", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("sortorder", sa.Integer, nullable=False, default=0),
        sa.Column("created_at", sa.DateTime, nullable=False, default=now),
        sa.Column("updated_at", sa.DateTime, nullable=False, default=now),
    )


def downgrade() -> None:
    op.drop_table("RiskScenarioAccountGroup")
    op.drop_table("RiskScenario")
