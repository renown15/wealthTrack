"""Seed reference data for all lookup types.

Revision ID: 002
Revises: 001
Create Date: 2026-02-04 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Seed reference data for all lookup types."""
    reference_data_table = sa.table(
        "reference_data",
        sa.column("class", sa.String),
        sa.column("key", sa.String),
        sa.column("referencevalue", sa.String),
        sa.column("sortindex", sa.Integer),
        sa.column("created_at", sa.DateTime),
        sa.column("updated_at", sa.DateTime),
    )

    now = datetime.utcnow()

    # Account types
    account_types = [
        ("account_type", "SAVINGS", "Savings Account", 1),
        ("account_type", "CURRENT", "Current Account", 2),
        ("account_type", "CASH_ISA", "Cash ISA", 3),
        ("account_type", "STOCKS_ISA", "Stocks & Shares ISA", 4),
        ("account_type", "LIFETIME_ISA", "Lifetime ISA", 5),
        ("account_type", "SIPP", "Self-Invested Personal Pension", 6),
        ("account_type", "PREMIUM_BONDS", "Premium Bonds", 7),
    ]

    # Account statuses
    account_statuses = [
        ("account_status", "ACTIVE", "Active", 1),
        ("account_status", "CLOSED", "Closed", 2),
        ("account_status", "DORMANT", "Dormant", 3),
        ("account_status", "PENDING", "Pending", 4),
    ]

    # Account event types
    account_event_types = [
        ("account_event_type", "BALANCE_UPDATE", "Balance Update", 1),
        ("account_event_type", "INTEREST", "Interest", 2),
        ("account_event_type", "DIVIDEND", "Dividend", 3),
        ("account_event_type", "DEPOSIT", "Deposit", 4),
        ("account_event_type", "WITHDRAWAL", "Withdrawal", 5),
    ]

    # Credential types
    credential_types = [
        ("credential_type", "USERNAME", "Username", 1),
        ("credential_type", "PASSWORD", "Password", 2),
        ("credential_type", "PIN", "PIN", 3),
        ("credential_type", "SECURITY_QUESTION", "Security Question", 4),
        ("credential_type", "MEMORABLE_WORD", "Memorable Word", 5),
    ]

    # User profile types
    user_profile_types = [
        ("user_profile_type", "STANDARD", "Standard User", 1),
        ("user_profile_type", "ADMIN", "Administrator", 2),
    ]

    # Account attribute types
    account_attribute_types = [
        ("account_attribute_type", "ACCOUNT_NUMBER", "Account Number", 1),
        ("account_attribute_type", "SORT_CODE", "Sort Code", 2),
        ("account_attribute_type", "IBAN", "IBAN", 3),
        ("account_attribute_type", "NOTES", "Notes", 4),
    ]

    # Combine all reference data
    all_reference_data = (
        account_types + account_statuses + account_event_types + 
        credential_types + user_profile_types + account_attribute_types
    )

    # Insert all reference data
    for class_val, key, referencevalue, sortindex in all_reference_data:
        op.execute(
            reference_data_table.insert().values(
                **{
                    "class": class_val,
                    "key": key,
                    "referencevalue": referencevalue,
                    "sortindex": sortindex,
                    "created_at": now,
                    "updated_at": now,
                }
            )
        )


def downgrade() -> None:
    """Remove all seeded reference data."""
    op.execute("DELETE FROM reference_data")
