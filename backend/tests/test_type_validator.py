"""Tests for the startup type validator."""
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.type_validator import validate_types_against_db
from app.types.attribute_types import AttributeType
from app.types.event_types import EventType


def _make_session(attr_values: list[str], event_values: list[str]) -> AsyncMock:
    """Build a mock AsyncSession that returns the given reference values."""
    session = AsyncMock()

    def _result_for(values: list[str]) -> MagicMock:
        result = MagicMock()
        result.all.return_value = [(v,) for v in values]
        return result

    session.execute.side_effect = [
        _result_for(attr_values),
        _result_for(event_values),
    ]
    return session


class TestValidateTypesAgainstDb:
    @pytest.mark.asyncio
    async def test_passes_when_all_types_present(self):
        """No exception when every enum value exists in the mock DB."""
        attr_values = [str(at) for at in AttributeType]
        event_values = [str(et) for et in EventType]
        session = _make_session(attr_values, event_values)

        await validate_types_against_db(session)  # should not raise

        assert session.execute.call_count == 2

    @pytest.mark.asyncio
    async def test_raises_when_attribute_type_missing(self):
        """RuntimeError raised when an AttributeType value is absent."""
        attr_values = [str(at) for at in AttributeType if at != AttributeType.SORT_CODE]
        event_values = [str(et) for et in EventType]
        session = _make_session(attr_values, event_values)

        with pytest.raises(RuntimeError, match="Sort Code"):
            await validate_types_against_db(session)

    @pytest.mark.asyncio
    async def test_raises_when_event_type_missing(self):
        """RuntimeError raised when an EventType value is absent."""
        attr_values = [str(at) for at in AttributeType]
        event_values = [str(et) for et in EventType if et != EventType.WIN]
        session = _make_session(attr_values, event_values)

        with pytest.raises(RuntimeError, match="Win"):
            await validate_types_against_db(session)

    @pytest.mark.asyncio
    async def test_raises_listing_all_missing(self):
        """RuntimeError message includes every missing entry."""
        session = _make_session([], [])  # nothing present

        with pytest.raises(RuntimeError) as exc_info:
            await validate_types_against_db(session)

        msg = str(exc_info.value)
        assert "account_attribute_type" in msg
        assert "account_event_type" in msg

    @pytest.mark.asyncio
    async def test_raises_when_multiple_attribute_types_missing(self):
        """RuntimeError lists all missing attribute types."""
        attr_values = []  # none present
        event_values = [str(et) for et in EventType]
        session = _make_session(attr_values, event_values)

        with pytest.raises(RuntimeError) as exc_info:
            await validate_types_against_db(session)

        msg = str(exc_info.value)
        for at in AttributeType:
            assert str(at) in msg
