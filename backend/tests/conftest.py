"""
Pytest configuration and fixtures.
"""
import asyncio
import os
from collections.abc import AsyncGenerator

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine, AsyncEngine
from sqlalchemy.pool import NullPool

from app.database import Base, get_db
from app.main import app
from app.models.account import Account
from app.models.institution import Institution
from app.models.reference_data import ReferenceData
from app.models.user_profile import UserProfile
from app.services.auth import create_access_token

# Test database URL - use environment variable or default to local
TEST_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://wealthtrack:wealthtrack_dev_password@localhost:5433/wealthtrack_test",
)


@pytest.fixture(scope="function")
async def test_engine() -> AsyncEngine:
    """Create test engine for each test - NullPool disables connection pooling."""
    engine = create_async_engine(
        TEST_DATABASE_URL, 
        echo=False,
        poolclass=NullPool,  # Disable pooling to avoid event loop issues
    )
    
    # Initialize schema
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    await engine.dispose()


@pytest.fixture(scope="function")
async def db_session(test_engine: AsyncEngine) -> AsyncGenerator[AsyncSession, None]:
    """
    Create a fresh database session for each test.
    Each test gets an isolated session with reference data.
    """
    async_session_maker = async_sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session_maker() as session:
        # Add default ReferenceData entries for tests
        ref_data_entries = [
            # User types
            ReferenceData(class_key="user_type:user", reference_value="User", sort_index=1),
            ReferenceData(class_key="user_type:superuser", reference_value="SuperUser", sort_index=2),
            # Account types
            ReferenceData(class_key="account_type:checking", reference_value="Checking Account", sort_index=1),
            ReferenceData(class_key="account_type:savings", reference_value="Savings Account", sort_index=2),
            ReferenceData(class_key="account_type:stocks_isa", reference_value="Stocks ISA", sort_index=3),
            ReferenceData(class_key="account_type:sipp", reference_value="SIPP", sort_index=4),
            ReferenceData(class_key="account_type:credit_card", reference_value="Credit Card", sort_index=5),
            # Account statuses
            ReferenceData(class_key="account_status:active", reference_value="Active", sort_index=1),
            ReferenceData(class_key="account_status:closed", reference_value="Closed", sort_index=2),
            ReferenceData(class_key="account_status:dormant", reference_value="Dormant", sort_index=3),
            # Event types
            ReferenceData(class_key="account_event:balance_update", reference_value="Balance Update", sort_index=1),
            ReferenceData(class_key="account_event:transaction", reference_value="Transaction", sort_index=2),
        ]
        for ref in ref_data_entries:
            session.add(ref)
        await session.commit()
        
        yield session



@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with database session override."""

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
async def user(db_session: AsyncSession) -> UserProfile:
    """Create a test user profile."""
    # Get the first user_type:user reference data entry
    from sqlalchemy import select

    result = await db_session.execute(
        select(ReferenceData).where(
            ReferenceData.class_key == "user_type:user"
        )
    )
    user_type_ref = result.scalar_one_or_none()
    
    if not user_type_ref:
        # If not found (shouldn't happen), create one
        user_type_ref = ReferenceData(
            class_key="user_type:user",
            reference_value="User",
            sort_index=1
        )
        db_session.add(user_type_ref)
        await db_session.flush()
        await db_session.refresh(user_type_ref)

    # Create user profile
    user_obj = UserProfile(
        first_name="Test",
        last_name="User",
        email="test@example.com",
        password="hashed_password",
        is_active=True,
        type_id=user_type_ref.id,
    )
    db_session.add(user_obj)
    await db_session.flush()
    await db_session.refresh(user_obj)
    return user_obj


@pytest.fixture(scope="function")
async def institution(db_session: AsyncSession, user: UserProfile) -> Institution:
    """Create a test institution."""
    inst = Institution(
        user_id=user.id,
        name="Test Bank",
    )
    db_session.add(inst)
    await db_session.flush()
    await db_session.refresh(inst)
    return inst


@pytest.fixture(scope="function")
async def account(
    db_session: AsyncSession, user: UserProfile, institution: Institution
) -> Account:
    """Create a test account."""
    acc = Account(
        user_id=user.id,
        institution_id=institution.id,
        name="Test Checking Account",
        type_id=1,
        status_id=1,
    )
    db_session.add(acc)
    await db_session.flush()
    await db_session.refresh(acc)
    return acc


@pytest.fixture(scope="function")
async def authenticated_headers(user: UserProfile) -> dict[str, str]:
    """Create authenticated headers with JWT token using user id."""
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}
