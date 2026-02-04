"""
User service for business logic related to user operations.
"""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserRegistrationRequest
from app.services.auth import hash_password, verify_password


class UserService:
    """Service class for user-related operations."""

    def __init__(self, db: AsyncSession) -> None:
        """
        Initialize user service.

        Args:
            db: Database session
        """
        self.db = db

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Retrieve user by email.

        Args:
            email: User email

        Returns:
            User object or None if not found
        """
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def get_user_by_username(self, username: str) -> Optional[User]:
        """
        Retrieve user by username.

        Args:
            username: Username

        Returns:
            User object or None if not found
        """
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalars().first()

    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Retrieve user by ID.

        Args:
            user_id: User ID

        Returns:
            User object or None if not found
        """
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def create_user(self, user_data: UserRegistrationRequest) -> User:
        """
        Create a new user.

        Args:
            user_data: User registration data

        Returns:
            Created user object

        Raises:
            ValueError: If user already exists
        """
        # Check if user already exists
        existing_user = await self.get_user_by_email(user_data.email)
        if existing_user:
            raise ValueError("User with this email already exists")

        existing_username = await self.get_user_by_username(user_data.username)
        if existing_username:
            raise ValueError("User with this username already exists")

        # Create new user
        hashed_password = hash_password(user_data.password)
        new_user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
        )  # type: ignore

        self.db.add(new_user)
        await self.db.flush()
        await self.db.refresh(new_user)

        return new_user

    async def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """
        Authenticate a user with username and password.

        Args:
            username: Username
            password: Plain text password

        Returns:
            User object if authentication successful, None otherwise
        """
        user = await self.get_user_by_username(username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        if not user.is_active:
            return None
        return user
