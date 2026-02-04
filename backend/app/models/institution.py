"""
Institution model for financial institutions.
"""
from datetime import datetime

from sqlalchemy import DateTime, String, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Institution(Base):
    """Institution database model for financial institutions."""

    __tablename__ = "institutions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    userid: Mapped[int] = mapped_column(
        Integer, ForeignKey("user_profile.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        return f"<Institution(id={self.id}, userid={self.userid}, name={self.name})>"
