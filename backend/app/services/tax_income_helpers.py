"""Tax calculations for savings-type interest income.

Shares are taxed at transaction time (CGT stored per sale) and dividends at a
fixed provision. Savings interest has no transaction moment, so its tax is
derived on the fly at Tax Hub load: tax_due = income × rate, where `rate` is the
highest-band rate held in ReferenceData (class key ``savings_tax_rate``).
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.reference_data import ReferenceData
from app.models.tax_return import TaxReturn
from app.repositories.tax_return_repository import TaxReturnRepository
from app.services.tax_service_helpers import TAX_FREE_TYPES

_DEFAULT_SAVINGS_RATE = 45.0  # highest UK income-tax band; overridable via ReferenceData
_DEFAULT_DIVIDEND_RATE = 40.0  # higher-rate dividend provision; overridable via ReferenceData


async def _get_rate(session: AsyncSession, class_key: str, default: float) -> float:
    stmt = select(ReferenceData.reference_value).where(ReferenceData.class_key == class_key)
    rate = (await session.execute(stmt)).scalar_one_or_none()
    return float(rate) if rate is not None else default


async def get_savings_tax_rate(session: AsyncSession) -> float:
    """Highest-rate tax (%) applied to savings interest income; from ReferenceData."""
    return await _get_rate(session, "savings_tax_rate", _DEFAULT_SAVINGS_RATE)


async def get_dividend_tax_rate(session: AsyncSession) -> float:
    """Dividend tax provision (%) shown per share account in the Tax Hub; from ReferenceData."""
    return await _get_rate(session, "dividend_tax_rate", _DEFAULT_DIVIDEND_RATE)


async def resolve_savings_return(
    session: AsyncSession,
    return_repo: TaxReturnRepository,
    user_id: int,
    account: Account,
    tax_period_id: int,
    account_type: str,
) -> TaxReturn:
    """Get/create the return and set tax_due = income × savings rate for taxable types.

    Tax-free types (ISAs, pensions) never accrue tax_due. Recomputed each load, so
    clearing the income clears the tax; users never enter tax_due directly.
    """
    tax_return = await return_repo.get_or_create(user_id, account.id, tax_period_id)
    if tax_return is not None and account_type not in TAX_FREE_TYPES:
        income = tax_return.income  # ORM Numeric → Decimal; coerce for the float rate
        rate = await get_savings_tax_rate(session)
        tax_return.tax_due = round(float(income) * rate / 100, 2) if income else None
    return tax_return
