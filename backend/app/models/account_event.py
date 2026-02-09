"""
AccountEvent model for account activity log.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AccountEvent(Base):
    """AccountEvent database model for account activity log."""

    __tablename__ = "AccountEvent"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        "userid", Integer, ForeignKey("UserProfile.id"), nullable=False, index=True
    )
    account_id: Mapped[int] = mapped_column(
        "accountid", Integer, ForeignKey("Account.id"), nullable=False, index=True
    )
    type_id: Mapped[int] = mapped_column(
        "typeid", Integer, ForeignKey("ReferenceData.id"), nullable=False
    )
    value: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        return f"<AccountEvent(id={self.id}, account_id={self.account_id})>"
