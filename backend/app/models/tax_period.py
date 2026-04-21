"""
TaxPeriod model — a named date range for tax return management.
"""
from datetime import date, datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.account_group import AccountGroup
    from app.models.tax_return import TaxReturn


class TaxPeriod(Base):
    """Represents a named tax period (e.g. '2023/24') with start and end dates."""

    __tablename__ = "TaxPeriod"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        "userid", Integer, ForeignKey("UserProfile.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    account_group_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("AccountGroup.accountgroupid", ondelete="SET NULL"),
        nullable=True, index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    returns: Mapped[list["TaxReturn"]] = relationship(
        "TaxReturn", back_populates="period", cascade="all, delete-orphan"
    )
    account_group: Mapped[Optional["AccountGroup"]] = relationship(
        "AccountGroup", foreign_keys=[account_group_id]
    )

    def __repr__(self) -> str:
        return f"<TaxPeriod(id={self.id}, name={self.name})>"
