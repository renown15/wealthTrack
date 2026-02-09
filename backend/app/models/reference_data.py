"""
ReferenceData model for extensible lookup tables.
"""
from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ReferenceData(Base):
    """
    Single reference data table for all lookup types.

    The 'classkey' field contains "class:key" format distinguishing between different types:
    - account_type: Savings, Current, Cash ISA, etc.
    - account_status: Active, Closed, Dormant
    - event_type: Balance Update, Opening Balance, etc.
    - credential_type: Username, Password, Security Question
    - user_type: Individual, Joint, etc.
    """

    __tablename__ = "ReferenceData"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    class_key: Mapped[str] = mapped_column("classkey", String(100), nullable=False, index=True)
    reference_value: Mapped[str] = mapped_column("referencevalue", String(255), nullable=False)
    sort_index: Mapped[int] = mapped_column("sortindex", Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    __table_args__ = (
        Index("ix_reference_data_classkey", "classkey"),
    )

    def __repr__(self) -> str:
        return (
            f"<ReferenceData(id={self.id}, class_key={self.class_key}, "
            f"value={self.reference_value})>"
        )
