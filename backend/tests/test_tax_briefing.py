"""Service + controller tests for the tax briefing pack endpoint."""
from datetime import date

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reference_data import ReferenceData
from app.models.user_profile import UserProfile
from app.repositories.account_group_repository import AccountGroupRepository
from app.repositories.family_repository import FamilyRepository
from app.repositories.tax_period_repository import TaxPeriodRepository
from app.services.tax_briefing_service import (
    BriefingAuthError,
    authorize_target,
    generate_briefing_pack,
)


async def _make_user(db_session: AsyncSession, email: str) -> UserProfile:
    user_type = (await db_session.execute(
        select(ReferenceData).where(
            ReferenceData.class_key == "user_type", ReferenceData.reference_value == "User"
        )
    )).scalar_one()
    other = UserProfile(first_name="Peer", last_name="Person", email=email,
                        password="hashed", is_active=True, type_id=user_type.id)
    db_session.add(other)
    await db_session.flush()
    await db_session.refresh(other)
    return other


async def _make_period(db_session: AsyncSession, user_id: int, name: str = "2025/26") -> int:
    group = await AccountGroupRepository(db_session).create(user_id, f"Tax Period: {name}")
    period = await TaxPeriodRepository(db_session).create(
        user_id, name, date(2025, 4, 6), date(2026, 4, 5), account_group_id=group.id
    )
    await db_session.commit()
    return period.id


@pytest.mark.asyncio
async def test_authorize_target_allows_self(db_session: AsyncSession, user: UserProfile):
    await authorize_target(db_session, user.id, user.id)  # no raise


@pytest.mark.asyncio
async def test_authorize_target_allows_family_member(db_session: AsyncSession, user: UserProfile):
    peer = await _make_user(db_session, "peer@example.com")
    repo = FamilyRepository(db_session)
    family = await repo.create("Family", user.id)
    await repo.add_member(family.id, peer.id)
    await db_session.commit()
    await authorize_target(db_session, user.id, peer.id)  # no raise


@pytest.mark.asyncio
async def test_authorize_target_rejects_stranger(db_session: AsyncSession, user: UserProfile):
    stranger = await _make_user(db_session, "stranger@example.com")
    await db_session.commit()
    with pytest.raises(BriefingAuthError):
        await authorize_target(db_session, user.id, stranger.id)


@pytest.mark.asyncio
async def test_generate_briefing_pack_returns_pdf(db_session: AsyncSession, user: UserProfile):
    period_id = await _make_period(db_session, user.id)
    pdf, filename = await generate_briefing_pack(db_session, user.id, user.id, period_id)
    assert pdf[:5] == b"%PDF-"
    assert filename.endswith(".pdf")
    assert "2025-26" in filename


@pytest.mark.asyncio
async def test_briefing_pack_endpoint_returns_pdf(
    client: AsyncClient, db_session: AsyncSession, user: UserProfile,
    authenticated_headers: dict[str, str],
):
    period_id = await _make_period(db_session, user.id)
    resp = await client.get(
        f"/api/v1/tax/briefing-pack?period_id={period_id}", headers=authenticated_headers
    )
    assert resp.status_code == status.HTTP_200_OK
    assert resp.headers["content-type"] == "application/pdf"
    assert resp.content[:5] == b"%PDF-"


@pytest.mark.asyncio
async def test_briefing_pack_endpoint_404_for_unknown_period(
    client: AsyncClient, user: UserProfile, authenticated_headers: dict[str, str],
):
    resp = await client.get(
        "/api/v1/tax/briefing-pack?period_id=999999", headers=authenticated_headers
    )
    assert resp.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_briefing_pack_endpoint_403_for_stranger(
    client: AsyncClient, db_session: AsyncSession, user: UserProfile,
    authenticated_headers: dict[str, str],
):
    stranger = await _make_user(db_session, "stranger2@example.com")
    period_id = await _make_period(db_session, stranger.id)
    resp = await client.get(
        f"/api/v1/tax/briefing-pack?period_id={period_id}&member_id={stranger.id}",
        headers=authenticated_headers,
    )
    assert resp.status_code == status.HTTP_403_FORBIDDEN
