"""
AccountDocument model — binary file attached directly to an account.
"""
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, LargeBinary, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.account import Account


class AccountDocument(Base):
    """Stores a binary document (e.g. photo, statement) for an account."""

    __tablename__ = "AccountDocument"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        "userid", Integer, ForeignKey("UserProfile.id"), nullable=False, index=True
    )
    account_id: Mapped[int] = mapped_column(
        "accountid", Integer, ForeignKey("Account.id"), nullable=False, index=True
    )
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    content_type: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    file_data: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    account: Mapped["Account"] = relationship("Account", foreign_keys=[account_id])

    def __repr__(self) -> str:
        return f"<AccountDocument id={self.id} account={self.account_id} file={self.filename!r}>"
