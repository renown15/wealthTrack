"""Portfolio item building utilities."""

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.reference_data import ReferenceData
from app.schemas.account import AccountResponse
from app.schemas.institution import InstitutionResponse

# Maps ReferenceData.reference_value labels to shorthand keys used in attributes dict
_LABEL_TO_KEY: dict[str, str] = {
    "Account Opened Date": "opened_date",
    "Account Closed Date": "closed_date",
    "Account Number": "account_number",
    "Sort Code": "sort_code",
    "Roll / Ref Number": "roll_ref_number",
    "Interest Rate": "interest_rate",
    "Fixed Bonus Rate": "fixed_bonus_rate",
    "Fixed Bonus Rate End Date": "fixed_bonus_rate_end_date",
    "Release Date": "release_date",
    "Number of Shares": "number_of_shares",
    "Underlying": "underlying",
    "Price": "price",
    "Purchase Price": "purchase_price",
    "Pension Monthly Payment": "pension_monthly_payment",
    "Asset Class": "asset_class",
    "Encumbrance": "encumbrance",
    "Unencumbered Balance": "unencumbered_balance",
    "Tax Year": "tax_year",
}


async def fetch_target_prices(session: AsyncSession) -> dict[str, str]:
    """Fetch stock target reference prices keyed by ticker symbol."""
    rows = (
        await session.execute(
            select(ReferenceData.reference_value).where(
                ReferenceData.class_key == "stock_target_ref_price"
            )
        )
    ).scalars().all()
    return {r.split(":")[0].strip(): r.split(":")[1].strip() for r in rows if ":" in r}


def build_attributes_dict(raw: dict[str, str]) -> dict[str, Any]:
    """Convert raw {label: value} attribute map into the structured dict expected downstream."""
    keyed = {_LABEL_TO_KEY.get(k, k): v for k, v in raw.items()}
    return {
        "dates": {
            "openedAt": keyed.get("opened_date"),
            "closedAt": keyed.get("closed_date"),
        },
        "banking_details": {
            "accountNumber": keyed.get("account_number"),
            "sortCode": keyed.get("sort_code"),
            "rollRefNumber": keyed.get("roll_ref_number"),
        },
        "interest_rate": keyed.get("interest_rate"),
        "fixed_bonus_rate": keyed.get("fixed_bonus_rate"),
        "fixed_bonus_rate_end_date": keyed.get("fixed_bonus_rate_end_date"),
        "release_date": keyed.get("release_date"),
        "number_of_shares": keyed.get("number_of_shares"),
        "underlying": keyed.get("underlying"),
        "price": keyed.get("price"),
        "purchase_price": keyed.get("purchase_price"),
        "pension_monthly_payment": keyed.get("pension_monthly_payment"),
        "asset_class": keyed.get("asset_class"),
        "encumbrance": keyed.get("encumbrance"),
        "unencumbered_balance": keyed.get("unencumbered_balance"),
        "tax_year": keyed.get("tax_year"),
    }


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
    doc_count = portfolio_data.get("doc_count", 0)
    parents_by_institution: dict[int, Any] = portfolio_data.get("parents_by_institution", {})
    event_type_by_id: dict[int, str] = portfolio_data.get("event_type_by_id", {})
    target_prices_by_ticker: dict[str, str] = portfolio_data.get("target_prices_by_ticker", {})

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
    acct_data["assetClass"] = attrs.get("asset_class")
    acct_data["encumbrance"] = attrs.get("encumbrance")
    acct_data["taxYear"] = attrs.get("tax_year")
    underlying = attrs.get("underlying")
    acct_data["targetPrice"] = target_prices_by_ticker.get(underlying) if underlying else None

    inst_data = None
    if account.institution:
        inst_data = InstitutionResponse.model_validate(account.institution).model_dump(
            by_alias=True
        )
        parent = parents_by_institution.get(account.institution.id)
        if parent:
            inst_data["parentId"] = parent.parent_institution_id

    account_type = portfolio_data["account_type"]
    balance_data = None
    if latest_balance:
        bal = latest_balance
        event_type = event_type_by_id.get(bal.type_id, "Event")

        # Balance in AccountEvent is already adjusted if encumbrance was set
        # (it's the net balance created when encumbrance was applied)
        unencumbered_balance_str = attrs.get("unencumbered_balance")
        encumbrance_str = attrs.get("encumbrance")

        balance_data = {
            "id": bal.id,
            "accountId": bal.account_id,
            "userId": bal.user_id,
            "eventType": event_type,
            "value": bal.value,  # Use as-is (already net if encumbered)
            "grossBalance": unencumbered_balance_str,  # Store unencumbered for tooltip display
            "encumbrance": encumbrance_str,  # Store encumbrance for tooltip display
            "createdAt": bal.created_at.isoformat() if bal.created_at else None,
            "updatedAt": bal.updated_at.isoformat() if bal.updated_at else None,
        }

    # Negate balance for Tax Liability accounts (liability reduces net worth)
    if account_type == "Tax Liability" and balance_data and balance_data.get("value"):
        try:
            balance_data["value"] = str(-abs(float(str(balance_data["value"]))))
        except (ValueError, TypeError):
            pass

    return {
        "account": acct_data,
        "institution": inst_data,
        "latestBalance": balance_data,
        "accountType": account_type,
        "eventCount": event_count,
        "docCount": doc_count,
    }
