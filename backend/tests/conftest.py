"""
Pytest configuration and fixtures.
"""
import asyncio
import os
from collections.abc import AsyncGenerator, Generator

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

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

# Create test engine
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_async_session_maker = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)



@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with test_async_session_maker() as session:
        # Create default ReferenceData entries for tests
        ref_data_entries = [
            ReferenceData(classkey="user_type:STANDARD", referencevalue="Standard User", sortindex=1),
            ReferenceData(classkey="account_type:CHECKING", referencevalue="Checking Account", sortindex=1),
            ReferenceData(classkey="account_status:ACTIVE", referencevalue="Active", sortindex=1),
            ReferenceData(classkey="event_type:BALANCE_UPDATE", referencevalue="Balance Update", sortindex=1),
        ]
        for ref in ref_data_entries:
            session.add(ref)
        await session.flush()
        
        yield session
        await session.rollback()


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with database session override."""

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
async def user(db_session: AsyncSession) -> UserProfile:
    """Create a test user profile."""
    # First create reference data for user type
    ref_data = ReferenceData(
        classkey="user_profile_type:STANDARD",
        referencevalue="Standard User",
        sortindex=1,
    )
    db_session.add(ref_data)
    await db_session.flush()
    await db_session.refresh(ref_data)

    # Create user profile
    user_obj = UserProfile(
        firstname="Test",
        surname="User",
        email="test@example.com",
        password="hashed_password",
        is_active=True,
        typeid=ref_data.id,
    )
    db_session.add(user_obj)
    await db_session.flush()
    await db_session.refresh(user_obj)
    return user_obj


@pytest.fixture(scope="function")
async def institution(db_session: AsyncSession, user: UserProfile) -> Institution:
    """Create a test institution."""
    inst = Institution(
        userid=user.id,
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
        userid=user.id,
        institutionid=institution.id,
        name="Test Checking Account",
        typeid=1,
        statusid=1,
    )
    db_session.add(acc)
    await db_session.flush()
    await db_session.refresh(acc)
    return acc


@pytest.fixture(scope="function")
def authenticated_headers(user: UserProfile) -> dict[str, str]:
    """Create authenticated headers with JWT token using user id."""
    token = create_access_token(data={"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}
