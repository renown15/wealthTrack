"""
TaxDocument model — binary file attached to a tax return.
"""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.tax_return import TaxReturn


class TaxDocument(Base):
    """Stores a binary tax certificate document for a given tax return."""

    __tablename__ = "TaxDocument"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        "userid", Integer, ForeignKey("UserProfile.id"), nullable=False, index=True
    )
    tax_return_id: Mapped[int] = mapped_column(
        "taxreturnid", Integer, ForeignKey("TaxReturn.id"), nullable=False, index=True
    )
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    content_type: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    file_data: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    tax_return: Mapped["TaxReturn"] = relationship("TaxReturn", back_populates="documents")

    def __repr__(self) -> str:
        return f"<TaxDocument(id={self.id}, filename={self.filename})>"
