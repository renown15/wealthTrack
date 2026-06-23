"""Schemas for risk scenario request/response validation."""
from datetime import datetime

from pydantic import Field

from app.schemas.base import BaseSchema


class ScenarioCreate(BaseSchema):
    """Create a new risk scenario."""

    name: str = Field(..., min_length=1, max_length=255)


class ScenarioRename(BaseSchema):
    """Rename an existing scenario."""

    name: str = Field(..., min_length=1, max_length=255)


class ScenarioGroupCreate(BaseSchema):
    """Add a new group to a scenario."""

    name: str = Field(..., min_length=1, max_length=255)


class ScenarioGroupRename(BaseSchema):
    """Rename a group within a scenario."""

    name: str = Field(..., min_length=1, max_length=255)


class ScenarioAccountAssign(BaseSchema):
    """Assign an account to a group (null group_id = unassign)."""

    account_id: int
    group_id: int | None = None


class ScenarioAccountItem(BaseSchema):
    """Minimal account info for the scenario view."""

    account_id: int
    name: str
    institution_name: str
    account_type: str
    balance: str | None = None
    owner_initials: str = ""
    owner_name: str = ""

    class Config:
        from_attributes = True


class ScenarioGroupResponse(BaseSchema):
    """A group within a scenario, with its assigned accounts."""

    link_id: int
    group_id: int
    name: str
    sort_order: int
    accounts: list[ScenarioAccountItem]

    class Config:
        from_attributes = True


class ScenarioListItem(BaseSchema):
    """Summary of a scenario for list views."""

    scenario_id: int
    name: str
    owner_user_id: int
    is_owner: bool
    group_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ScenarioDetailResponse(BaseSchema):
    """Full scenario detail: groups with accounts, plus unassigned accounts."""

    scenario_id: int
    name: str
    owner_user_id: int
    is_owner: bool
    groups: list[ScenarioGroupResponse]
    unassigned: list[ScenarioAccountItem]

    class Config:
        from_attributes = True
