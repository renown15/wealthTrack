"""Handler for account attribute save/update operations."""
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.account_attribute_repository import AccountAttributeRepository
from app.repositories.account_event_repository import AccountEventRepository
from app.schemas.account import AccountCreate, AccountResponse, AccountUpdate
from app.services.account_event_service import AccountEventService
from app.types.attribute_types import validate_attribute_field as _validate_field

# Attribute names to load/save (snake_case shorthands)
ATTRIBUTE_FIELDS = [
    "account_number", "sort_code", "roll_ref_number", "interest_rate",
    "fixed_bonus_rate", "fixed_bonus_rate_end_date", "release_date",
    "number_of_shares", "underlying", "price", "purchase_price",
    "pension_monthly_payment", "asset_class", "encumbrance", "unencumbered_balance",
    "tax_year",
]


async def load_account_attributes(
    attr_repo: AccountAttributeRepository,
    account_id: int,
    user_id: int,
    response: AccountResponse,
) -> None:
    """Load all account attributes and populate response."""
    for field in ATTRIBUTE_FIELDS:
        value = await attr_repo.get_attribute_by_name(account_id, user_id, field)
        setattr(response, field, value)


async def save_account_attributes(
    attr_repo: AccountAttributeRepository,
    account_id: int,
    user_id: int,
    attribute_data: AccountCreate | AccountUpdate,
    session: AsyncSession | None = None,
) -> None:
    """Save account attributes on creation."""
    encumbrance = getattr(attribute_data, "encumbrance", None)

    for field in ATTRIBUTE_FIELDS:
        if field in ("encumbrance", "unencumbered_balance"):
            continue
        if hasattr(attribute_data, field):
            value = getattr(attribute_data, field, None)
            if value:
                _validate_field(field, str(value))
                await attr_repo.set_attribute_by_name(account_id, user_id, field, value)

    if encumbrance is not None and encumbrance != "" and session:
        _validate_field("encumbrance", str(encumbrance))
        enc_float = float(encumbrance)
        event_repo = AccountEventRepository(session)
        event_service = AccountEventService(session)
        events = await event_repo.list_events(account_id, user_id)
        if events:
            current_balance = float(events[0]["value"])
            await attr_repo.set_attribute_by_name(
                account_id, user_id, "unencumbered_balance", str(current_balance)
            )
            balance_update_type_id = await event_repo.get_event_type_id("Balance Update")
            if balance_update_type_id:
                await event_service.log_event(
                    user_id, account_id, balance_update_type_id, str(current_balance - enc_float)
                )
        await attr_repo.set_attribute_by_name(account_id, user_id, "encumbrance", encumbrance)


async def update_account_attributes(
    attr_repo: AccountAttributeRepository,
    account_id: int,
    user_id: int,
    attribute_data: AccountUpdate,
    session: AsyncSession | None = None,
) -> None:
    """Update account attributes with special handling for encumbrance."""
    new_encumbrance = getattr(attribute_data, "encumbrance", None)
    old_encumbrance = await attr_repo.get_attribute_by_name(account_id, user_id, "encumbrance")

    for field in ATTRIBUTE_FIELDS:
        if field in ("encumbrance", "unencumbered_balance"):
            continue
        if hasattr(attribute_data, field):
            value = getattr(attribute_data, field, None)
            if value is not None and value != "":
                _validate_field(field, str(value))
                await attr_repo.set_attribute_by_name(account_id, user_id, field, value)
            else:
                await attr_repo.delete_attribute_by_name(account_id, user_id, field)

    if new_encumbrance is None or new_encumbrance == "":
        if old_encumbrance is not None and session:
            await _handle_encumbrance_remove(attr_repo, account_id, user_id, session)
        elif old_encumbrance:
            await attr_repo.delete_attribute_by_name(account_id, user_id, "encumbrance")
    else:
        _validate_field("encumbrance", str(new_encumbrance))
        if old_encumbrance is None:
            if session:
                await _handle_encumbrance_set(attr_repo, account_id, user_id, new_encumbrance, session)
            else:
                await attr_repo.set_attribute_by_name(account_id, user_id, "encumbrance", new_encumbrance)
        else:
            new_gross = getattr(attribute_data, "new_gross_balance", None)
            if session:
                await _handle_encumbrance_change(
                    attr_repo, account_id, user_id, old_encumbrance, new_encumbrance, session, new_gross
                )
            else:
                await attr_repo.set_attribute_by_name(account_id, user_id, "encumbrance", new_encumbrance)


async def _handle_encumbrance_set(
    attr_repo: AccountAttributeRepository,
    account_id: int, user_id: int, encumbrance: str, session: AsyncSession,
) -> None:
    """Handle initial encumbrance SET: save unencumbered balance, create event."""
    try:
        enc_float = float(encumbrance)
        event_repo = AccountEventRepository(session)
        event_service = AccountEventService(session)
        events = await event_repo.list_events(account_id, user_id)
        if events and events[0].get("value"):
            original_balance = float(events[0]["value"])
            await attr_repo.set_attribute_by_name(
                account_id, user_id, "unencumbered_balance", str(original_balance)
            )
            balance_update_type_id = await event_repo.get_event_type_id("Balance Update")
            if balance_update_type_id:
                await event_service.log_event(
                    user_id, account_id, balance_update_type_id, str(original_balance - enc_float)
                )
        await attr_repo.set_attribute_by_name(account_id, user_id, "encumbrance", encumbrance)
    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid encumbrance value: {encumbrance}") from e


async def _handle_encumbrance_change(
    attr_repo: AccountAttributeRepository,
    account_id: int, user_id: int, old_encumbrance: str,
    new_encumbrance: str, session: AsyncSession, new_gross_balance: str | None = None,
) -> None:
    """Handle encumbrance CHANGE: use stored (or supplied) unencumbered balance, create event."""
    try:
        new_float = float(new_encumbrance)
        event_repo = AccountEventRepository(session)
        event_service = AccountEventService(session)
        if new_gross_balance is not None:
            original_balance = float(new_gross_balance)
            await attr_repo.set_attribute_by_name(
                account_id, user_id, "unencumbered_balance", str(original_balance)
            )
        else:
            unencumbered = await attr_repo.get_attribute_by_name(account_id, user_id, "unencumbered_balance")
            original_balance = float(unencumbered) if unencumbered else None  # type: ignore[assignment]
        if original_balance is not None:
            balance_update_type_id = await event_repo.get_event_type_id("Balance Update")
            if balance_update_type_id:
                await event_service.log_event(
                    user_id, account_id, balance_update_type_id, str(original_balance - new_float)
                )
        await attr_repo.set_attribute_by_name(account_id, user_id, "encumbrance", new_encumbrance)
    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid encumbrance change: {old_encumbrance} -> {new_encumbrance}") from e


async def _handle_encumbrance_remove(
    attr_repo: AccountAttributeRepository,
    account_id: int, user_id: int, session: AsyncSession,
) -> None:
    """Handle encumbrance REMOVE: restore original balance, delete attributes."""
    try:
        event_repo = AccountEventRepository(session)
        event_service = AccountEventService(session)
        unencumbered = await attr_repo.get_attribute_by_name(account_id, user_id, "unencumbered_balance")
        if unencumbered:
            balance_update_type_id = await event_repo.get_event_type_id("Balance Update")
            if balance_update_type_id:
                await event_service.log_event(
                    user_id, account_id, balance_update_type_id, str(float(unencumbered))
                )
        await attr_repo.delete_attribute_by_name(account_id, user_id, "encumbrance")
        await attr_repo.delete_attribute_by_name(account_id, user_id, "unencumbered_balance")
    except (ValueError, TypeError) as e:
        raise ValueError(f"Error removing encumbrance: {str(e)}") from e
