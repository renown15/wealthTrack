"""Tests for reference data deletion blocking when item is in use."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.user_profile import UserProfile


@pytest.mark.asyncio
async def test_delete_reference_data_blocked_by_account_type_usage(
    client: AsyncClient,
    db_session: AsyncSession,
    user: UserProfile,
) -> None:
    """DELETE fails with 409 when reference is used as account type."""
    # Create a reference data item
    ref_payload = {
        "classKey": "account_type",
        "referenceValue": "blocked_type",
        "sortIndex": 99,
    }
    ref_response = await client.post("/api/v1/reference-data", json=ref_payload)
    assert ref_response.status_code == 201
    ref_id = ref_response.json()["id"]

    # Create account using this reference data
    account = Account(
        user_id=user.id,
        institution_id=None,
        name="Blocked Account",
        type_id=ref_id,
        status_id=1,  # Use default status
    )
    db_session.add(account)
    await db_session.commit()

    # Try to delete - should fail
    delete_response = await client.delete(f"/api/v1/reference-data/{ref_id}")
    assert delete_response.status_code == 409
    assert "used by" in delete_response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_delete_reference_data_blocked_by_account_status_usage(
    client: AsyncClient,
    db_session: AsyncSession,
    user: UserProfile,
) -> None:
    """DELETE fails with 409 when reference is used as account status."""
    # Create a reference data item for account_status
    ref_payload = {
        "classKey": "account_status",
        "referenceValue": "blocked_status",
        "sortIndex": 99,
    }
    ref_response = await client.post("/api/v1/reference-data", json=ref_payload)
    assert ref_response.status_code == 201
    ref_id = ref_response.json()["id"]

    # Create account using this reference data
    account = Account(
        user_id=user.id,
        institution_id=None,
        name="Status Account",
        type_id=1,
        status_id=ref_id,  # Using as status
    )
    db_session.add(account)
    await db_session.commit()

    # Try to delete - should fail
    delete_response = await client.delete(f"/api/v1/reference-data/{ref_id}")
    assert delete_response.status_code == 409
    assert "used by" in delete_response.json()["detail"].lower()
