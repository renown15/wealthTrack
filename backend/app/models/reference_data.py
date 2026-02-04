"""
ReferenceData model for extensible lookup tables.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ReferenceData(Base):
    """
    Single reference data table for all lookup types.

    The 'class_' field distinguishes between different types:
    - account_type: Savings, Current, Cash ISA, etc.
    - account_status: Active, Closed, Dormant
    - event_type: Balance Update, Opening Balance, etc.
    - credential_type: Username, Password, Security Question
    - user_type: Individual, Joint, etc.
    """

    __tablename__ = "reference_data"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    class_: Mapped[str] = mapped_column(
        "class", String(50), nullable=False, index=True
    )
    key: Mapped[str] = mapped_column(String(50), nullable=False)
    referencevalue: Mapped[str] = mapped_column(String(255), nullable=False)
    sortindex: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    __table_args__ = (
        Index("ix_reference_data_class_key", "class", "key"),
    )

    def __repr__(self) -> str:
        return (
            f"<ReferenceData(id={self.id}, class={self.class_}, "
            f"key={self.key}, value={self.referencevalue})>"
        )
