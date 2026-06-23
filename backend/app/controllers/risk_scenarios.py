"""Controller for risk scenario endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.schemas.risk_scenario import (
    ScenarioAccountAssign,
    ScenarioCreate,
    ScenarioDetailResponse,
    ScenarioGroupCreate,
    ScenarioGroupRename,
    ScenarioGroupResponse,
    ScenarioListItem,
    ScenarioRename,
)
from app.services.risk_scenario_service import RiskScenarioService

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


def _svc(session: AsyncSession) -> RiskScenarioService:
    return RiskScenarioService(session)


@router.get("", response_model=list[ScenarioListItem])
async def list_scenarios(
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> list[ScenarioListItem]:
    """List all scenarios visible to the current user (own + family members')."""
    return await _svc(session).list_scenarios(current_user.id)


@router.post("", response_model=ScenarioListItem, status_code=status.HTTP_201_CREATED)
async def create_scenario(
    body: ScenarioCreate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> ScenarioListItem:
    """Create a new scenario owned by the current user."""
    svc = _svc(session)
    scenario = await svc.create_scenario(current_user.id, body.name)
    await session.commit()
    return ScenarioListItem(
        scenario_id=scenario.id,
        name=scenario.name,
        owner_user_id=scenario.user_id,
        is_owner=True,
        group_count=0,
        created_at=scenario.created_at,
        updated_at=scenario.updated_at,
    )


@router.get("/{scenario_id}", response_model=ScenarioDetailResponse)
async def get_scenario(
    scenario_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> ScenarioDetailResponse:
    """Get full scenario detail including groups and unassigned accounts."""
    try:
        detail = await _svc(session).get_detail(scenario_id, current_user.id)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    if detail is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    return detail


@router.put("/{scenario_id}", response_model=ScenarioListItem)
async def rename_scenario(
    scenario_id: int,
    body: ScenarioRename,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> ScenarioListItem:
    """Rename a scenario (owner only)."""
    try:
        scenario = await _svc(session).rename_scenario(scenario_id, body.name, current_user.id)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    if scenario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    await session.commit()
    return ScenarioListItem(
        scenario_id=scenario.id,
        name=scenario.name,
        owner_user_id=scenario.user_id,
        is_owner=True,
        group_count=0,
        created_at=scenario.created_at,
        updated_at=scenario.updated_at,
    )


@router.delete("/{scenario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scenario(
    scenario_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> None:
    """Delete a scenario (owner only)."""
    try:
        success = await _svc(session).delete_scenario(scenario_id, current_user.id)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    await session.commit()


@router.post(
    "/{scenario_id}/groups",
    response_model=ScenarioGroupResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_group(
    scenario_id: int,
    body: ScenarioGroupCreate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> ScenarioGroupResponse:
    """Add a new group to a scenario (owner only)."""
    try:
        group = await _svc(session).add_group(scenario_id, current_user.id, body.name)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    await session.commit()
    return group


@router.put("/{scenario_id}/groups/{link_id}", response_model=ScenarioGroupResponse)
async def rename_group(
    scenario_id: int,
    link_id: int,
    body: ScenarioGroupRename,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> ScenarioGroupResponse:
    """Rename a group within a scenario (owner only)."""
    try:
        group = await _svc(session).rename_group(scenario_id, link_id, body.name, current_user.id)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    await session.commit()
    return group


@router.delete("/{scenario_id}/groups/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    scenario_id: int,
    link_id: int,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> None:
    """Delete a group from a scenario (owner only)."""
    try:
        success = await _svc(session).delete_group(scenario_id, link_id, current_user.id)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    await session.commit()


@router.post("/{scenario_id}/assignments", status_code=status.HTTP_204_NO_CONTENT)
async def assign_account(
    scenario_id: int,
    body: ScenarioAccountAssign,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> None:
    """Assign (or unassign) an account within a scenario (owner only)."""
    try:
        success = await _svc(session).assign_account(
            scenario_id, body.account_id, body.group_id, current_user.id
        )
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")
    await session.commit()
