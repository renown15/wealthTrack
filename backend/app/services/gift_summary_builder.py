"""Helpers for building gift summaries from event groups."""
from datetime import date
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.account_event import AccountEvent
from app.models.account_event_attribute_group import AccountEventAttributeGroup
from app.models.account_event_attribute_group_member import AccountEventAttributeGroupMember
from app.models.reference_data import ReferenceData
from app.schemas.gift import GiftSummary


def calculate_iht_taper_rate(gift_date: date) -> Decimal:
    """Return IHT taper rate as a decimal fraction based on years since gift."""
    years = (date.today() - gift_date).days / 365.25
    if years >= 7:
        return Decimal("0")
    if years >= 6:
        return Decimal("0.08")
    if years >= 5:
        return Decimal("0.16")
    if years >= 4:
        return Decimal("0.24")
    if years >= 3:
        return Decimal("0.32")
    return Decimal("0.40")


async def build_gift_summary(
    session: AsyncSession,
    group: AccountEventAttributeGroup,
) -> Optional[GiftSummary]:
    """Build a GiftSummary from a group by reading its member events."""
    members_stmt = select(AccountEventAttributeGroupMember).where(
        AccountEventAttributeGroupMember.group_id == group.id
    )
    members = (await session.execute(members_stmt)).scalars().all()

    gift_value: Optional[str] = None
    gift_date_str: Optional[str] = None
    donor: Optional[str] = None
    num_shares: Optional[str] = None
    account_id: Optional[int] = None

    for m in members:
        if not m.account_event_id:
            continue
        ev = await session.get(AccountEvent, m.account_event_id)
        if not ev:
            continue
        rd = await session.get(ReferenceData, ev.type_id)
        if not rd:
            continue
        match rd.reference_value:
            case "Gift":
                gift_value = ev.value
                account_id = ev.account_id
            case "Gift Date":
                gift_date_str = ev.value
            case "Gift Donor":
                donor = ev.value
            case "Gift Shares":
                num_shares = ev.value

    if not all([gift_value, gift_date_str, donor, account_id]):
        return None

    assert gift_value is not None
    assert gift_date_str is not None
    assert donor is not None
    assert account_id is not None

    account = await session.get(Account, account_id)
    account_name = account.name if account else str(account_id)
    gift_date = date.fromisoformat(gift_date_str)
    years = (date.today() - gift_date).days / 365.25
    rate = calculate_iht_taper_rate(gift_date)
    exposure = (Decimal(gift_value) * rate).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    return GiftSummary(
        group_id=group.id,
        account_id=account_id,
        account_name=account_name,
        donor=donor,
        gift_date=gift_date,
        gift_value_gbp=gift_value,
        num_shares=num_shares,
        years_elapsed=round(years, 2),
        iht_rate=str(rate),
        iht_exposure=str(exposure),
    )


async def get_ref_id(session: AsyncSession, class_key: str, value: str) -> Optional[int]:
    return (await session.execute(
        select(ReferenceData.id)
        .where(ReferenceData.class_key == class_key)
        .where(ReferenceData.reference_value == value)
    )).scalar_one_or_none()
