"""Remove plain ISA account type (covered by Cash ISA and Stocks ISA).

Revision ID: 030
Revises: 029
Create Date: 2026-03-30
"""
from alembic import op

revision = "030"
down_revision = "029"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        DELETE FROM "ReferenceData"
        WHERE classkey = 'account_type'
        AND referencevalue = 'ISA'
        """
    )


def downgrade() -> None:
    op.execute(
        """
        INSERT INTO "ReferenceData" (classkey, referencevalue, sort_index)
        VALUES ('account_type', 'ISA', 9)
        ON CONFLICT DO NOTHING
        """
    )
