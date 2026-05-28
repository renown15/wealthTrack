"""FamilyMemberAccount model linking user profiles to families."""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.family import Family
    from app.models.user_profile import UserProfile


class FamilyMemberAccount(Base):
    """Tracks which user accounts belong to a Family."""

    __tablename__ = "FamilyMemberAccount"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    family_id: Mapped[int] = mapped_column(
        "familyid", Integer, ForeignKey("Family.familyid"), nullable=False, index=True
    )
    account_id: Mapped[int] = mapped_column(
        "accountid", Integer, ForeignKey("UserProfile.id"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    family: Mapped["Family"] = relationship("Family", back_populates="members")
    member: Mapped["UserProfile"] = relationship("UserProfile", foreign_keys=[account_id])

    def __repr__(self) -> str:
        return (
            f"<FamilyMemberAccount(id={self.id}, family_id={self.family_id}, "
            f"account_id={self.account_id})>"
        )
