"""Create reference_data and user_profile tables.

Revision ID: 001
Revises: 
Create Date: 2026-02-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create reference_data and user_profile tables."""
    # Create reference_data table
    op.create_table(
        "reference_data",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("class", sa.String(length=50), nullable=False),
        sa.Column("key", sa.String(length=50), nullable=False),
        sa.Column("referencevalue", sa.String(length=255), nullable=False),
        sa.Column("sortindex", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.Index("ix_reference_data_class_key", "class", "key"),
        sa.Index("ix_reference_data_class", "class"),
        sa.Index("ix_reference_data_id", "id"),
    )

    # Create user_profile table
    op.create_table(
        "user_profile",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("firstname", sa.String(length=100), nullable=False),
        sa.Column("surname", sa.String(length=100), nullable=False),
        sa.Column("emailaddress", sa.String(length=255), nullable=False),
        sa.Column("profile", sa.JSON(), nullable=True),
        sa.Column("typeid", sa.Integer(), nullable=False),
        sa.Column("password", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["typeid"], ["reference_data.id"], ),
        sa.PrimaryKeyConstraint("id"),
        sa.Index("ix_user_profile_emailaddress", "emailaddress"),
        sa.Index("ix_user_profile_id", "id"),
        sa.UniqueConstraint("emailaddress"),
    )

    # Create users table (for legacy auth support)
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_verified", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.Index("ix_users_email", "email"),
        sa.Index("ix_users_id", "id"),
        sa.Index("ix_users_username", "username"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
    )


def downgrade() -> None:
    """Drop all created tables."""
    op.drop_table("users")
    op.drop_table("user_profile")
    op.drop_table("reference_data")
