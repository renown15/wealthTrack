"""
Authentication dependencies for FastAPI endpoints.
"""
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user_profile import UserProfile
from app.services.auth import decode_access_token
from app.services.user import UserService

# HTTP Bearer authentication scheme
security = HTTPBearer()


async def get_current_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict[str, str]:
    """
    Extract and validate JWT token from Authorization header.

    Args:
        credentials: HTTP Bearer token from header

    Returns:
        Decoded token payload

    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


async def get_current_user(
    token_payload: dict[str, str] = Depends(get_current_user_from_token),
    session: AsyncSession = Depends(get_db),
) -> UserProfile:
    """
    Get the current authenticated user from token payload.

    Args:
        token_payload: Decoded JWT token payload
        session: Database session

    Returns:
        Current authenticated UserProfile

    Raises:
        HTTPException: If user not found or invalid token
    """
    user_id: Optional[str] = token_payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user_service = UserService(session)
    try:
        user_id_int = int(user_id)
        user = await user_service.get_user_by_id(user_id_int)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        return user
    except (ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
        ) from exc
