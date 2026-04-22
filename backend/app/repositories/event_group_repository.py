"""
Repository for AccountEventAttributeGroup — creating and querying event groups.
"""
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account_attribute import AccountAttribute
from app.models.account_event import AccountEvent
from app.models.account_event_attribute_group import AccountEventAttributeGroup
from app.models.account_event_attribute_group_member import AccountEventAttributeGroupMember
from app.models.reference_data import ReferenceData


class EventGroupRepository:
    """Handles creation and retrieval of AccountEventAttributeGroups."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialise with database session."""
        self.session = session

    async def get_group_type_id(self, group_type: str) -> Optional[int]:
        """Look up ReferenceData id for a group type label."""
        stmt = select(ReferenceData.id).where(
            ReferenceData.class_key == "event_group_type",
            ReferenceData.reference_value == group_type,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_group(self, user_id: int, group_type: str) -> AccountEventAttributeGroup:
        """Create a new event group of the given type."""
        type_id = await self.get_group_type_id(group_type)
        if not type_id:
            raise ValueError(f"Unknown event group type: {group_type!r}")
        group = AccountEventAttributeGroup()
        group.user_id = user_id
        group.type_id = type_id
        self.session.add(group)
        await self.session.flush()
        await self.session.refresh(group)
        return group

    async def add_event_member(
        self, group_id: int, account_event_id: int
    ) -> AccountEventAttributeGroupMember:
        """Add an AccountEvent to the group."""
        member = AccountEventAttributeGroupMember()
        member.group_id = group_id
        member.account_event_id = account_event_id
        member.account_attribute_id = None
        self.session.add(member)
        await self.session.flush()
        return member

    async def add_attribute_member(
        self, group_id: int, account_attribute_id: int
    ) -> AccountEventAttributeGroupMember:
        """Add an AccountAttribute to the group."""
        member = AccountEventAttributeGroupMember()
        member.group_id = group_id
        member.account_event_id = None
        member.account_attribute_id = account_attribute_id
        self.session.add(member)
        await self.session.flush()
        return member

    async def get_groups_for_account(
        self, account_id: int, user_id: int, group_type: str
    ) -> list[dict[str, Any]]:
        """Return all groups of a given type that contain events for the given account.

        Returns each group with its member events and attributes hydrated.
        """
        type_id = await self.get_group_type_id(group_type)
        if not type_id:
            return []

        # Find all group IDs that have at least one event on this account
        event_group_id_stmt = (
            select(AccountEventAttributeGroupMember.group_id)
            .join(
                AccountEvent, AccountEvent.id == AccountEventAttributeGroupMember.account_event_id
            )
            .where(AccountEvent.account_id == account_id)
            .where(AccountEvent.user_id == user_id)
            .distinct()
        )
        result = await self.session.execute(event_group_id_stmt)
        group_ids = [row[0] for row in result.all()]

        if not group_ids:
            return []

        # Fetch groups filtered to the right type
        groups_stmt = (
            select(AccountEventAttributeGroup)
            .where(AccountEventAttributeGroup.id.in_(group_ids))
            .where(AccountEventAttributeGroup.type_id == type_id)
            .where(AccountEventAttributeGroup.user_id == user_id)
            .order_by(AccountEventAttributeGroup.created_at.desc())
        )
        groups_result = await self.session.execute(groups_stmt)
        groups = groups_result.scalars().all()

        output = []
        for group in groups:
            members_stmt = select(AccountEventAttributeGroupMember).where(
                AccountEventAttributeGroupMember.group_id == group.id
            )
            members_result = await self.session.execute(members_stmt)
            members = members_result.scalars().all()

            events: list[dict[str, Any]] = []
            attributes: list[dict[str, Any]] = []

            for member in members:
                if member.account_event_id:
                    ev_stmt = (
                        select(AccountEvent, ReferenceData.reference_value)
                        .join(ReferenceData, ReferenceData.id == AccountEvent.type_id)
                        .where(AccountEvent.id == member.account_event_id)
                    )
                    ev_result = await self.session.execute(ev_stmt)
                    row = ev_result.one_or_none()
                    if row:
                        ev, ev_type = row
                        events.append(
                            {
                                "id": ev.id,
                                "account_id": ev.account_id,
                                "event_type": ev_type,
                                "value": ev.value,
                                "created_at": ev.created_at,
                            }
                        )
                elif member.account_attribute_id:
                    at_stmt = (
                        select(AccountAttribute, ReferenceData.reference_value)
                        .join(ReferenceData, ReferenceData.id == AccountAttribute.type_id)
                        .where(AccountAttribute.id == member.account_attribute_id)
                    )
                    at_result = await self.session.execute(at_stmt)
                    at_row = at_result.one_or_none()
                    if at_row:
                        attr, attr_type = at_row
                        attributes.append(
                            {
                                "id": attr.id,
                                "account_id": attr.account_id,
                                "attribute_type": attr_type,
                                "value": attr.value,
                            }
                        )

            output.append(
                {
                    "group_id": group.id,
                    "created_at": group.created_at,
                    "events": events,
                    "attributes": attributes,
                }
            )

        return output
