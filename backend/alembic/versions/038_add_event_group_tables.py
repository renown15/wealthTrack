"""Add AccountEventAttributeGroup and AccountEventAttributeGroupMember tables.

Creates a generic ledger for grouping related events and attributes into named
transactions (e.g. a share sale touching 3 accounts). Seeds event_group_type
ReferenceData for 'Share Sale'.

Revision ID: 038
Revises: 037
Create Date: 2026-04-11
"""
from datetime import datetime

import sqlalchemy as sa

from alembic import op

revision = "038"
down_revision = "037"
branch_labels = None
depends_on = None

_reference_data_table = sa.table(
    "ReferenceData",
    sa.column("classkey", sa.String),
    sa.column("referencevalue", sa.String),
    sa.column("sortindex", sa.Integer),
    sa.column("created_at", sa.DateTime),
    sa.column("updated_at", sa.DateTime),
)


def upgrade() -> None:
    now = datetime.utcnow()

    op.create_table(
        "AccountEventAttributeGroup",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("userid", sa.Integer, sa.ForeignKey("UserProfile.id"), nullable=False, index=True),
        sa.Column("typeid", sa.Integer, sa.ForeignKey("ReferenceData.id"), nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False, default=now),
        sa.Column("updated_at", sa.DateTime, nullable=False, default=now),
    )

    op.create_table(
        "AccountEventAttributeGroupMember",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column(
            "groupid",
            sa.Integer,
            sa.ForeignKey("AccountEventAttributeGroup.id"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "account_event_id",
            sa.Integer,
            sa.ForeignKey("AccountEvent.id"),
            nullable=True,
        ),
        sa.Column(
            "account_attribute_id",
            sa.Integer,
            sa.ForeignKey("AccountAttribute.id"),
            nullable=True,
        ),
    )

    op.bulk_insert(
        _reference_data_table,
        [
            {"classkey": "event_group_type", "referencevalue": "Share Sale", "sortindex": 1, "created_at": now, "updated_at": now},
            {"classkey": "account_attribute_type", "referencevalue": "Sale Price Per Share", "sortindex": 16, "created_at": now, "updated_at": now},
            {"classkey": "account_attribute_type", "referencevalue": "Purchase Price Per Share", "sortindex": 17, "created_at": now, "updated_at": now},
            {"classkey": "account_attribute_type", "referencevalue": "Capital Gain", "sortindex": 18, "created_at": now, "updated_at": now},
            {"classkey": "account_attribute_type", "referencevalue": "CGT Rate", "sortindex": 19, "created_at": now, "updated_at": now},
        ],
    )


def downgrade() -> None:
    op.drop_table("AccountEventAttributeGroupMember")
    op.drop_table("AccountEventAttributeGroup")
    for classkey, referencevalue in [
        ("event_group_type", "Share Sale"),
        ("account_attribute_type", "Sale Price Per Share"),
        ("account_attribute_type", "Purchase Price Per Share"),
        ("account_attribute_type", "Capital Gain"),
        ("account_attribute_type", "CGT Rate"),
    ]:
        op.execute(
            f"""
            DELETE FROM "ReferenceData"
            WHERE classkey = '{classkey}'
            AND referencevalue = '{referencevalue}'
            """
        )
