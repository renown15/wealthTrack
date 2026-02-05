"""Drop User table and consolidate into UserProfile

Revision ID: 005
Revises: 004
Create Date: 2026-02-05 12:45:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Consolidate User table into UserProfile, using email as the userid identifier."""
    
    # Rename emailaddress to email (using the existing unique column)
    op.alter_column("UserProfile", "emailaddress", new_column_name="email")
    
    # Add additional fields from User table to UserProfile
    op.add_column("UserProfile", sa.Column("is_active", sa.Boolean(), nullable=True, default=True))
    op.add_column("UserProfile", sa.Column("is_verified", sa.Boolean(), nullable=True, default=False))
    
    # Copy data from User to UserProfile
    op.execute("""
        UPDATE "UserProfile" up
        SET 
            is_active = u.is_active,
            is_verified = u.is_verified
        FROM "User" u
        WHERE up.id = u.id
    """)
    
    # Make the new columns NOT NULL
    op.alter_column("UserProfile", "is_active", nullable=False, existing_type=sa.Boolean())
    op.alter_column("UserProfile", "is_verified", nullable=False, existing_type=sa.Boolean())
    
    # Drop the User table
    op.drop_table("User")


def downgrade() -> None:
    """Recreate User table and revert UserProfile changes."""
    
    # Recreate User table
    op.create_table(
        "User",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_verified", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.Index("ix_User_email", "email"),
        sa.Index("ix_User_id", "id"),
        sa.Index("ix_User_username", "username"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
    )
    
    # Copy data back from UserProfile to User
    op.execute("""
        INSERT INTO "User" (id, email, username, hashed_password, full_name, is_active, is_verified, created_at, updated_at)
        SELECT id, email, SUBSTRING(LOWER(firstname) FROM 1 FOR 1) || SUBSTRING(LOWER(surname) FROM 1 FOR 1), password, CONCAT(firstname, ' ', surname), is_active, is_verified, created_at, updated_at
        FROM "UserProfile"
    """)
    
    # Remove the new columns from UserProfile
    op.drop_column("UserProfile", "is_active")
    op.drop_column("UserProfile", "is_verified")
    
    # Rename email back to emailaddress
    op.alter_column("UserProfile", "email", new_column_name="emailaddress")
