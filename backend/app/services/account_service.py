"""
Service for account business logic and mutations.
"""
from typing import Any

from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account_attribute import AccountAttribute
from app.models.account_document import AccountDocument
from app.models.account_event import AccountEvent
from app.models.account_event_attribute_group import AccountEventAttributeGroup
from app.models.account_event_attribute_group_member import AccountEventAttributeGroupMember
from app.models.account_group_member import AccountGroupMember
from app.models.tax_document import TaxDocument
from app.models.tax_return import TaxReturn
from app.repositories.account_repository import AccountRepository
from app.repositories.family_repository import FamilyRepository


class AccountService:
    """Handles all account write operations and business logic."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize with database session."""
        self.session = session
        self.repository = AccountRepository(session)

    async def update(self, account_id: int, user_id: int, **kwargs: Any) -> bool:
        """Update account details. Returns True if successful."""
        account = await self.repository.get_by_id(account_id, user_id)
        if not account:
            raise ValueError(f"Account {account_id} not found")

        # Explicit allowlist — fields NOT listed here are silently ignored even if passed.
        # Add new updatable Account columns here or the update appears to succeed but does nothing.
        allowed_fields = {"name", "institution_id", "type_id", "status_id"}
        for key, value in kwargs.items():
            if key in allowed_fields and value is not None:
                setattr(account, key, value)

        self.session.add(account)
        await self.session.flush()
        return True

    async def delete(self, account_id: int, user_id: int) -> bool:
        """Delete account and cascade delete related records. Returns True if successful."""
        account = await self.repository.get_by_id(account_id, user_id)
        if not account:
            raise ValueError(f"Account {account_id} not found")

        # Event-group members referencing this account's events/attributes
        # (dividends, gifts, share sales, actual costs) block those deletes.
        event_ids = select(AccountEvent.id).where(AccountEvent.account_id == account_id)
        attr_ids = select(AccountAttribute.id).where(AccountAttribute.account_id == account_id)
        member = AccountEventAttributeGroupMember
        await self.session.execute(delete(member).where(member.account_event_id.in_(event_ids)))
        await self.session.execute(
            delete(member).where(member.account_attribute_id.in_(attr_ids))
        )
        # Drop the user's groups left with no members. Groups spanning other
        # accounts (e.g. share sales touching a Tax Liability account) survive.
        remaining_group_ids = select(member.group_id)
        await self.session.execute(
            delete(AccountEventAttributeGroup).where(
                AccountEventAttributeGroup.user_id == user_id,
                AccountEventAttributeGroup.id.not_in(remaining_group_ids),
            )
        )

        # Tax records chain: documents hang off the account's tax returns.
        tax_return_ids = select(TaxReturn.id).where(TaxReturn.account_id == account_id)
        await self.session.execute(
            delete(TaxDocument).where(TaxDocument.tax_return_id.in_(tax_return_ids))
        )
        await self.session.execute(delete(TaxReturn).where(TaxReturn.account_id == account_id))

        await self.session.execute(
            delete(AccountDocument).where(AccountDocument.account_id == account_id)
        )
        await self.session.execute(
            delete(AccountGroupMember).where(AccountGroupMember.account_id == account_id)
        )
        await self.session.execute(
            delete(AccountAttribute).where(AccountAttribute.account_id == account_id)
        )
        await self.session.execute(
            delete(AccountEvent).where(AccountEvent.account_id == account_id)
        )

        # Now delete the account itself
        await self.session.delete(account)
        await self.session.flush()
        return True

    async def transfer(self, account_id: int, current_user_id: int, target_user_id: int) -> None:
        """Transfer account ownership to a family member. Raises on validation failure."""
        account = await self.repository.get_by_id(account_id, current_user_id)
        if not account:
            raise ValueError("Account not found")
        member_ids = await FamilyRepository(self.session).get_member_ids_for_user(current_user_id)
        if target_user_id not in member_ids:
            raise PermissionError("Target user is not a family member")
        account.user_id = target_user_id
        await self.session.execute(
            update(AccountEvent).where(AccountEvent.account_id == account_id)
            .values(user_id=target_user_id)
        )
        await self.session.execute(
            update(AccountAttribute).where(AccountAttribute.account_id == account_id)
            .values(user_id=target_user_id)
        )
        await self.session.execute(
            update(AccountDocument).where(AccountDocument.account_id == account_id)
            .values(user_id=target_user_id)
        )
        await self.session.execute(
            delete(AccountGroupMember).where(AccountGroupMember.account_id == account_id)
        )
        await self.session.flush()
