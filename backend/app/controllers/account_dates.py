"""
Handlers for account date maintenance endpoints.
"""
from typing import Any, Optional

from fastapi import Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.repositories.account_attribute_repository import AccountAttributeRepository
from app.repositories.account_repository import AccountRepository

# Configuration: date field name -> attribute name mappings
DATE_FIELDS = [
    ("opened_at", "opened_date"),
    ("closed_at", "closed_date"),
]


class AccountDatesUpdate(BaseModel):
    """Schema for updating account dates."""

    opened_at: Optional[str] = None
    closed_at: Optional[str] = None


async def update_account_dates(
    account_id: int,
    dates_data: AccountDatesUpdate,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> dict[str, Any]:
    """Update account opened/closed dates."""
    account_repo = AccountRepository(session)
    account = await account_repo.get_by_id(account_id, current_user.id)
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    attr_repo = AccountAttributeRepository(session)

    # Update dates using configuration-driven loop
    for field_name, attr_name in DATE_FIELDS:
        value = getattr(dates_data, field_name, None)
        if value is not None:
            if value == "":
                type_id = await attr_repo.get_attribute_type_id(attr_name)
                if type_id:
                    await attr_repo.delete_attribute(account_id, current_user.id, type_id)
            else:
                await attr_repo.set_attribute_by_name(account_id, current_user.id, attr_name, value)

    dates = await attr_repo.get_dates_for_account(account_id, current_user.id)
    return {"accountId": account_id, **dates}
