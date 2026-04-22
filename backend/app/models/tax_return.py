"""
TaxReturn model — per-account data for a given tax period.
"""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.tax_document import TaxDocument
    from app.models.tax_period import TaxPeriod


class TaxReturn(Base):
    """Stores income, capital gain and tax taken off for one account in one period."""

    __tablename__ = "TaxReturn"
    __table_args__ = (
        UniqueConstraint(
            "userid",
            "accountid",
            "taxperiodid",
            name="uq_tax_return_user_account_period",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        "userid", Integer, ForeignKey("UserProfile.id"), nullable=False, index=True
    )
    account_id: Mapped[int] = mapped_column(
        "accountid", Integer, ForeignKey("Account.id"), nullable=False, index=True
    )
    tax_period_id: Mapped[int] = mapped_column(
        "taxperiodid", Integer, ForeignKey("TaxPeriod.id"), nullable=False, index=True
    )
    income: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    capital_gain: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    tax_taken_off: Mapped[Optional[float]] = mapped_column(Numeric(15, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    period: Mapped["TaxPeriod"] = relationship("TaxPeriod", back_populates="returns")
    documents: Mapped[list["TaxDocument"]] = relationship(
        "TaxDocument", back_populates="tax_return", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<TaxReturn(id={self.id}, account_id={self.account_id})>"
