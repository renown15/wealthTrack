"""
InstitutionSecurityCredentials model for encrypted API credentials.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class InstitutionSecurityCredentials(Base):
    """InstitutionSecurityCredentials model for encrypted institution credentials."""

    __tablename__ = "institution_security_credentials"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    userid: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
    institutionid: Mapped[int] = mapped_column(
        Integer, ForeignKey("institutions.id"), nullable=False, index=True
    )
    typeid: Mapped[int] = mapped_column(
        Integer, ForeignKey("reference_data.id"), nullable=False
    )
    key: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    value: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        return f"<InstitutionSecurityCredentials(id={self.id}, institutionid={self.institutionid})>"
