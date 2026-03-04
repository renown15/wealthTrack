"""Portfolio item building utilities."""

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.account import AccountResponse
from app.schemas.institution import InstitutionResponse


async def build_portfolio_item(
    portfolio_data: dict[str, Any], _session: AsyncSession
) -> dict[str, Any]:
    """Build portfolio item from account and pre-loaded related data.

    Expects portfolio_data to include pre-loaded lookup dicts:
      - parents_by_institution: dict[institution_id, InstitutionGroup]
      - event_type_by_id: dict[type_id, reference_value]
    No DB queries are made here.
    """
    account = portfolio_data["account"]
    account_type = portfolio_data["account_type"]
    attributes = portfolio_data["attributes"]
    latest_balance = portfolio_data["latest_balance"]
    event_count = portfolio_data["event_count"]
    parents_by_institution: dict[int, Any] = portfolio_data.get("parents_by_institution", {})
    event_type_by_id: dict[int, str] = portfolio_data.get("event_type_by_id", {})

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
    acct_data["pensionMonthlyPayment"] = attrs.get("pension_monthly_payment")

    inst_data = None
    if account.institution:
        inst_data = InstitutionResponse.model_validate(
            account.institution
        ).model_dump(by_alias=True)
        parent = parents_by_institution.get(account.institution.id)
        if parent:
            inst_data["parentId"] = parent.parent_institution_id

    balance_data = None
    if latest_balance:
        bal = latest_balance
        event_type = event_type_by_id.get(bal.type_id, "Event")
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
