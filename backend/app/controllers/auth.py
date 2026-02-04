"""
User registration and authentication controllers (API endpoints).
"""
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.controllers.dependencies import get_current_user_from_token
from app.database import get_db
from app.schemas.user import (
    TokenResponse,
    UserLoginRequest,
    UserRegistrationRequest,
    UserResponse,
)
from app.services.auth import create_access_token
from app.services.user import UserService

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserRegistrationRequest,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """
    Register a new user.

    Args:
        user_data: User registration data
        db: Database session

    Returns:
        Created user data

    Raises:
        HTTPException: If user already exists or validation fails
    """
    user_service = UserService(db)

    try:
        user = await user_service.create_user(user_data)
        return UserResponse.model_validate(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.post("/login", response_model=TokenResponse)
async def login_user(
    login_data: UserLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    """
    Authenticate user and return access token.

    Args:
        login_data: Login credentials
        db: Database session

    Returns:
        Access token

    Raises:
        HTTPException: If authentication fails
    """
    user_service = UserService(db)

    user = await user_service.authenticate_user(login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires,
    )

    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    token_payload: dict[str, str] = Depends(get_current_user_from_token),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """
    Get current authenticated user from JWT token.

    Args:
        token_payload: Decoded JWT token payload
        db: Database session

    Returns:
        Current user data

    Raises:
        HTTPException: If user not found
    """
    username = token_payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user_service = UserService(db)
    user = await user_service.get_user_by_username(username)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return UserResponse.model_validate(user)
