"""Business logic for family management."""
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.family import Family
from app.repositories.family_repository import FamilyRepository
from app.schemas.family import FamilyMemberResponse, FamilyResponse, UserSummaryResponse


class FamilyService:
    """Service layer for family operations with ownership enforcement."""

    def __init__(self, session: AsyncSession):
        self.repo = FamilyRepository(session)

    def _build_response(self, family: Family, current_user_id: int) -> FamilyResponse:
        members = [
            FamilyMemberResponse(
                id=m.id,
                account_id=m.account_id,
                first_name=m.member.first_name,
                last_name=m.member.last_name,
                email=m.member.email,
            )
            for m in family.members
        ]
        return FamilyResponse(
            id=family.id,
            name=family.name,
            owner_id=family.owner_id,
            is_owner=(family.owner_id == current_user_id),
            members=members,
            created_at=family.created_at,
            updated_at=family.updated_at,
        )

    async def get_families(self, user_id: int) -> list[FamilyResponse]:
        families = await self.repo.get_families_for_user(user_id)
        return [self._build_response(f, user_id) for f in families]

    async def create_family(self, name: str, owner_id: int) -> FamilyResponse:
        if await self.repo.get_owned_family(owner_id):
            raise ValueError("You already own a family")
        family = await self.repo.create(name, owner_id)
        return self._build_response(family, owner_id)

    async def rename_family(
        self, family_id: int, name: str, user_id: int
    ) -> Optional[FamilyResponse]:
        family = await self.repo.get_by_id(family_id)
        if not family:
            return None
        if family.owner_id != user_id:
            raise PermissionError("Only the owner can rename the family")
        family = await self.repo.update_name(family_id, name)
        return self._build_response(family, user_id)

    async def delete_family(self, family_id: int, user_id: int) -> bool:
        family = await self.repo.get_by_id(family_id)
        if not family:
            return False
        if family.owner_id != user_id:
            raise PermissionError("Only the owner can delete the family")
        await self.repo.delete(family_id)
        return True

    async def add_member(
        self, family_id: int, account_id: int, user_id: int
    ) -> Optional[FamilyResponse]:
        family = await self.repo.get_by_id(family_id)
        if not family:
            return None
        if family.owner_id != user_id:
            raise PermissionError("Only the owner can add members")
        if account_id == user_id:
            raise ValueError("Cannot add yourself — you are already the owner")
        await self.repo.add_member(family_id, account_id)
        family = await self.repo.get_by_id(family_id)
        return self._build_response(family, user_id)  # type: ignore[arg-type]

    async def remove_member(
        self, family_id: int, member_id: int, user_id: int
    ) -> Optional[FamilyResponse]:
        family = await self.repo.get_by_id(family_id)
        if not family:
            return None
        if family.owner_id != user_id:
            raise PermissionError("Only the owner can remove members")
        if member_id == user_id:
            raise ValueError("Cannot remove yourself from your own family")
        await self.repo.remove_member(family_id, member_id)
        family = await self.repo.get_by_id(family_id)
        return self._build_response(family, user_id)  # type: ignore[arg-type]

    async def get_available_members(
        self, family_id: int, user_id: int
    ) -> Optional[list[UserSummaryResponse]]:
        if not await self.repo.is_member(family_id, user_id):
            raise PermissionError("Not a member of this family")
        users = await self.repo.get_available_members(family_id)
        return [UserSummaryResponse.from_orm(u) for u in users]

    async def verify_membership(self, family_id: int, member_id: int, user_id: int) -> bool:
        """Confirm both users are members of the same family."""
        return await self.repo.is_member(family_id, user_id) and await self.repo.is_member(
            family_id, member_id
        )
