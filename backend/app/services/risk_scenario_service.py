"""Business logic for risk scenario management."""
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.risk_scenario import RiskScenario
from app.repositories.risk_scenario_repository import RiskScenarioRepository
from app.schemas.risk_scenario import (
    ScenarioDetailResponse,
    ScenarioGroupResponse,
    ScenarioListItem,
)


class RiskScenarioService:
    """Owns permission enforcement for risk scenario operations."""

    def __init__(self, session: AsyncSession):
        self.repo = RiskScenarioRepository(session)

    async def list_scenarios(self, user_id: int) -> list[ScenarioListItem]:
        return await self.repo.list_visible(user_id)

    async def get_detail(
        self, scenario_id: int, user_id: int
    ) -> Optional[ScenarioDetailResponse]:
        detail = await self.repo.get_detail(scenario_id, user_id)
        if detail is None:
            return None
        visible_ids = await self.repo.visible_user_ids(user_id)
        if detail.owner_user_id not in visible_ids and detail.owner_user_id != user_id:
            raise PermissionError("Not authorised to view this scenario")
        return detail

    async def create_scenario(self, user_id: int, name: str) -> RiskScenario:
        return await self.repo.create(user_id, name)

    async def rename_scenario(
        self, scenario_id: int, name: str, user_id: int
    ) -> Optional[RiskScenario]:
        scenario = await self.repo.rename(scenario_id, name)
        if scenario is None:
            return None
        if scenario.user_id != user_id:
            raise PermissionError("Only the owner can rename a scenario")
        scenario = await self.repo.rename(scenario_id, name)
        return scenario

    async def delete_scenario(self, scenario_id: int, user_id: int) -> bool:
        scenario = await self.repo.repo_get(scenario_id)
        if scenario is None:
            return False
        if scenario.user_id != user_id:
            raise PermissionError("Only the owner can delete a scenario")
        return await self.repo.delete(scenario_id)

    async def add_group(
        self, scenario_id: int, user_id: int, name: str
    ) -> Optional[ScenarioGroupResponse]:
        scenario = await self.repo.repo_get(scenario_id)
        if scenario is None:
            return None
        if scenario.user_id != user_id:
            raise PermissionError("Only the owner can add groups")
        return await self.repo.add_group(scenario_id, user_id, name)

    async def rename_group(
        self, scenario_id: int, link_id: int, name: str, user_id: int
    ) -> Optional[ScenarioGroupResponse]:
        scenario = await self.repo.repo_get(scenario_id)
        if scenario is None:
            return None
        if scenario.user_id != user_id:
            raise PermissionError("Only the owner can rename groups")
        return await self.repo.rename_group(link_id, name)

    async def delete_group(
        self, scenario_id: int, link_id: int, user_id: int
    ) -> bool:
        scenario = await self.repo.repo_get(scenario_id)
        if scenario is None:
            return False
        if scenario.user_id != user_id:
            raise PermissionError("Only the owner can delete groups")
        return await self.repo.delete_group(link_id)

    async def assign_account(
        self,
        scenario_id: int,
        account_id: int,
        group_id: Optional[int],
        user_id: int,
    ) -> bool:
        scenario = await self.repo.repo_get(scenario_id)
        if scenario is None:
            return False
        if scenario.user_id != user_id:
            raise PermissionError("Only the owner can assign accounts")
        return await self.repo.assign_account(scenario_id, account_id, group_id)
