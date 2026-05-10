"""Handler for the account close-and-transfer endpoint."""
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.controllers.dependencies import get_current_user
from app.database import get_db
from app.models.user_profile import UserProfile
from app.schemas.account import AccountTransferRequest
from app.services.account_transfer_service import close_and_transfer as _transfer


async def close_and_transfer(
    account_id: int,
    request: AccountTransferRequest,
    session: AsyncSession = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
) -> None:
    """Close an account and transfer its balance to another account of the same type."""
    try:
        await _transfer(
            source_id=account_id,
            target_id=request.target_account_id,
            user_id=current_user.id,
            session=session,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
    await session.commit()
