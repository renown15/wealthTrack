"""Orchestration for generating a member's tax briefing pack PDF."""
from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_profile import UserProfile
from app.repositories.account_group_repository import AccountGroupRepository
from app.repositories.family_repository import FamilyRepository
from app.repositories.portfolio_repository import PortfolioRepository
from app.repositories.tax_period_repository import TaxPeriodRepository
from app.services.gift_service import get_user_gifts
from app.services.tax_briefing_pdf import BriefingData, build_pdf
from app.services.tax_service import get_eligible_with_returns


class BriefingAuthError(PermissionError):
    """Raised when the requester may not access the target member's data."""


class BriefingNotFoundError(LookupError):
    """Raised when the requested member or tax period does not exist."""


async def authorize_target(
    session: AsyncSession, current_user_id: int, member_id: int
) -> None:
    """Allow access only to self or a member of the same family."""
    if member_id == current_user_id:
        return
    member_ids = await FamilyRepository(session).get_member_ids_for_user(current_user_id)
    if member_id not in member_ids:
        raise BriefingAuthError("You may not generate a briefing pack for this member")


async def _member_name(session: AsyncSession, member_id: int) -> str:
    user = await session.get(UserProfile, member_id)
    if not user:
        raise BriefingNotFoundError("Member not found")
    return f"{user.first_name} {user.last_name}".strip()


def _filename(member_name: str, period_name: str) -> str:
    def slug(text: str) -> str:
        return "".join(c if c.isalnum() else "-" for c in text).strip("-").lower() or "x"

    return f"tax-briefing-{slug(member_name)}-{slug(period_name)}.pdf"


async def generate_briefing_pack(
    session: AsyncSession, current_user_id: int, member_id: int, period_id: int
) -> tuple[bytes, str]:
    """Build the briefing PDF for a member's tax period; returns (pdf_bytes, filename)."""
    await authorize_target(session, current_user_id, member_id)
    member_name = await _member_name(session, member_id)

    period = await TaxPeriodRepository(session).get_by_id(period_id, member_id)
    if not period:
        raise BriefingNotFoundError("Tax period not found")

    if not period.account_group_id:
        group = await AccountGroupRepository(session).create(
            member_id, f"Tax Period: {period.name}"
        )
        period.account_group_id = group.id
        await session.flush()
        await session.commit()

    portfolio_items = await PortfolioRepository(session).get_user_portfolio(member_id)
    tax_result = await get_eligible_with_returns(
        session,
        member_id,
        period_id,
        period.start_date,
        period.end_date,
        group_id=period.account_group_id,
        period_name=period.name,
    )
    gifts = await get_user_gifts(member_id, session)

    out_of_scope = [i for i in tax_result["not_in_scope"] if i.get("scope")]
    data = BriefingData(
        member_name=member_name,
        period_name=period.name,
        portfolio_items=portfolio_items,
        in_scope=tax_result["in_scope"],
        eligible=tax_result["eligible"],
        gifts=gifts,
        out_of_scope=out_of_scope,
    )
    return build_pdf(data), _filename(member_name, period.name)
