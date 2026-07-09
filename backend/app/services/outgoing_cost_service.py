"""Service for outgoing actual costs and provision cost projections."""
from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account_event import AccountEvent
from app.models.account_event_attribute_group import AccountEventAttributeGroup
from app.models.account_event_attribute_group_member import AccountEventAttributeGroupMember
from app.models.reference_data import ReferenceData
from app.repositories.account_event_repository import AccountEventRepository
from app.repositories.account_repository import AccountRepository
from app.repositories.event_group_repository import EventGroupRepository
from app.schemas.outgoing import ActualCostItem, OutgoingProjection

_GROUP_TYPE = "Actual Cost"


async def record_actual_cost(
    account_id: int, user_id: int, amount: str, cost_date: date, session: AsyncSession
) -> ActualCostItem:
    """Record one actual cost as an event group (Actual Cost + Actual Cost Date)."""
    account_repo = AccountRepository(session)
    if not await account_repo.get_by_id(account_id, user_id):
        raise ValueError("Account not found")

    event_repo = AccountEventRepository(session)
    group_repo = EventGroupRepository(session)
    raw_ids = {
        name: await event_repo.get_event_type_id(name)
        for name in ("Actual Cost", "Actual Cost Date")
    }
    if not all(raw_ids.values()):
        raise ValueError("Required event types not found in reference data")
    type_ids: dict[str, int] = raw_ids  # type: ignore[assignment]

    group = await group_repo.create_group(user_id, _GROUP_TYPE)
    cost_ev = await event_repo.create_event(account_id, user_id, type_ids["Actual Cost"], amount)
    await group_repo.add_event_member(group.id, cost_ev.id)
    date_ev = await event_repo.create_event(
        account_id, user_id, type_ids["Actual Cost Date"], cost_date.isoformat()
    )
    await group_repo.add_event_member(group.id, date_ev.id)

    return ActualCostItem(
        group_id=group.id, account_id=account_id, amount=amount, cost_date=cost_date.isoformat()
    )


async def list_actual_costs(
    account_id: int, user_id: int, session: AsyncSession
) -> list[ActualCostItem]:
    """Return all recorded actual costs for an account, newest period first."""
    group_repo = EventGroupRepository(session)
    groups = await group_repo.get_groups_for_account(account_id, user_id, _GROUP_TYPE)
    items: list[ActualCostItem] = []
    for g in groups:
        amount = next((e["value"] for e in g["events"] if e["event_type"] == "Actual Cost"), None)
        cost_date = next(
            (e["value"] for e in g["events"] if e["event_type"] == "Actual Cost Date"), None
        )
        if amount is None or cost_date is None:
            continue
        items.append(
            ActualCostItem(
                group_id=g["group_id"], account_id=account_id, amount=amount, cost_date=cost_date
            )
        )
    items.sort(key=lambda i: i.cost_date, reverse=True)
    return items


async def delete_actual_cost(group_id: int, user_id: int, session: AsyncSession) -> None:
    """Delete an actual-cost group and its events. No balance impact to reverse."""
    group = await session.get(AccountEventAttributeGroup, group_id)
    if not group or group.user_id != user_id:
        raise ValueError("Actual cost not found")
    group_type = await session.get(ReferenceData, group.type_id)
    if not group_type or group_type.reference_value != _GROUP_TYPE:
        raise ValueError("Actual cost not found")

    members = (
        await session.execute(
            select(AccountEventAttributeGroupMember).where(
                AccountEventAttributeGroupMember.group_id == group_id
            )
        )
    ).scalars().all()
    events: list[AccountEvent] = []
    for m in members:
        if m.account_event_id:
            ev = await session.get(AccountEvent, m.account_event_id)
            if ev:
                events.append(ev)
        await session.delete(m)
    await session.flush()  # members must be gone before events (FK constraint)
    for ev in events:
        await session.delete(ev)
    await session.delete(group)


async def get_projections(user_id: int, session: AsyncSession) -> list[OutgoingProjection]:
    """Projected per-period cost per account, from its Actual Cost history.

    The projection is the mean of actuals dated within the trailing 12 months;
    if none fall in that window the most recent actual is used unchanged.
    """
    by_account: dict[int, list[tuple[date, Decimal]]] = {}
    for account_id, amount, date_str in await _fetch_actuals(user_id, session):
        try:
            parsed = (date.fromisoformat(date_str), Decimal(amount))
        except (ValueError, InvalidOperation):
            continue
        by_account.setdefault(account_id, []).append(parsed)

    cutoff = date.today() - timedelta(days=365)
    projections: list[OutgoingProjection] = []
    for account_id, actuals in sorted(by_account.items()):
        recent = [amt for d, amt in actuals if d >= cutoff]
        if recent:
            projected = sum(recent) / len(recent)
        else:
            projected = max(actuals)[1]
        projections.append(
            OutgoingProjection(
                account_id=account_id,
                projected_cost=str(Decimal(projected).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )),
                actuals_count=len(actuals),
            )
        )
    return projections


async def _fetch_actuals(user_id: int, session: AsyncSession) -> list[tuple[int, str, str]]:
    """Return (account_id, amount, date_string) for the user's Actual Cost events.

    Joins each Actual Cost event to its partner Actual Cost Date event through
    the shared group. Alias queries must use DB column names (groupid, typeid).
    """
    m1 = AccountEventAttributeGroupMember.__table__.alias("m1")
    m2 = AccountEventAttributeGroupMember.__table__.alias("m2")
    ae_cost = AccountEvent.__table__.alias("ae_cost")
    ae_date = AccountEvent.__table__.alias("ae_date")
    rd_cost = ReferenceData.__table__.alias("rd_cost")
    rd_date = ReferenceData.__table__.alias("rd_date")
    stmt = (
        select(ae_cost.c.accountid, ae_cost.c.value, ae_date.c.value)
        .select_from(ae_cost)
        .join(rd_cost, rd_cost.c.id == ae_cost.c.typeid)
        .join(m1, m1.c.account_event_id == ae_cost.c.id)
        .join(
            m2,
            (m2.c.groupid == m1.c.groupid)
            & (m2.c.account_event_id != m1.c.account_event_id),
        )
        .join(ae_date, ae_date.c.id == m2.c.account_event_id)
        .join(rd_date, rd_date.c.id == ae_date.c.typeid)
        .where(ae_cost.c.userid == user_id)
        .where(rd_cost.c.referencevalue == "Actual Cost")
        .where(rd_date.c.referencevalue == "Actual Cost Date")
    )
    result = await session.execute(stmt)
    return [(row[0], row[1], row[2]) for row in result.all() if row[1] and row[2]]
