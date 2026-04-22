"""
ORM model for AccountEventAttributeGroup — groups related events and attributes
into a named transaction (e.g. a share sale).
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AccountEventAttributeGroup(Base):
    """Groups a set of AccountEvents and AccountAttributes into a named transaction."""

    __tablename__ = "AccountEventAttributeGroup"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        "userid", Integer, ForeignKey("UserProfile.id"), nullable=False, index=True
    )
    type_id: Mapped[int] = mapped_column(
        "typeid", Integer, ForeignKey("ReferenceData.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        return f"<AccountEventAttributeGroup(id={self.id}, type_id={self.type_id})>"
