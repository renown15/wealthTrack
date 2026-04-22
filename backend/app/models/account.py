"""
Account model for user financial accounts.
"""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.institution import Institution


class Account(Base):
    """Account database model for user financial accounts."""

    __tablename__ = "Account"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        "userid", Integer, ForeignKey("UserProfile.id"), nullable=False, index=True
    )
    institution_id: Mapped[Optional[int]] = mapped_column(
        "institutionid", Integer, ForeignKey("Institution.id"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type_id: Mapped[int] = mapped_column(
        "typeid", Integer, ForeignKey("ReferenceData.id"), nullable=False
    )
    status_id: Mapped[int] = mapped_column(
        "statusid", Integer, ForeignKey("ReferenceData.id"), nullable=False
    )
    asset_class: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    institution: Mapped[Optional["Institution"]] = relationship(
        "Institution", foreign_keys=[institution_id]
    )

    def __repr__(self) -> str:
        return f"<Account(id={self.id}, user_id={self.user_id}, name={self.name})>"
