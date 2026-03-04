"""Remove malformed reference data entries with colons in classkey.

These entries were created by migration 004 which incorrectly combined
class and key with a colon (e.g., "account_type:TRUST_STOCKS_INVESTMENT").
The modern format uses only the class_key without colons.

Revision ID: 026
Revises: 025
Create Date: 2026-03-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "026"
down_revision: Union[str, None] = "025"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove all reference data entries with colons in classkey."""
    op.execute(
        'DELETE FROM "ReferenceData" WHERE classkey LIKE \'%:%\''
    )


def downgrade() -> None:
    """No downgrade path - these entries were malformed."""
    pass
