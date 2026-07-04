"""Reclassify outgoing types under their own class keys; add School / School Fees / Mobile phone.

Moves outgoing account/institution types out of the generic 'account_type' /
'institution_type' classes into 'outgoing_account_type' /
'outgoing_institution_type' so the Outgoings-vs-wealth split is derived from the
DB. Reclassification is an in-place UPDATE (ids/FKs preserved).

Revision ID: 059
Revises: 058
"""
from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = '059'
down_revision: Union[str, None] = '058'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_reference_data_table = sa.table(
    "ReferenceData",
    sa.column("classkey", sa.String),
    sa.column("referencevalue", sa.String),
    sa.column("sortindex", sa.Integer),
    sa.column("created_at", sa.DateTime),
    sa.column("updated_at", sa.DateTime),
)

_OUTGOING_ACCOUNT_TYPES = [
    "Utility - Gas", "Utility - Electric", "Utility - Water", "Utility - Broadband",
    "Insurance - Home", "Insurance - Car", "Insurance - Life", "Insurance - Health",
    "Insurance - Income Protection", "Subscription", "Household", "Membership", "Tax",
]
_OUTGOING_INSTITUTION_TYPES = [
    "Utility Provider", "Insurer", "Subscription Service", "Household", "Memberships",
]
# New rows added in this migration (class_key, reference_value, sort_index)
_NEW_ROWS = [
    ("outgoing_account_type", "School Fees", 63),
    ("outgoing_account_type", "Mobile phone", 64),
    ("outgoing_institution_type", "School", 12),
]


def _reclassify(bind: sa.engine.Connection, old_class: str, new_class: str,
                values: list[str]) -> None:
    bind.execute(
        sa.text(
            "UPDATE \"ReferenceData\" SET classkey = :new "
            "WHERE classkey = :old AND referencevalue = ANY(:vals)"
        ),
        {"new": new_class, "old": old_class, "vals": values},
    )


def upgrade() -> None:
    bind = op.get_bind()
    _reclassify(bind, "account_type", "outgoing_account_type", _OUTGOING_ACCOUNT_TYPES)
    _reclassify(bind, "institution_type", "outgoing_institution_type",
                _OUTGOING_INSTITUTION_TYPES)
    now = datetime.utcnow()
    to_insert = []
    for class_key, value, sort_index in _NEW_ROWS:
        existing = bind.execute(
            sa.text(
                "SELECT 1 FROM \"ReferenceData\" "
                "WHERE classkey = :ck AND referencevalue = :rv LIMIT 1"
            ),
            {"ck": class_key, "rv": value},
        ).first()
        if not existing:
            to_insert.append({
                "classkey": class_key, "referencevalue": value, "sortindex": sort_index,
                "created_at": now, "updated_at": now,
            })
    if to_insert:
        op.bulk_insert(_reference_data_table, to_insert)


def downgrade() -> None:
    bind = op.get_bind()
    bind.execute(
        sa.text(
            "DELETE FROM \"ReferenceData\" WHERE "
            "(classkey = 'outgoing_account_type' AND referencevalue IN ('School Fees', 'Mobile phone')) "
            "OR (classkey = 'outgoing_institution_type' AND referencevalue = 'School')"
        )
    )
    _reclassify(bind, "outgoing_account_type", "account_type", _OUTGOING_ACCOUNT_TYPES)
    _reclassify(bind, "outgoing_institution_type", "institution_type",
                _OUTGOING_INSTITUTION_TYPES)
