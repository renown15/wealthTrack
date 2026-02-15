"""Create AccountGroup and AccountGroupMember tables.

Revision ID: 018
Revises: 017
Create Date: 2026-02-14 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "018"
down_revision: Union[str, None] = "017"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create AccountGroup and AccountGroupMember tables."""
    op.create_table(
        "AccountGroup",
        sa.Column("accountgroupid", sa.Integer(), nullable=False),
        sa.Column("userid", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["userid"], ["UserProfile.id"], ),
        sa.PrimaryKeyConstraint("accountgroupid"),
        sa.Index("ix_AccountGroup_accountgroupid", "accountgroupid"),
        sa.Index("ix_AccountGroup_userid", "userid"),
    )
    op.create_table(
        "AccountGroupMember",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("accountgroupid", sa.Integer(), nullable=False),
        sa.Column("accountid", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["accountgroupid"], ["AccountGroup.accountgroupid"], ),
        sa.ForeignKeyConstraint(["accountid"], ["Account.id"], ),
        sa.PrimaryKeyConstraint("id"),
        sa.Index("ix_AccountGroupMember_id", "id"),
        sa.Index("ix_AccountGroupMember_accountgroupid", "accountgroupid"),
        sa.Index("ix_AccountGroupMember_accountid", "accountid"),
    )


def downgrade() -> None:
    """Drop AccountGroupMember and AccountGroup tables."""
    op.drop_table("AccountGroupMember")
    op.drop_table("AccountGroup")
