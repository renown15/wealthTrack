"""Portfolio item building utilities."""

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reference_data import ReferenceData
from app.schemas.account import AccountResponse
from app.schemas.institution import InstitutionResponse


async def build_portfolio_item(
    portfolio_data: dict[str, Any], session: AsyncSession
) -> dict[str, Any]:
    """Build portfolio item from account and related data."""
    account = portfolio_data["account"]
    account_type = portfolio_data["account_type"]
    attributes = portfolio_data["attributes"]
    latest_balance = portfolio_data["latest_balance"]
    event_count = portfolio_data["event_count"]

    acct_data = AccountResponse.model_validate(account).model_dump(by_alias=True)
    attrs = attributes
    acct_data["openedAt"] = attrs["dates"].get("openedAt")
    acct_data["closedAt"] = attrs["dates"].get("closedAt")
    acct_data["accountNumber"] = attrs["banking_details"].get("accountNumber")
    acct_data["sortCode"] = attrs["banking_details"].get("sortCode")
    acct_data["rollRefNumber"] = attrs["banking_details"].get("rollRefNumber")
    acct_data["interestRate"] = attrs["interest_rate"]
    acct_data["fixedBonusRate"] = attrs["fixed_bonus_rate"]
    acct_data["fixedBonusRateEndDate"] = attrs["fixed_bonus_rate_end_date"]
    acct_data["releaseDate"] = attrs["release_date"]
    acct_data["numberOfShares"] = attrs["number_of_shares"]
    acct_data["underlying"] = attrs["underlying"]
    acct_data["price"] = attrs["price"]
    acct_data["purchasePrice"] = attrs["purchase_price"]

    inst_data = None
    if account.institution:
        inst_data = InstitutionResponse.model_validate(
            account.institution
        ).model_dump(by_alias=True)
        from app.repositories.institution_group_repository import (
            InstitutionGroupRepository,
        )

        grp_repo = InstitutionGroupRepository(session)
        parent = await grp_repo.get_parent_for_child(
            account.institution.id, account.user_id
        )
        if parent:
            inst_data["parentId"] = parent.parent_institution_id

    balance_data = None
    if latest_balance:
        bal = latest_balance
        type_stmt = select(ReferenceData.reference_value).where(
            ReferenceData.id == bal.type_id
        )
        type_result = await session.execute(type_stmt)
        event_type = type_result.scalar_one_or_none() or "Event"
        balance_data = {
            "id": bal.id,
            "accountId": bal.account_id,
            "userId": bal.user_id,
            "eventType": event_type,
            "value": bal.value,
            "createdAt": bal.created_at.isoformat() if bal.created_at else None,
            "updatedAt": bal.updated_at.isoformat() if bal.updated_at else None,
        }

    return {
        "account": acct_data,
        "institution": inst_data,
        "latestBalance": balance_data,
        "accountType": account_type,
        "eventCount": event_count,
    }
