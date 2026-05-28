"""Service for recording gifts and calculating IHT taper exposure."""
from datetime import date
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account_event import AccountEvent
from app.models.account_event_attribute_group import AccountEventAttributeGroup
from app.models.account_event_attribute_group_member import AccountEventAttributeGroupMember
from app.models.reference_data import ReferenceData
from app.repositories.account_attribute_repository import AccountAttributeRepository
from app.repositories.account_event_repository import AccountEventRepository
from app.repositories.account_repository import AccountRepository
from app.repositories.event_group_repository import EventGroupRepository
from app.schemas.gift import GiftSummary, RecordGiftResponse
from app.services.gift_summary_builder import build_gift_summary, get_ref_id

_GIFT_INTERNAL_TYPES = {"Gift Date", "Gift Donor", "Gift Shares"}


async def record_gift(
    account_id: int,
    user_id: int,
    donor: str,
    gift_date: date,
    gift_value_gbp: str,
    session: AsyncSession,
    num_shares: Optional[str] = None,
) -> RecordGiftResponse:
    """Record a gift, update account balance, and create the event group."""
    account_repo = AccountRepository(session)
    event_repo = AccountEventRepository(session)
    group_repo = EventGroupRepository(session)

    account = await account_repo.get_by_id(account_id, user_id)
    if not account:
        raise ValueError("Account not found")

    raw_ids = {
        name: await event_repo.get_event_type_id(name)
        for name in ("Gift", "Gift Date", "Gift Donor", "Balance Update")
    }
    if not all(raw_ids.values()):
        raise ValueError("Required event types not found in reference data")
    type_ids: dict[str, int] = raw_ids  # type: ignore[assignment]

    group = await group_repo.create_group(user_id, "Gift")

    for type_name, value in [
        ("Gift", gift_value_gbp),
        ("Gift Date", gift_date.isoformat()),
        ("Gift Donor", donor),
    ]:
        ev = await event_repo.create_event(account_id, user_id, type_ids[type_name], value)
        await group_repo.add_event_member(group.id, ev.id)

    current_balance = Decimal(
        await event_repo.get_latest_balance_update(account_id, user_id) or "0"
    )
    new_balance = (current_balance + Decimal(gift_value_gbp)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    bal_ev = await event_repo.create_event(
        account_id, user_id, type_ids["Balance Update"], str(new_balance)
    )
    await group_repo.add_event_member(group.id, bal_ev.id)

    if num_shares:
        shares_type_id = await event_repo.get_event_type_id("Gift Shares")
        if shares_type_id:
            shares_ev = await event_repo.create_event(
                account_id, user_id, shares_type_id, num_shares
            )
            await group_repo.add_event_member(group.id, shares_ev.id)
        attr_repo = AccountAttributeRepository(session)
        await _increment_share_count(attr_repo, account_id, user_id, num_shares)

    return RecordGiftResponse(
        group_id=group.id,
        account_id=account_id,
        donor=donor,
        gift_date=gift_date,
        gift_value_gbp=gift_value_gbp,
        num_shares=num_shares,
    )


async def get_user_gifts(user_id: int, session: AsyncSession) -> list[GiftSummary]:
    """Return all gifts for the user with current IHT taper calculation."""
    gift_group_type_id = await get_ref_id(session, "event_group_type", "Gift")
    if not gift_group_type_id:
        return []

    groups_stmt = (
        select(AccountEventAttributeGroup)
        .where(AccountEventAttributeGroup.type_id == gift_group_type_id)
        .where(AccountEventAttributeGroup.user_id == user_id)
        .order_by(AccountEventAttributeGroup.created_at.desc())
    )
    groups = (await session.execute(groups_stmt)).scalars().all()
    results: list[GiftSummary] = []
    for group in groups:
        summary = await build_gift_summary(session, group)
        if summary:
            results.append(summary)
    return results


async def delete_gift(
    group_id: int,
    user_id: int,
    session: AsyncSession,
) -> None:
    """Delete a gift group and reverse its balance contribution."""
    group = await session.get(AccountEventAttributeGroup, group_id)
    if not group or group.user_id != user_id:
        raise ValueError("Gift not found")

    members_stmt = select(AccountEventAttributeGroupMember).where(
        AccountEventAttributeGroupMember.group_id == group_id
    )
    members = (await session.execute(members_stmt)).scalars().all()

    gift_value: Optional[str] = None
    num_shares: Optional[str] = None
    account_id: Optional[int] = None
    events: list[AccountEvent] = []

    for m in members:
        if not m.account_event_id:
            continue
        ev = await session.get(AccountEvent, m.account_event_id)
        if not ev:
            continue
        events.append(ev)
        rd = await session.get(ReferenceData, ev.type_id)
        if not rd:
            continue
        match rd.reference_value:
            case "Gift":
                gift_value = ev.value
                account_id = ev.account_id
            case "Gift Shares":
                num_shares = ev.value

    if not gift_value or not account_id:
        raise ValueError("Corrupt gift group: missing Gift event")

    event_repo = AccountEventRepository(session)
    bal_type_id = await event_repo.get_event_type_id("Balance Update")
    if bal_type_id:
        current = Decimal(
            await event_repo.get_latest_balance_update(account_id, user_id) or "0"
        )
        new_bal = (current - Decimal(gift_value)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        await event_repo.create_event(account_id, user_id, bal_type_id, str(new_bal))

    if num_shares:
        attr_repo = AccountAttributeRepository(session)
        current_str = await attr_repo.get_attribute_by_name(
            account_id, user_id, "number_of_shares"
        )
        current_shares = Decimal(current_str or "0")
        new_count = (current_shares - Decimal(num_shares)).quantize(
            Decimal("0.0001"), rounding=ROUND_HALF_UP
        )
        await attr_repo.set_attribute_by_name(
            account_id, user_id, "number_of_shares", str(new_count)
        )

    for m in members:
        await session.delete(m)
    await session.flush()  # members must be gone before events (FK constraint)
    for ev in events:
        await session.delete(ev)
    await session.delete(group)


async def delete_gift_by_event_id(
    event_id: int,
    user_id: int,
    session: AsyncSession,
) -> None:
    """Resolve group from a Gift event ID, then delete the gift."""
    member = (await session.execute(
        select(AccountEventAttributeGroupMember)
        .where(AccountEventAttributeGroupMember.account_event_id == event_id)
    )).scalar_one_or_none()
    if not member:
        raise ValueError("Gift not found")
    await delete_gift(member.group_id, user_id, session)


async def _increment_share_count(
    attr_repo: AccountAttributeRepository,
    account_id: int,
    user_id: int,
    num_shares: str,
) -> None:
    current_str = await attr_repo.get_attribute_by_name(account_id, user_id, "number_of_shares")
    current = Decimal(current_str or "0")
    new_count = (current + Decimal(num_shares)).quantize(
        Decimal("0.0001"), rounding=ROUND_HALF_UP
    )
    await attr_repo.set_attribute_by_name(account_id, user_id, "number_of_shares", str(new_count))
