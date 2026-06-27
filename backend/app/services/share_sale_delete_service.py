"""Service for reversing (deleting) a recorded share sale.

A share sale is stored as one "Share Sale" event group spanning three
accounts. Reversing it mirrors the gift-deletion pattern: delete the group's
membership rows and event rows, and restore the ``number_of_shares`` attribute
(which the create path overwrote in place). Each account's balance reverts
automatically because the sale's ``Balance Update`` event — the latest for that
account — is removed, exposing the prior balance.
"""
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account_event import AccountEvent
from app.models.account_event_attribute_group import AccountEventAttributeGroup
from app.models.account_event_attribute_group_member import (
    AccountEventAttributeGroupMember,
)
from app.models.reference_data import ReferenceData
from app.repositories.account_attribute_repository import AccountAttributeRepository


async def delete_share_sale(group_id: int, user_id: int, session: AsyncSession) -> None:
    """Reverse a share sale group: restore the share count and delete its records."""
    group = await session.get(AccountEventAttributeGroup, group_id)
    if not group or group.user_id != user_id:
        raise ValueError("Share sale not found")

    members = (
        await session.execute(
            select(AccountEventAttributeGroupMember).where(
                AccountEventAttributeGroupMember.group_id == group_id
            )
        )
    ).scalars().all()

    events: list[AccountEvent] = []
    shares_sold: Optional[str] = None
    shares_account_id: Optional[int] = None
    for member in members:
        if not member.account_event_id:
            continue
        event = await session.get(AccountEvent, member.account_event_id)
        if not event:
            continue
        events.append(event)
        ref = await session.get(ReferenceData, event.type_id)
        if ref and ref.reference_value == "Share Sale":
            shares_sold = event.value
            shares_account_id = event.account_id

    if shares_sold is None or shares_account_id is None:
        raise ValueError("Corrupt share sale group: missing Share Sale event")

    # The create path set number_of_shares to the post-sale remainder; add back.
    attr_repo = AccountAttributeRepository(session)
    current = Decimal(
        await attr_repo.get_attribute_by_name(shares_account_id, user_id, "number_of_shares")
        or "0"
    )
    restored = (current + Decimal(shares_sold)).quantize(
        Decimal("0.0001"), rounding=ROUND_HALF_UP
    )
    await attr_repo.set_attribute_by_name(
        shares_account_id, user_id, "number_of_shares", str(restored)
    )

    for member in members:
        await session.delete(member)
    await session.flush()  # members must be gone before events (FK constraint)
    for event in events:
        await session.delete(event)
    await session.delete(group)
