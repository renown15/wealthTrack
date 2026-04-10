"""Startup validator: checks all enum type names exist in ReferenceData."""
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reference_data import ReferenceData
from app.types.attribute_types import AttributeType
from app.types.event_types import EventType

logger = logging.getLogger(__name__)


async def validate_types_against_db(session: AsyncSession) -> None:
    """Assert every AttributeType and EventType value exists in ReferenceData.

    Raises RuntimeError listing any missing values on startup so the issue
    surfaces immediately rather than silently failing at runtime.
    """
    attr_stmt = select(ReferenceData.reference_value).where(
        ReferenceData.class_key == "account_attribute_type"
    )
    event_stmt = select(ReferenceData.reference_value).where(
        ReferenceData.class_key == "account_event_type"
    )
    attr_result = await session.execute(attr_stmt)
    event_result = await session.execute(event_stmt)

    attr_values = {row[0] for row in attr_result.all()}
    event_values = {row[0] for row in event_result.all()}

    missing: list[str] = []
    for at in AttributeType:
        if str(at) not in attr_values:
            missing.append(f"account_attribute_type: '{at}'")
    for et in EventType:
        if str(et) not in event_values:
            missing.append(f"account_event_type: '{et}'")

    if missing:
        msg = "Type validation failed — missing ReferenceData rows:\n" + "\n".join(
            f"  - {m}" for m in missing
        )
        raise RuntimeError(msg)

    logger.info(
        "Type validation passed: %d attribute types, %d event types",
        len(AttributeType),
        len(EventType),
    )
