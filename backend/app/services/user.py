"""
User service for business logic related to user operations.
"""
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reference_data import ReferenceData
from app.models.user_profile import UserProfile
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

    async def get_user_by_email(self, email: str) -> Optional[UserProfile]:
        """
        Retrieve user by email.

        Args:
            email: User email

        Returns:
            UserProfile object or None if not found
        """
        result = await self.db.execute(select(UserProfile).where(UserProfile.email == email))
        return result.scalars().first()

    async def get_user_by_id(self, user_id: int) -> Optional[UserProfile]:
        """
        Retrieve user by ID.

        Args:
            user_id: User ID

        Returns:
            UserProfile object or None if not found
        """
        result = await self.db.execute(select(UserProfile).where(UserProfile.id == user_id))
        return result.scalars().first()

    async def get_reference_data_by_class_and_value(
        self, class_key: str, reference_value: str
    ) -> Optional[ReferenceData]:
        """
        Retrieve reference data by class_key and reference_value.

        Args:
            class_key: Reference data class key (e.g., 'user_type')
            reference_value: Reference data value (e.g., 'User')

        Returns:
            ReferenceData object or None if not found
        """
        result = await self.db.execute(
            select(ReferenceData).where(
                ReferenceData.class_key == class_key,
                ReferenceData.reference_value == reference_value,
            )
        )
        return result.scalars().first()

    async def create_user(self, user_data: UserRegistrationRequest) -> UserProfile:
        """
        Create a new user.

        Args:
            user_data: User registration data

        Returns:
            Created UserProfile object

        Raises:
            ValueError: If user already exists
        """
        # Check if user already exists
        existing_user = await self.get_user_by_email(user_data.email)
        if existing_user:
            raise ValueError("User with this email already exists")

        # Get User type from ReferenceData
        user_type = await self.get_reference_data_by_class_and_value("user_type", "User")
        if not user_type:
            raise ValueError("User type not found in reference data. Run seed-db.py to initialize.")

        # Create new user
        hashed_password = hash_password(user_data.password)
        new_user = UserProfile(
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            email=user_data.email,
            password=hashed_password,
            type_id=user_type.id,  # Use User type from ReferenceData
        )  # type: ignore

        self.db.add(new_user)
        await self.db.flush()
        await self.db.refresh(new_user)

        return new_user

    async def authenticate_user(self, email: str, password: str) -> Optional[UserProfile]:
        """
        Authenticate a user with email and password.

        Args:
            email: User email
            password: Plain text password

        Returns:
            UserProfile object if authentication successful, None otherwise
        """
        user = await self.get_user_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.password):
            return None
        if not user.is_active:
            return None
        return user
