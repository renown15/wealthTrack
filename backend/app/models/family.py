"""Family model for grouping user accounts together."""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.family_member_account import FamilyMemberAccount


class Family(Base):
    """A named family group owned by one user profile."""

    __tablename__ = "Family"

    id: Mapped[int] = mapped_column("familyid", primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_id: Mapped[int] = mapped_column(
        "owningaccountid", Integer, ForeignKey("UserProfile.id"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    members: Mapped[list["FamilyMemberAccount"]] = relationship(
        "FamilyMemberAccount", back_populates="family", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Family(id={self.id}, name={self.name}, owner_id={self.owner_id})>"
