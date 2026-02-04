"""
AccountAttribute model for custom account attributes.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, String, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AccountAttribute(Base):
    """AccountAttribute database model for custom account attributes."""

    __tablename__ = "account_attributes"

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
        return f"<AccountAttribute(id={self.id}, accountid={self.accountid})>"
