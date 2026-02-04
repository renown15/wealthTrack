"""
Account model for user financial accounts.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, String, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Account(Base):
    """Account database model for user financial accounts."""

    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    userid: Mapped[int] = mapped_column(
        Integer, ForeignKey("user_profile.id"), nullable=False, index=True
    )
    institutionid: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("institutions.id"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    typeid: Mapped[int] = mapped_column(
        Integer, ForeignKey("reference_data.id"), nullable=False
    )
    statusid: Mapped[int] = mapped_column(
        Integer, ForeignKey("reference_data.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        return f"<Account(id={self.id}, userid={self.userid}, name={self.name})>"
