"""Typed enumeration for account event types."""
from enum import StrEnum
from typing import Literal

EventValueType = Literal["number"]


class EventType(StrEnum):
    """Account event type names matching ReferenceData.reference_value."""

    BALANCE_UPDATE = "Balance Update"
    WIN = "Win"
    DEPOSIT = "Deposit"
    WITHDRAWAL = "Withdrawal"
    INTEREST = "Interest"
    DIVIDEND = "Dividend"
    FEE = "Fee"
    TAX = "Tax"
    CAPITAL_GAINS_TAX = "Capital Gains Tax"

    @property
    def value_type(self) -> EventValueType:
        """All event values are numeric."""
        return "number"
