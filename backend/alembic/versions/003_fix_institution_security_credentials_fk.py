"""Fix institution_security_credentials to reference user_profile instead of users

Revision ID: 003
Revises: de3af94e70a5
Create Date: 2026-02-05 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: Union[str, None] = "de3af94e70a5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Fix the FK constraint to use user_profile instead of users."""
    # Drop the incorrect foreign key constraint
    op.drop_constraint(
        "institution_security_credentials_userid_fkey",
        "institution_security_credentials",
        type_="foreignkey"
    )

    # Create the correct foreign key constraint to user_profile
    op.create_foreign_key(
        "institution_security_credentials_userid_fkey",
        "institution_security_credentials",
        "user_profile",
        ["userid"],
        ["id"]
    )


def downgrade() -> None:
    """Revert to the old (incorrect) FK constraint."""
    # Drop the correct foreign key
    op.drop_constraint(
        "institution_security_credentials_userid_fkey",
        "institution_security_credentials",
        type_="foreignkey"
    )

    # Recreate the old (incorrect) foreign key
    op.create_foreign_key(
        "institution_security_credentials_userid_fkey",
        "institution_security_credentials",
        "users",
        ["userid"],
        ["id"]
    )
