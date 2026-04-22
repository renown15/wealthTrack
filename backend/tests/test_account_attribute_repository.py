"""Tests for account attribute repository."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.user_profile import UserProfile
from app.repositories.account_attribute_repository import AccountAttributeRepository


@pytest.mark.asyncio
async def test_get_attribute_type_id_opened_date(db_session: AsyncSession):
    """Test getting type ID for opened_date attribute."""
    repo = AccountAttributeRepository(db_session)
    type_id = await repo.get_attribute_type_id("opened_date")
    assert type_id is not None


@pytest.mark.asyncio
async def test_get_attribute_type_id_closed_date(db_session: AsyncSession):
    """Test getting type ID for closed_date attribute."""
    repo = AccountAttributeRepository(db_session)
    type_id = await repo.get_attribute_type_id("closed_date")
    assert type_id is not None


@pytest.mark.asyncio
async def test_get_attribute_type_id_unknown(db_session: AsyncSession):
    """Test getting type ID for unknown attribute returns None."""
    repo = AccountAttributeRepository(db_session)
    type_id = await repo.get_attribute_type_id("nonexistent_type")
    assert type_id is None


@pytest.mark.asyncio
async def test_set_and_get_attribute(db_session: AsyncSession, user: UserProfile, account: Account):
    """Test setting and getting an attribute."""
    repo = AccountAttributeRepository(db_session)

    # Set attribute
    attr = await repo.set_attribute_by_name(account.id, user.id, "opened_date", "2024-01-15")
    assert attr is not None
    assert attr.value == "2024-01-15"

    # Get attribute
    value = await repo.get_attribute_by_name(account.id, user.id, "opened_date")
    assert value == "2024-01-15"


@pytest.mark.asyncio
async def test_set_attribute_upsert(db_session: AsyncSession, user: UserProfile, account: Account):
    """Test updating an existing attribute."""
    repo = AccountAttributeRepository(db_session)

    # Set initial value
    await repo.set_attribute_by_name(account.id, user.id, "opened_date", "2024-01-01")

    # Update value
    attr = await repo.set_attribute_by_name(account.id, user.id, "opened_date", "2024-06-15")
    assert attr.value == "2024-06-15"

    # Verify only one attribute exists
    value = await repo.get_attribute_by_name(account.id, user.id, "opened_date")
    assert value == "2024-06-15"


@pytest.mark.asyncio
async def test_delete_attribute(db_session: AsyncSession, user: UserProfile, account: Account):
    """Test deleting an attribute."""
    repo = AccountAttributeRepository(db_session)

    # Set attribute
    await repo.set_attribute_by_name(account.id, user.id, "opened_date", "2024-01-15")

    # Get type ID
    type_id = await repo.get_attribute_type_id("opened_date")
    assert type_id is not None

    # Delete attribute
    deleted = await repo.delete_attribute(account.id, user.id, type_id)
    assert deleted is True

    # Verify it's gone
    value = await repo.get_attribute_by_name(account.id, user.id, "opened_date")
    assert value is None


@pytest.mark.asyncio
async def test_delete_nonexistent_attribute(
    db_session: AsyncSession, user: UserProfile, account: Account
):
    """Test deleting a non-existent attribute returns False."""
    repo = AccountAttributeRepository(db_session)

    type_id = await repo.get_attribute_type_id("opened_date")
    assert type_id is not None

    # Try to delete without setting
    deleted = await repo.delete_attribute(account.id, user.id, type_id)
    assert deleted is False


@pytest.mark.asyncio
async def test_get_dates_for_account(db_session: AsyncSession, user: UserProfile, account: Account):
    """Test getting both dates for an account."""
    repo = AccountAttributeRepository(db_session)

    # Set both dates
    await repo.set_attribute_by_name(account.id, user.id, "opened_date", "2020-01-01")
    await repo.set_attribute_by_name(account.id, user.id, "closed_date", "2024-12-31")

    # Get dates
    dates = await repo.get_dates_for_account(account.id, user.id)
    assert dates["openedAt"] == "2020-01-01"
    assert dates["closedAt"] == "2024-12-31"


@pytest.mark.asyncio
async def test_get_dates_for_account_empty(
    db_session: AsyncSession, user: UserProfile, account: Account
):
    """Test getting dates when none are set."""
    repo = AccountAttributeRepository(db_session)

    dates = await repo.get_dates_for_account(account.id, user.id)
    assert dates["openedAt"] is None
    assert dates["closedAt"] is None


@pytest.mark.asyncio
async def test_get_all_attributes(db_session: AsyncSession, user: UserProfile, account: Account):
    """Test getting all attributes for an account."""
    repo = AccountAttributeRepository(db_session)

    # Set multiple attributes
    await repo.set_attribute_by_name(account.id, user.id, "opened_date", "2020-01-01")
    await repo.set_attribute_by_name(account.id, user.id, "closed_date", "2024-12-31")

    # Get all attributes
    attrs = await repo.get_all_attributes(account.id, user.id)
    assert len(attrs) == 2
    values = {a["value"] for a in attrs}
    assert "2020-01-01" in values
    assert "2024-12-31" in values


@pytest.mark.asyncio
async def test_get_attribute_nonexistent(
    db_session: AsyncSession, user: UserProfile, account: Account
):
    """Test getting a non-existent attribute returns None."""
    repo = AccountAttributeRepository(db_session)

    value = await repo.get_attribute_by_name(account.id, user.id, "opened_date")
    assert value is None


@pytest.mark.asyncio
async def test_set_attribute_by_name_invalid_type(
    db_session: AsyncSession, user: UserProfile, account: Account
):
    """Test setting attribute with invalid type returns None."""
    repo = AccountAttributeRepository(db_session)

    result = await repo.set_attribute_by_name(account.id, user.id, "invalid_type", "some_value")
    assert result is None
