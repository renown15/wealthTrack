"""Shared helpers for risk scenario repository queries."""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.account import Account
from app.models.account_group import AccountGroup
from app.models.family_member_account import FamilyMemberAccount
from app.models.reference_data import ReferenceData
from app.models.risk_scenario import RiskScenario
from app.models.risk_scenario_account_group import RiskScenarioAccountGroup
from app.models.user_profile import UserProfile
from app.schemas.risk_scenario import ScenarioAccountItem


class RiskScenarioBaseRepository:
    """Shared query helpers for risk scenario repositories."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def visible_user_ids(self, user_id: int) -> list[int]:
        """Return all user IDs visible to this user (self + family members)."""
        stmt = select(FamilyMemberAccount.account_id).where(
            FamilyMemberAccount.family_id.in_(
                select(FamilyMemberAccount.family_id).where(
                    FamilyMemberAccount.account_id == user_id
                )
            )
        )
        result = await self.session.execute(stmt)
        ids = list({row[0] for row in result.all()} | {user_id})
        return ids

    async def _fetch_accounts(self, user_ids: list[int]) -> list[Account]:
        """Fetch all active (non-closed) accounts for given user IDs with institution loaded."""
        stmt = (
            select(Account)
            .join(ReferenceData, Account.status_id == ReferenceData.id)
            .where(
                Account.user_id.in_(user_ids),
                ReferenceData.class_key == "account_status",
                ReferenceData.reference_value != "Closed",
            )
            .options(selectinload(Account.institution))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().unique().all())

    async def _type_names(self, type_ids: list[int]) -> dict[int, str]:
        """Map ReferenceData IDs to their value strings."""
        if not type_ids:
            return {}
        stmt = select(ReferenceData).where(ReferenceData.id.in_(type_ids))
        result = await self.session.execute(stmt)
        return {rd.id: rd.reference_value for rd in result.scalars().all()}

    async def _fetch_user_profiles(self, user_ids: list[int]) -> dict[int, UserProfile]:
        """Map user IDs to their UserProfile rows."""
        stmt = select(UserProfile).where(UserProfile.id.in_(user_ids))
        result = await self.session.execute(stmt)
        return {up.id: up for up in result.scalars().all()}

    def _account_item(
        self,
        account: Account,
        types: dict[int, str],
        user_profiles: dict[int, UserProfile] | None = None,
    ) -> ScenarioAccountItem:
        initials = ""
        full_name = ""
        if user_profiles and (up := user_profiles.get(account.user_id)):
            initials = f"{up.first_name[:1]}{up.last_name[:1]}".upper()
            full_name = f"{up.first_name} {up.last_name}".strip()
        return ScenarioAccountItem(
            account_id=account.id,
            name=account.name,
            institution_name=account.institution.name if account.institution else "",
            account_type=types.get(account.type_id, ""),
            owner_initials=initials,
            owner_name=full_name,
        )

    async def _load_scenario_with_groups(
        self, scenario_id: int
    ) -> Optional[RiskScenario]:
        stmt = (
            select(RiskScenario)
            .where(RiskScenario.id == scenario_id)
            .options(
                selectinload(RiskScenario.groups)
                .selectinload(RiskScenarioAccountGroup.account_group)
                .selectinload(AccountGroup.members)
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
