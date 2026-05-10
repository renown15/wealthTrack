"""Service for account close-and-transfer operations."""
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reference_data import ReferenceData
from app.repositories.account_attribute_repository import AccountAttributeRepository
from app.repositories.account_event_repository import AccountEventRepository
from app.repositories.account_repository import AccountRepository
from app.services.account_service import AccountService


async def close_and_transfer(
    source_id: int,
    target_id: int,
    user_id: int,
    session: AsyncSession,
) -> None:
    """Close source account and transfer its balance to target account.

    Creates Withdrawal + Balance Update (0) events on source, and
    Deposit + Balance Update events on target with the combined balance.
    """
    if source_id == target_id:
        raise ValueError("Cannot transfer to the same account")

    account_repo = AccountRepository(session)

    source = await account_repo.get_by_id(source_id, user_id)
    if not source:
        raise ValueError("Source account not found")
    target = await account_repo.get_by_id(target_id, user_id)
    if not target:
        raise ValueError("Target account not found")
    event_repo = AccountEventRepository(session)
    source_balance_str = await event_repo.get_latest_balance_update(source_id, user_id) or "0"
    source_balance = Decimal(source_balance_str)

    closed_stmt = select(ReferenceData.id).where(
        ReferenceData.class_key == "account_status",
        ReferenceData.reference_value == "Closed",
    )
    closed_status_id = (await session.execute(closed_stmt)).scalar_one_or_none()
    if not closed_status_id:
        raise ValueError("Closed status not found in reference data")

    account_service = AccountService(session)
    await account_service.update(source_id, user_id, status_id=closed_status_id)

    attr_repo = AccountAttributeRepository(session)
    today = datetime.now().strftime("%d/%m/%Y")
    await attr_repo.set_attribute_by_name(source_id, user_id, "closed_date", today)

    withdrawal_type_id = await event_repo.get_event_type_id("withdrawal")
    balance_type_id = await event_repo.get_event_type_id("balance")
    deposit_type_id = await event_repo.get_event_type_id("deposit")

    if not withdrawal_type_id or not balance_type_id or not deposit_type_id:
        raise ValueError("Required event types not found in reference data")

    await event_repo.create_event(source_id, user_id, withdrawal_type_id, str(source_balance))
    await event_repo.create_event(source_id, user_id, balance_type_id, "0")

    target_balance_str = await event_repo.get_latest_balance_update(target_id, user_id) or "0"
    new_target_balance = Decimal(target_balance_str) + source_balance

    await event_repo.create_event(target_id, user_id, deposit_type_id, str(source_balance))
    await event_repo.create_event(target_id, user_id, balance_type_id, str(new_target_balance))
