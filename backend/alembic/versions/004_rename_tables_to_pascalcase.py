"""Rename all tables to match spec (PascalCase) and fix ReferenceData columns

Revision ID: 004
Revises: 003
Create Date: 2026-02-05 12:30:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Rename all tables to PascalCase to match spec."""

    # Drop all foreign keys first
    op.drop_constraint("user_profile_typeid_fkey", "user_profile", type_="foreignkey")
    op.drop_constraint("accounts_typeid_fkey", "accounts", type_="foreignkey")
    op.drop_constraint("accounts_statusid_fkey", "accounts", type_="foreignkey")
    op.drop_constraint("accounts_institutionid_fkey", "accounts", type_="foreignkey")
    op.drop_constraint("accounts_userid_fkey", "accounts", type_="foreignkey")
    op.drop_constraint("institutions_userid_fkey", "institutions", type_="foreignkey")
    op.drop_constraint("institution_security_credentials_typeid_fkey", "institution_security_credentials", type_="foreignkey")
    op.drop_constraint("institution_security_credentials_institutionid_fkey", "institution_security_credentials", type_="foreignkey")
    op.drop_constraint("institution_security_credentials_userid_fkey", "institution_security_credentials", type_="foreignkey")
    op.drop_constraint("account_attributes_typeid_fkey", "account_attributes", type_="foreignkey")
    op.drop_constraint("account_attributes_accountid_fkey", "account_attributes", type_="foreignkey")
    op.drop_constraint("account_attributes_userid_fkey", "account_attributes", type_="foreignkey")
    op.drop_constraint("account_events_typeid_fkey", "account_events", type_="foreignkey")
    op.drop_constraint("account_events_accountid_fkey", "account_events", type_="foreignkey")
    op.drop_constraint("account_events_userid_fkey", "account_events", type_="foreignkey")

    # Step 1: Rename reference_data to ReferenceData and fix columns
    # First, create new ReferenceData table with correct schema
    op.create_table(
        "ReferenceData",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("classkey", sa.String(length=100), nullable=False),
        sa.Column("referencevalue", sa.String(length=255), nullable=False),
        sa.Column("sortindex", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.Index("ix_ReferenceData_classkey", "classkey"),
        sa.Index("ix_ReferenceData_id", "id"),
    )

    # Copy data from old reference_data to ReferenceData
    # Combine class and key into classkey (e.g., "account_type:SAVINGS")
    op.execute("""
        INSERT INTO "ReferenceData" (id, classkey, referencevalue, sortindex, created_at, updated_at)
        SELECT id,
               CONCAT(class, ':', key) as classkey,
               referencevalue,
               sortindex,
               created_at,
               updated_at
        FROM reference_data
    """)

    # Drop old reference_data table
    op.drop_table("reference_data")

    # Reset sequence so subsequent INSERT without explicit id uses the correct next value
    op.execute(
        "SELECT setval("
        "pg_get_serial_sequence('\"ReferenceData\"', 'id'), "
        "(SELECT MAX(id) FROM \"ReferenceData\")"
        ")"
    )

    # Step 2: Rename all other tables
    op.rename_table("user_profile", "UserProfile")
    op.rename_table("users", "User")
    op.rename_table("accounts", "Account")
    op.rename_table("institutions", "Institution")
    op.rename_table("account_attributes", "AccountAttribute")
    op.rename_table("account_events", "AccountEvent")
    op.rename_table("institution_security_credentials", "InstitutionSecurityCredentials")

    # Recreate all foreign keys with new table names
    op.create_foreign_key("UserProfile_typeid_fkey", "UserProfile", "ReferenceData", ["typeid"], ["id"])
    op.create_foreign_key("Account_typeid_fkey", "Account", "ReferenceData", ["typeid"], ["id"])
    op.create_foreign_key("Account_statusid_fkey", "Account", "ReferenceData", ["statusid"], ["id"])
    op.create_foreign_key("Account_institutionid_fkey", "Account", "Institution", ["institutionid"], ["id"])
    op.create_foreign_key("Account_userid_fkey", "Account", "UserProfile", ["userid"], ["id"])
    op.create_foreign_key("Institution_userid_fkey", "Institution", "UserProfile", ["userid"], ["id"])
    op.create_foreign_key("InstitutionSecurityCredentials_typeid_fkey", "InstitutionSecurityCredentials", "ReferenceData", ["typeid"], ["id"])
    op.create_foreign_key("InstitutionSecurityCredentials_institutionid_fkey", "InstitutionSecurityCredentials", "Institution", ["institutionid"], ["id"])
    op.create_foreign_key("InstitutionSecurityCredentials_userid_fkey", "InstitutionSecurityCredentials", "UserProfile", ["userid"], ["id"])
    op.create_foreign_key("AccountAttribute_typeid_fkey", "AccountAttribute", "ReferenceData", ["typeid"], ["id"])
    op.create_foreign_key("AccountAttribute_accountid_fkey", "AccountAttribute", "Account", ["accountid"], ["id"])
    op.create_foreign_key("AccountAttribute_userid_fkey", "AccountAttribute", "UserProfile", ["userid"], ["id"])
    op.create_foreign_key("AccountEvent_typeid_fkey", "AccountEvent", "ReferenceData", ["typeid"], ["id"])
    op.create_foreign_key("AccountEvent_accountid_fkey", "AccountEvent", "Account", ["accountid"], ["id"])
    op.create_foreign_key("AccountEvent_userid_fkey", "AccountEvent", "UserProfile", ["userid"], ["id"])


def downgrade() -> None:
    """Revert table names to snake_case."""

    # Rename tables back to snake_case
    op.rename_table("InstitutionSecurityCredentials", "institution_security_credentials")
    op.rename_table("AccountEvent", "account_events")
    op.rename_table("AccountAttribute", "account_attributes")
    op.rename_table("Institution", "institutions")
    op.rename_table("Account", "accounts")
    op.rename_table("User", "users")
    op.rename_table("UserProfile", "user_profile")

    # Recreate old reference_data table
    op.create_table(
        "reference_data",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("class", sa.String(length=50), nullable=False),
        sa.Column("key", sa.String(length=50), nullable=False),
        sa.Column("referencevalue", sa.String(length=255), nullable=False),
        sa.Column("sortindex", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.Index("ix_reference_data_class_key", "class", "key"),
        sa.Index("ix_reference_data_class", "class"),
        sa.Index("ix_reference_data_id", "id"),
    )

    # Copy data back, splitting classkey back into class and key
    op.execute("""
        INSERT INTO reference_data (id, class, key, referencevalue, sortindex, created_at, updated_at)
        SELECT id,
               SPLIT_PART(classkey, ':', 1) as class,
               SPLIT_PART(classkey, ':', 2) as key,
               referencevalue,
               sortindex,
               created_at,
               updated_at
        FROM "ReferenceData"
    """)

    # Drop ReferenceData table
    op.drop_table("ReferenceData")
