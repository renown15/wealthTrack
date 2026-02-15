"""
InstitutionGroup model for hierarchical institution relationships.
"""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class InstitutionGroup(Base):
    """InstitutionGroup database model for parent-child institution relationships."""

    __tablename__ = "InstitutionGroup"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        "userid", Integer, ForeignKey("UserProfile.id"), nullable=False, index=True
    )
    parent_institution_id: Mapped[int] = mapped_column(
        "parentinstitutionid", Integer, ForeignKey("Institution.id"), nullable=False, index=True
    )
    child_institution_id: Mapped[int] = mapped_column(
        "childinstitutionid", Integer, ForeignKey("Institution.id"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    def __repr__(self) -> str:
        return (
            f"<InstitutionGroup("
            f"id={self.id}, "
            f"parent={self.parent_institution_id}, "
            f"child={self.child_institution_id})>"
        )
