"""Add scope_status_id and note columns to TaxReturn.

Allows a tax return to carry an explicit scope override (FK to a
``tax_scope_status`` ReferenceData row, e.g. "Out of Scope") and a
free-text note rendered in the tax briefing extract.

Revision ID: 050
Revises: 049
"""
import sqlalchemy as sa
from alembic import op

revision = "050"
down_revision = "049"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "TaxReturn",
        sa.Column(
            "scopestatusid",
            sa.Integer,
            sa.ForeignKey("ReferenceData.id"),
            nullable=True,
        ),
    )
    op.add_column("TaxReturn", sa.Column("note", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("TaxReturn", "note")
    op.drop_column("TaxReturn", "scopestatusid")
