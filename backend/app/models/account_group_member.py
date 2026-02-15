"""
AccountGroupMember model for tracking which accounts belong to an AccountGroup.
"""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.account import Account
    from app.models.account_group import AccountGroup


class AccountGroupMember(Base):
    """AccountGroupMember database model for account group membership."""

    __tablename__ = "AccountGroupMember"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    account_group_id: Mapped[int] = mapped_column(
        "accountgroupid", Integer, ForeignKey("AccountGroup.accountgroupid"), nullable=False, index=True
    )
    account_id: Mapped[int] = mapped_column(
        "accountid", Integer, ForeignKey("Account.id"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    account_group: Mapped["AccountGroup"] = relationship(
        "AccountGroup", back_populates="members"
    )
    account: Mapped["Account"] = relationship("Account")

    def __repr__(self) -> str:
        return f"<AccountGroupMember(id={self.id}, account_group_id={self.account_group_id}, account_id={self.account_id})>"
