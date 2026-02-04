"""
UserProfile model for user account data.
"""
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserProfile(Base):
    """
    User profile with personal details and encrypted password.

    Links to ReferenceData for user type classification.
    """

    __tablename__ = "user_profile"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    firstname: Mapped[str] = mapped_column(String(100), nullable=False)
    surname: Mapped[str] = mapped_column(String(100), nullable=False)
    emailaddress: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    profile: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )
    typeid: Mapped[int] = mapped_column(
        ForeignKey("reference_data.id"), nullable=False
    )
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationship to ReferenceData for user type
    user_type: Mapped["ReferenceData"] = relationship(
        "ReferenceData", foreign_keys=[typeid]
    )

    def __repr__(self) -> str:
        return (
            f"<UserProfile(id={self.id}, email={self.emailaddress}, "
            f"name={self.firstname} {self.surname})>"
        )
