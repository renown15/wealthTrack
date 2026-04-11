"""
ORM model for AccountEventAttributeGroupMember — links an event or attribute to a group.
"""
from typing import Optional

from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AccountEventAttributeGroupMember(Base):
    """Maps a single AccountEvent or AccountAttribute to an AccountEventAttributeGroup."""

    __tablename__ = "AccountEventAttributeGroupMember"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    group_id: Mapped[int] = mapped_column(
        "groupid",
        Integer,
        ForeignKey("AccountEventAttributeGroup.id"),
        nullable=False,
        index=True,
    )
    account_event_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("AccountEvent.id"), nullable=True
    )
    account_attribute_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("AccountAttribute.id"), nullable=True
    )

    def __repr__(self) -> str:
        return (
            f"<AccountEventAttributeGroupMember("
            f"id={self.id}, group_id={self.group_id}, "
            f"event_id={self.account_event_id}, attr_id={self.account_attribute_id})>"
        )
