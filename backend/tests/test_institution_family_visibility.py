"""Family institution visibility — get_by_user_ids account widening + group parents.

Regression tests for the Pi bug where a child's accounts held at a parent's
institutions (e.g. a bare trust at the parent's bank) made those institutions
vanish from the child's institution list, along with group-parent institutions
that hold no accounts directly.
"""
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.institution import Institution
from app.models.institution_group import InstitutionGroup
from app.models.reference_data import ReferenceData
from app.models.user_profile import UserProfile
from app.repositories.institution_repository import InstitutionRepository


async def _ref(db_session: AsyncSession, class_key: str, value: str) -> ReferenceData:
    return (
        await db_session.execute(
            select(ReferenceData).where(
                ReferenceData.class_key == class_key, ReferenceData.reference_value == value
            )
        )
    ).scalar_one()


async def _make_user(db_session: AsyncSession, email: str) -> UserProfile:
    user_type = await _ref(db_session, "user_type", "User")
    child = UserProfile(
        first_name="Zed", last_name="Lewis", email=email,
        password="hashed", is_active=True, type_id=user_type.id,
    )
    db_session.add(child)
    await db_session.flush()
    return child


async def _add_account(
    db_session: AsyncSession, owner: UserProfile, institution: Institution, name: str
) -> None:
    acct_type = await _ref(db_session, "account_type", "Savings Account")
    acct_status = await _ref(db_session, "account_status", "Active")
    db_session.add(Account(
        user_id=owner.id, institution_id=institution.id,
        name=name, type_id=acct_type.id, status_id=acct_status.id,
    ))
    await db_session.flush()


@pytest.mark.asyncio
async def test_viewer_accounts_at_member_institution_count(
    db_session: AsyncSession, user: UserProfile
):
    """An institution owned by a family member shows when only the VIEWER banks there."""
    viewer = await _make_user(db_session, "viewer@example.com")
    metro = Institution(user_id=user.id, name="Metro Bank")
    db_session.add(metro)
    await db_session.flush()
    # The viewer's bare trust is the only account at the member's institution.
    await _add_account(db_session, viewer, metro, "Bare Trust")

    repo = InstitutionRepository(db_session)
    # Old behaviour (accounts of members only): institution invisible to the viewer.
    without = await repo.get_by_user_ids([user.id])
    assert "Metro Bank" not in {i.name for i in without}
    # Widened to include the viewer's own accounts: institution visible.
    widened = await repo.get_by_user_ids([user.id], account_owner_ids=[user.id, viewer.id])
    assert "Metro Bank" in {i.name for i in widened}


@pytest.mark.asyncio
async def test_group_parents_of_matched_institutions_included(
    db_session: AsyncSession, user: UserProfile
):
    """A group-parent institution with no direct accounts rides in with its child."""
    parent = Institution(user_id=user.id, name="Lloyds Bank")
    child = Institution(user_id=user.id, name="Halifax")
    unrelated = Institution(user_id=user.id, name="Empty Unrelated Bank")
    db_session.add_all([parent, child, unrelated])
    await db_session.flush()
    db_session.add(InstitutionGroup(
        user_id=user.id, parent_institution_id=parent.id, child_institution_id=child.id,
    ))
    await _add_account(db_session, user, child, "Halifax Savings")

    repo = InstitutionRepository(db_session)
    names = {i.name for i in await repo.get_by_user_ids([user.id])}
    assert "Halifax" in names
    assert "Lloyds Bank" in names
    assert "Empty Unrelated Bank" not in names
