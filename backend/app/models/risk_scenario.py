"""RiskScenario model for portfolio risk planning scenarios."""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.risk_scenario_account_group import RiskScenarioAccountGroup


class RiskScenario(Base):
    """A named risk planning scenario owned by one user."""

    __tablename__ = "RiskScenario"

    id: Mapped[int] = mapped_column("scenarioid", primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        "userid", Integer, ForeignKey("UserProfile.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    groups: Mapped[list["RiskScenarioAccountGroup"]] = relationship(
        "RiskScenarioAccountGroup",
        back_populates="scenario",
        cascade="all, delete-orphan",
        order_by="RiskScenarioAccountGroup.sort_order",
    )

    def __repr__(self) -> str:
        return f"<RiskScenario(id={self.id}, user_id={self.user_id}, name={self.name})>"
