"""Allow hub-level tax documents with no owning tax return.

Library documents (archived past returns for safe storage) set
taxreturnid NULL, which keeps them out of per-account views and
briefing packs.

Revision ID: 062
Revises: 061
"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = '062'
down_revision: Union[str, None] = '061'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "TaxDocument", "taxreturnid", existing_type=sa.Integer(), nullable=True
    )


def downgrade() -> None:
    # Hub-level documents cannot survive a NOT NULL constraint.
    op.execute(sa.text('DELETE FROM "TaxDocument" WHERE taxreturnid IS NULL'))
    op.alter_column(
        "TaxDocument", "taxreturnid", existing_type=sa.Integer(), nullable=False
    )
