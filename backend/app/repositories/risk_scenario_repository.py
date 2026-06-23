"""Repository for RiskScenario CRUD and detail queries."""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.account_group import AccountGroup
from app.models.account_group_member import AccountGroupMember
from app.models.risk_scenario import RiskScenario
from app.models.risk_scenario_account_group import RiskScenarioAccountGroup
from app.repositories.risk_scenario_base import RiskScenarioBaseRepository
from app.schemas.risk_scenario import (
    ScenarioDetailResponse,
    ScenarioGroupResponse,
    ScenarioListItem,
)


class RiskScenarioRepository(RiskScenarioBaseRepository):
    """Handles all DB operations for risk scenarios."""

    async def list_visible(self, user_id: int) -> list[ScenarioListItem]:
        """List all scenarios owned by any member of the user's family."""
        visible_ids = await self.visible_user_ids(user_id)
        stmt = (
            select(RiskScenario)
            .where(RiskScenario.user_id.in_(visible_ids))
            .options(selectinload(RiskScenario.groups))
            .order_by(RiskScenario.created_at.desc())
        )
        result = await self.session.execute(stmt)
        scenarios = list(result.scalars().unique().all())
        return [
            ScenarioListItem(
                scenario_id=s.id,
                name=s.name,
                owner_user_id=s.user_id,
                is_owner=(s.user_id == user_id),
                group_count=len(s.groups),
                created_at=s.created_at,
                updated_at=s.updated_at,
            )
            for s in scenarios
        ]

    async def get_detail(
        self, scenario_id: int, user_id: int
    ) -> Optional[ScenarioDetailResponse]:
        """Full detail: groups with accounts, plus unassigned family accounts."""
        scenario = await self._load_scenario_with_groups(scenario_id)
        if not scenario:
            return None

        visible_ids = await self.visible_user_ids(user_id)
        accounts = await self._fetch_accounts(visible_ids)
        accounts_by_id = {a.id: a for a in accounts}
        type_ids = list({a.type_id for a in accounts})
        types = await self._type_names(type_ids)
        user_profiles = await self._fetch_user_profiles(visible_ids)

        assigned_ids: set[int] = set()
        groups: list[ScenarioGroupResponse] = []
        for link in scenario.groups:
            ag = link.account_group
            group_accounts = []
            for member in ag.members:
                acct = accounts_by_id.get(member.account_id)
                if acct:
                    assigned_ids.add(acct.id)
                    group_accounts.append(self._account_item(acct, types, user_profiles))
            groups.append(ScenarioGroupResponse(
                link_id=link.id,
                group_id=ag.id,
                name=ag.name,
                sort_order=link.sort_order,
                accounts=group_accounts,
            ))

        unassigned = [
            self._account_item(a, types, user_profiles)
            for a in accounts if a.id not in assigned_ids
        ]
        return ScenarioDetailResponse(
            scenario_id=scenario.id,
            name=scenario.name,
            owner_user_id=scenario.user_id,
            is_owner=(scenario.user_id == user_id),
            groups=groups,
            unassigned=unassigned,
        )

    async def repo_get(self, scenario_id: int) -> Optional[RiskScenario]:
        return await self.session.get(RiskScenario, scenario_id)

    async def create(self, user_id: int, name: str) -> RiskScenario:
        scenario = RiskScenario()
        scenario.user_id = user_id
        scenario.name = name
        self.session.add(scenario)
        await self.session.flush()
        await self.session.refresh(scenario)
        return scenario

    async def rename(self, scenario_id: int, name: str) -> Optional[RiskScenario]:
        scenario = await self.session.get(RiskScenario, scenario_id)
        if not scenario:
            return None
        scenario.name = name
        await self.session.flush()
        return scenario

    async def delete(self, scenario_id: int) -> bool:
        scenario = await self._load_scenario_with_groups(scenario_id)
        if not scenario:
            return False
        await self.session.delete(scenario)
        await self.session.flush()
        return True

    async def add_group(
        self, scenario_id: int, user_id: int, name: str
    ) -> Optional[ScenarioGroupResponse]:
        """Create a new AccountGroup and link it to the scenario."""
        scenario = await self.session.get(RiskScenario, scenario_id)
        if not scenario:
            return None
        existing_stmt = select(RiskScenarioAccountGroup).where(
            RiskScenarioAccountGroup.scenario_id == scenario_id
        )
        existing = (await self.session.execute(existing_stmt)).scalars().all()
        next_order = max((e.sort_order for e in existing), default=-1) + 1

        group = AccountGroup()
        group.user_id = user_id
        group.name = name
        self.session.add(group)
        await self.session.flush()

        link = RiskScenarioAccountGroup()
        link.scenario_id = scenario_id
        link.account_group_id = group.id
        link.sort_order = next_order
        self.session.add(link)
        await self.session.flush()
        return ScenarioGroupResponse(
            link_id=link.id,
            group_id=group.id,
            name=group.name,
            sort_order=link.sort_order,
            accounts=[],
        )

    async def rename_group(self, link_id: int, name: str) -> Optional[ScenarioGroupResponse]:
        link_stmt = (
            select(RiskScenarioAccountGroup)
            .where(RiskScenarioAccountGroup.id == link_id)
            .options(selectinload(RiskScenarioAccountGroup.account_group)
                     .selectinload(AccountGroup.members))
        )
        link = (await self.session.execute(link_stmt)).scalar_one_or_none()
        if not link:
            return None
        link.account_group.name = name
        await self.session.flush()
        return ScenarioGroupResponse(
            link_id=link.id,
            group_id=link.account_group.id,
            name=link.account_group.name,
            sort_order=link.sort_order,
            accounts=[],
        )

    async def delete_group(self, link_id: int) -> bool:
        link_stmt = (
            select(RiskScenarioAccountGroup)
            .where(RiskScenarioAccountGroup.id == link_id)
            .options(selectinload(RiskScenarioAccountGroup.account_group)
                     .selectinload(AccountGroup.members))
        )
        link = (await self.session.execute(link_stmt)).scalar_one_or_none()
        if not link:
            return False
        group = link.account_group
        await self.session.delete(link)
        await self.session.flush()
        await self.session.delete(group)
        await self.session.flush()
        return True

    async def assign_account(
        self, scenario_id: int, account_id: int, group_id: Optional[int]
    ) -> bool:
        """Move an account to a group, or unassign it (group_id=None)."""
        scenario = await self._load_scenario_with_groups(scenario_id)
        if not scenario:
            return False
        group_ids_in_scenario = [link.account_group_id for link in scenario.groups]
        if group_ids_in_scenario:
            existing_stmt = select(AccountGroupMember).where(
                AccountGroupMember.account_group_id.in_(group_ids_in_scenario),
                AccountGroupMember.account_id == account_id,
            )
            for member in (await self.session.execute(existing_stmt)).scalars().all():
                await self.session.delete(member)
            await self.session.flush()
        if group_id is not None:
            member = AccountGroupMember()
            member.account_group_id = group_id
            member.account_id = account_id
            self.session.add(member)
            await self.session.flush()
        return True
