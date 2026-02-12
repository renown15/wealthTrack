"""
InstitutionSecurityCredentials model for encrypted API credentials.
"""
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.utils.encryption import decrypt_value, encrypt_value


class InstitutionSecurityCredentials(Base):
    """InstitutionSecurityCredentials model for encrypted institution credentials."""

    __tablename__ = "InstitutionSecurityCredentials"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        "userid", Integer, ForeignKey("UserProfile.id"), nullable=False, index=True
    )
    institution_id: Mapped[int] = mapped_column(
        "institutionid", Integer, ForeignKey("Institution.id"), nullable=False, index=True
    )
    type_id: Mapped[int] = mapped_column(
        "typeid", Integer, ForeignKey("ReferenceData.id"), nullable=False
    )
    key_encrypted: Mapped[Optional[str]] = mapped_column(
        "key", String(1000), nullable=True
    )
    value_encrypted: Mapped[Optional[str]] = mapped_column(
        "value", String(2000), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    @property
    def key(self) -> Optional[str]:
        """Decrypt and return the key."""
        if self.key_encrypted:
            return decrypt_value(self.key_encrypted)
        return None

    @key.setter
    def key(self, value: Optional[str]) -> None:
        """Encrypt and set the key."""
        if value:
            self.key_encrypted = encrypt_value(value)
        else:
            self.key_encrypted = None

    @property
    def value(self) -> Optional[str]:
        """Decrypt and return the value."""
        if self.value_encrypted:
            return decrypt_value(self.value_encrypted)
        return None

    @value.setter
    def value(self, val: Optional[str]) -> None:
        """Encrypt and set the value."""
        if val:
            self.value_encrypted = encrypt_value(val)
        else:
            self.value_encrypted = None

    def __repr__(self) -> str:
        inst_id = self.institution_id
        return f"<InstitutionSecurityCredentials(id={self.id}, institution_id={inst_id})>"
