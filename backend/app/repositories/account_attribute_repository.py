"""
Repository for account attribute operations.
"""
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account_attribute import AccountAttribute
from app.models.reference_data import ReferenceData


class AccountAttributeRepository:
    """Handles CRUD operations for account attributes."""

    def __init__(self, session: AsyncSession):
        """Initialize repository with an async session."""
        self.session = session

    async def get_attribute_type_id(self, attribute_type: str) -> int | None:
        """Look up the reference data ID for an attribute type.

        Accepts either the full reference_value (e.g., "Account Opened Date")
        or a shorthand (e.g., "opened_date") which maps to the full value.
        """
        # Map shorthand attribute types to their full reference values
        attribute_type_map = {
            "opened_date": "Account Opened Date",
            "closed_date": "Account Closed Date",
            "account_number": "Account Number",
            "sort_code": "Sort Code",
            "roll_ref_number": "Roll / Ref Number",
            "interest_rate": "Interest Rate",
            "fixed_bonus_rate": "Fixed Bonus Rate",
            "fixed_bonus_rate_end_date": "Fixed Bonus Rate End Date",
            "release_date": "Release Date",
            "number_of_shares": "Number of Shares",
            "underlying": "Underlying",
            "price": "Price",
            "purchase_price": "Purchase Price",
            "iban": "IBAN",
            "notes": "Notes",
            "deferred_shares_balance": "Deferred Shares Balance",
            "deferred_cash_balance": "Deferred Cash Balance",
            "rsu_balance": "RSU Balance",
            "pension_monthly_payment": "Pension Monthly Payment",
            "asset_class": "Asset Class",
        }
        lookup_value = attribute_type_map.get(attribute_type.lower(), attribute_type)

        stmt = select(ReferenceData.id).where(
            ReferenceData.class_key == "account_attribute_type",
            ReferenceData.reference_value == lookup_value,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_attribute(
        self, account_id: int, user_id: int, type_id: int
    ) -> Optional[AccountAttribute]:
        """Get a specific attribute for an account."""
        stmt = select(AccountAttribute).where(
            AccountAttribute.account_id == account_id,
            AccountAttribute.user_id == user_id,
            AccountAttribute.type_id == type_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_attribute_by_name(
        self, account_id: int, user_id: int, attribute_type: str
    ) -> Optional[str]:
        """Get attribute value by type name."""
        type_id = await self.get_attribute_type_id(attribute_type)
        if not type_id:
            return None
        attr = await self.get_attribute(account_id, user_id, type_id)
        return attr.value if attr else None

    async def set_attribute(
        self, account_id: int, user_id: int, type_id: int, value: str
    ) -> AccountAttribute:
        """Set an attribute value (upsert)."""
        existing = await self.get_attribute(account_id, user_id, type_id)

        if existing:
            existing.value = value
            await self.session.flush()
            await self.session.refresh(existing)
            return existing

        attr = AccountAttribute()
        attr.account_id = account_id
        attr.user_id = user_id
        attr.type_id = type_id
        attr.value = value
        self.session.add(attr)
        await self.session.flush()
        await self.session.refresh(attr)
        return attr

    async def set_attribute_by_name(
        self, account_id: int, user_id: int, attribute_type: str, value: str
    ) -> Optional[AccountAttribute]:
        """Set attribute value by type name."""
        type_id = await self.get_attribute_type_id(attribute_type)
        if not type_id:
            return None
        return await self.set_attribute(account_id, user_id, type_id, value)

    async def delete_attribute(
        self, account_id: int, user_id: int, type_id: int
    ) -> bool:
        """Delete an attribute."""
        existing = await self.get_attribute(account_id, user_id, type_id)
        if existing:
            await self.session.delete(existing)
            await self.session.flush()
            return True
        return False

    async def delete_attribute_by_name(
        self, account_id: int, user_id: int, attribute_type: str
    ) -> bool:
        """Delete attribute by type name."""
        type_id = await self.get_attribute_type_id(attribute_type)
        if not type_id:
            return False
        return await self.delete_attribute(account_id, user_id, type_id)

    async def get_all_attributes_for_accounts(
        self, account_ids: list[int], user_id: int
    ) -> dict[int, dict[str, str]]:
        """Batch-fetch all attributes for multiple accounts in one query.

        Returns dict[account_id, dict[reference_value_label, attribute_value]].
        """
        if not account_ids:
            return {}
        stmt = (
            select(
                AccountAttribute.account_id,
                ReferenceData.reference_value,
                AccountAttribute.value,
            )
            .join(ReferenceData, ReferenceData.id == AccountAttribute.type_id)
            .where(AccountAttribute.account_id.in_(account_ids))
            .where(AccountAttribute.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        attrs: dict[int, dict[str, str]] = {}
        for account_id, type_label, value in result.all():
            if account_id not in attrs:
                attrs[account_id] = {}
            attrs[account_id][type_label] = value
        return attrs

    async def get_all_attributes(
        self, account_id: int, user_id: int
    ) -> list[dict[str, Any]]:
        """Get all attributes for an account with their type labels."""
        stmt = (
            select(AccountAttribute, ReferenceData.reference_value)
            .join(ReferenceData, ReferenceData.id == AccountAttribute.type_id)
            .where(AccountAttribute.account_id == account_id)
            .where(AccountAttribute.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        attributes: list[dict[str, Any]] = []
        for attr, type_label in result.all():
            attributes.append({
                "id": attr.id,
                "account_id": attr.account_id,
                "type_id": attr.type_id,
                "type_label": type_label,
                "value": attr.value,
                "created_at": attr.created_at,
                "updated_at": attr.updated_at,
            })
        return attributes

    async def get_dates_for_account(
        self, account_id: int, user_id: int
    ) -> dict[str, Optional[str]]:
        """Get opened and closed dates for an account."""
        opened = await self.get_attribute_by_name(account_id, user_id, "opened_date")
        closed = await self.get_attribute_by_name(account_id, user_id, "closed_date")
        return {
            "openedAt": opened,
            "closedAt": closed,
        }

    async def get_banking_details_for_account(
        self, account_id: int, user_id: int
    ) -> dict[str, Optional[str]]:
        """Get banking details (account number, sort code, and roll/ref number) for an account."""
        account_number = await self.get_attribute_by_name(account_id, user_id, "account_number")
        sort_code = await self.get_attribute_by_name(account_id, user_id, "sort_code")
        roll_ref = await self.get_attribute_by_name(account_id, user_id, "roll_ref_number")
        return {
            "accountNumber": account_number,
            "sortCode": sort_code,
            "rollRefNumber": roll_ref,
        }
