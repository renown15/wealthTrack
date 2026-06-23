"""RiskScenarioAccountGroup — links an AccountGroup to a RiskScenario."""
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.account_group import AccountGroup
    from app.models.risk_scenario import RiskScenario


class RiskScenarioAccountGroup(Base):
    """Join between RiskScenario and AccountGroup, with ordering."""

    __tablename__ = "RiskScenarioAccountGroup"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    scenario_id: Mapped[int] = mapped_column(
        "scenarioid", Integer, ForeignKey("RiskScenario.scenarioid", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    account_group_id: Mapped[int] = mapped_column(
        "accountgroupid", Integer,
        ForeignKey("AccountGroup.accountgroupid", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    sort_order: Mapped[int] = mapped_column("sortorder", Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    scenario: Mapped["RiskScenario"] = relationship("RiskScenario", back_populates="groups")
    account_group: Mapped["AccountGroup"] = relationship(
        "AccountGroup",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return (
            f"<RiskScenarioAccountGroup(id={self.id}, scenario_id={self.scenario_id}, "
            f"account_group_id={self.account_group_id})>"
        )
