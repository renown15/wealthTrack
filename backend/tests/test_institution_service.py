"""
Tests for InstitutionService.
"""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.institution import Institution
from app.services.institution_service import InstitutionService


@pytest.mark.asyncio
async def test_institution_service_update_success(
    db_session: AsyncSession,
    institution: Institution,
) -> None:
    """Test updating institution name."""
    service = InstitutionService(db_session)
    result = await service.update(institution.id, institution.user_id, "Updated Name")

    assert result is True

    # Verify update
    updated = await service.repository.get_by_id(institution.id, institution.user_id)
    assert updated.name == "Updated Name"


@pytest.mark.asyncio
async def test_institution_service_update_not_found(
    db_session: AsyncSession,
) -> None:
    """Test updating non-existent institution."""
    service = InstitutionService(db_session)

    with pytest.raises(ValueError, match="not found"):
        await service.update(99999, 1, "New Name")


@pytest.mark.asyncio
async def test_institution_service_delete_success(
    db_session: AsyncSession,
    institution: Institution,
) -> None:
    """Test deleting institution."""
    service = InstitutionService(db_session)
    inst_id = institution.id
    user_id = institution.user_id

    result = await service.delete(inst_id, user_id)
    assert result is True

    # Verify deletion
    deleted = await service.repository.get_by_id(inst_id, user_id)
    assert deleted is None


@pytest.mark.asyncio
async def test_institution_service_delete_not_found(
    db_session: AsyncSession,
) -> None:
    """Test deleting non-existent institution."""
    service = InstitutionService(db_session)

    with pytest.raises(ValueError, match="not found"):
        await service.delete(99999, 1)
