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

    __tablename__ = "account_events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    userid: Mapped[int] = mapped_column(
        Integer, ForeignKey("user_profile.id"), nullable=False, index=True
    )
    accountid: Mapped[int] = mapped_column(
        Integer, ForeignKey("accounts.id"), nullable=False, index=True
    )
    typeid: Mapped[int] = mapped_column(
        Integer, ForeignKey("reference_data.id"), nullable=False
    )
    value: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        return f"<AccountEvent(id={self.id}, accountid={self.accountid})>"
