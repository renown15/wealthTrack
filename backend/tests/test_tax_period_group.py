"""Tests for tax period linked account group behaviour."""
from datetime import date

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account_group import AccountGroup
from app.models.account_group_member import AccountGroupMember
from app.models.user_profile import UserProfile


@pytest.mark.asyncio
async def test_create_period_creates_linked_group(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    db_session: AsyncSession,
) -> None:
    """Creating a tax period should auto-create a linked AccountGroup."""
    resp = await client.post(
        "/api/v1/tax/periods",
        json={"name": "2024/25", "startDate": "2024-04-06", "endDate": "2025-04-05"},
        headers=authenticated_headers,
    )
    assert resp.status_code == status.HTTP_201_CREATED
    data = resp.json()
    assert data["accountGroupId"] is not None


@pytest.mark.asyncio
async def test_create_period_group_name_matches(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    db_session: AsyncSession,
    user: UserProfile,
) -> None:
    """The linked AccountGroup should be named after the period."""
    await client.post(
        "/api/v1/tax/periods",
        json={"name": "2025/26", "startDate": "2025-04-06", "endDate": "2026-04-05"},
        headers=authenticated_headers,
    )
    result = await db_session.execute(
        __import__("sqlalchemy", fromlist=["select"]).select(AccountGroup)
        .where(AccountGroup.user_id == user.id)
        .where(AccountGroup.name == "Tax Period: 2025/26")
    )
    group = result.scalar_one_or_none()
    assert group is not None


@pytest.mark.asyncio
async def test_accounts_response_has_two_sections(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
) -> None:
    """GET /periods/{id}/accounts returns inScope and eligible sections."""
    create_resp = await client.post(
        "/api/v1/tax/periods",
        json={"name": "2024/25", "startDate": "2024-04-06", "endDate": "2025-04-05"},
        headers=authenticated_headers,
    )
    period_id = create_resp.json()["id"]

    resp = await client.get(
        f"/api/v1/tax/periods/{period_id}/accounts",
        headers=authenticated_headers,
    )
    assert resp.status_code == status.HTTP_200_OK
    data = resp.json()
    assert "inScope" in data
    assert "eligible" in data
    assert "accountGroupId" in data
    assert isinstance(data["inScope"], list)
    assert isinstance(data["eligible"], list)


@pytest.mark.asyncio
async def test_in_scope_after_adding_member(
    client: AsyncClient,
    authenticated_headers: dict[str, str],
    db_session: AsyncSession,
    user: UserProfile,
    account: object,
) -> None:
    """Account added to period group appears in inScope, not eligible."""
    from sqlalchemy import select as sa_select

    from app.models.account import Account as AccountModel
    from app.models.account_attribute import AccountAttribute
    from app.models.reference_data import ReferenceData

    acct: AccountModel = account  # type: ignore[assignment]

    ir_type_result = await db_session.execute(
        sa_select(ReferenceData.id).where(
            ReferenceData.class_key == "account_attribute_type",
            ReferenceData.reference_value == "Interest Rate",
        )
    )
    ir_type_id = ir_type_result.scalar_one_or_none()
    if ir_type_id:
        attr = AccountAttribute(
            user_id=user.id, account_id=acct.id, type_id=ir_type_id, value="3.5"
        )
        db_session.add(attr)
        await db_session.flush()

    create_resp = await client.post(
        "/api/v1/tax/periods",
        json={"name": "2024/25", "startDate": "2024-04-06", "endDate": "2025-04-05"},
        headers=authenticated_headers,
    )
    period_data = create_resp.json()
    period_id = period_data["id"]
    group_id = period_data["accountGroupId"]

    member = AccountGroupMember()
    member.account_group_id = group_id
    member.account_id = acct.id
    db_session.add(member)
    await db_session.flush()
    await db_session.commit()

    resp = await client.get(
        f"/api/v1/tax/periods/{period_id}/accounts",
        headers=authenticated_headers,
    )
    data = resp.json()
    in_scope_ids = [a["accountId"] for a in data["inScope"]]
    eligible_ids = [a["accountId"] for a in data["eligible"]]
    assert acct.id in in_scope_ids
    assert acct.id not in eligible_ids
