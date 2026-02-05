"""
UserProfile model for user account data - the primary user entity.
"""
from datetime import datetime
from typing import TYPE_CHECKING, Any, Optional

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.reference_data import ReferenceData


class UserProfile(Base):
    """
    User profile with personal details and encrypted password.

    Links to ReferenceData for user type classification.
    Email serves as the unique userid string for the application.
    """

    __tablename__ = "UserProfile"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    firstname: Mapped[str] = mapped_column(String(100), nullable=False)
    surname: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    profile: Mapped[Optional[dict[str, Any]]] = mapped_column(
        JSON, nullable=True
    )
    typeid: Mapped[int] = mapped_column(
        ForeignKey("ReferenceData.id"), nullable=False
    )
    password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(default=False, nullable=False)
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
            f"<UserProfile(id={self.id}, email={self.email}, "
            f"name={self.firstname} {self.surname})>"
        )
