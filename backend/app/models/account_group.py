"""
AccountGroup model for grouping similar accounts together.
"""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.account_group_member import AccountGroupMember


class AccountGroup(Base):
    """AccountGroup database model for grouping related accounts."""

    __tablename__ = "AccountGroup"

    id: Mapped[int] = mapped_column("accountgroupid", primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        "userid", Integer, ForeignKey("UserProfile.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    members: Mapped[list["AccountGroupMember"]] = relationship(
        "AccountGroupMember", back_populates="account_group", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<AccountGroup(id={self.id}, user_id={self.user_id}, name={self.name})>"
