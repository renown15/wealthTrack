"""Add Tax Liability account type, Share Sale & Liability event types, Tax Year attribute type.

Revision ID: 035
Revises: 034
Create Date: 2026-04-09
"""
from alembic import op
from sqlalchemy import text

revision = "035"
down_revision = "034"
branch_labels = None
depends_on = None

_NEW_ITEMS = [
    ("account_type", "Tax Liability", 16),
    ("account_event_type", "Share Sale", 8),
    ("account_event_type", "Liability", 9),
    ("account_attribute_type", "Tax Year", 23),
]


def upgrade() -> None:
    conn = op.get_bind()
    for class_key, reference_value, sort_index in _NEW_ITEMS:
        exists = conn.execute(
            text(
                "SELECT 1 FROM \"ReferenceData\" "
                "WHERE class_key = :ck AND reference_value = :rv"
            ),
            {"ck": class_key, "rv": reference_value},
        ).fetchone()
        if not exists:
            conn.execute(
                text(
                    "INSERT INTO \"ReferenceData\" (class_key, reference_value, sort_index) "
                    "VALUES (:ck, :rv, :si)"
                ),
                {"ck": class_key, "rv": reference_value, "si": sort_index},
            )


def downgrade() -> None:
    conn = op.get_bind()
    for class_key, reference_value, _ in _NEW_ITEMS:
        conn.execute(
            text(
                "DELETE FROM \"ReferenceData\" "
                "WHERE class_key = :ck AND reference_value = :rv"
            ),
            {"ck": class_key, "rv": reference_value},
        )
