#!/usr/bin/env python3
"""Restore account data from screenshot backup.

Run with:
    python scripts/restore-data.py

Requires a user to exist in the database first (sign up via the UI).
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from datetime import datetime

from app.models.account import Account
from app.models.account_attribute import AccountAttribute
from app.models.account_event import AccountEvent
from app.models.institution import Institution
from app.models.reference_data import ReferenceData
from app.models.user_profile import UserProfile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://wealthtrack:wealthtrack_dev_password@localhost:5433/wealthtrack",
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_ref_cache: dict[tuple[str, str], int] = {}


async def ref_id(session: AsyncSession, classkey: str, value: str) -> int:
    key = (classkey, value)
    if key not in _ref_cache:
        result = await session.execute(
            select(ReferenceData).where(
                ReferenceData.class_key == classkey,
                ReferenceData.reference_value == value,
            )
        )
        row = result.scalar_one_or_none()
        if not row:
            raise ValueError(f"ReferenceData not found: {classkey!r} / {value!r}")
        _ref_cache[key] = row.id
    return _ref_cache[key]


async def get_or_create_institution(
    session: AsyncSession, user_id: int, name: str, inst_type: str
) -> Institution:
    result = await session.execute(
        select(Institution).where(
            Institution.user_id == user_id,
            Institution.name == name,
        )
    )
    inst = result.scalar_one_or_none()
    if inst:
        return inst
    inst = Institution(user_id=user_id, name=name, institution_type=inst_type)
    session.add(inst)
    await session.flush()
    await session.refresh(inst)
    return inst


async def make_account(
    session: AsyncSession,
    user_id: int,
    institution_id: int,
    name: str,
    acc_type: str,
    balance: float | None,
    attrs: dict[str, str],
) -> None:
    type_id = await ref_id(session, "account_type", acc_type)
    status_id = await ref_id(session, "account_status", "Active")

    acc = Account(
        user_id=user_id,
        institution_id=institution_id,
        name=name,
        type_id=type_id,
        status_id=status_id,
    )
    session.add(acc)
    await session.flush()
    await session.refresh(acc)

    for attr_name, attr_value in attrs.items():
        if not attr_value:
            continue
        try:
            attr_type_id = await ref_id(session, "account_attribute_type", attr_name)
        except ValueError:
            print(f"    WARNING: attribute type not found: {attr_name!r} — skipped")
            continue
        attr = AccountAttribute(
            user_id=user_id,
            account_id=acc.id,
            type_id=attr_type_id,
            value=str(attr_value),
        )
        session.add(attr)

    if balance is not None:
        event_type_id = await ref_id(session, "account_event_type", "Balance Update")
        event = AccountEvent(
            user_id=user_id,
            account_id=acc.id,
            type_id=event_type_id,
            value=str(balance),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        session.add(event)

    await session.flush()
    print(f"    ✓ {name}")


# ---------------------------------------------------------------------------
# Main restore
# ---------------------------------------------------------------------------

async def restore(session: AsyncSession) -> None:
    result = await session.execute(select(UserProfile).limit(1))
    user = result.scalar_one_or_none()
    if not user:
        print("ERROR: No users found. Please sign up via the UI first, then re-run.")
        return

    uid = user.id
    print(f"\nRestoring data for user: {user.email} (id={uid})\n")

    # ------------------------------------------------------------------
    # Institutions
    # ------------------------------------------------------------------
    print("[1/2] Creating institutions...")
    inst_ids: dict[str, int] = {}
    for name, itype in [
        ("Chase Bank",                  "Bank"),
        ("Coventry Building Society",   "Building Society"),
        ("Santander",                   "Bank"),
        ("Willis Towers Watson",        "Pensions Provider"),
        ("RCI Bank",                    "Bank"),
        ("Fidelity",                    "Fund Manager"),
        ("Metro Bank",                  "Bank"),
        ("Computershare",               "Share Registrar"),
        ("Kent Reliance",               "Building Society"),
        ("Principality",                "Building Society"),
        ("NatWest",                     "Bank"),
        ("Yorkshire Building Society",  "Building Society"),
        ("Tesco Bank",                  "Bank"),
        ("NS & I",                      "HM Government"),
        ("Cahoot",                      "Bank"),
        ("Marcus",                      "Bank"),
        ("HSBC",                        "Bank"),
    ]:
        inst = await get_or_create_institution(session, uid, name, itype)
        inst_ids[name] = inst.id
        print(f"    ✓ {name}")

    # ------------------------------------------------------------------
    # Accounts  (name, institution, type, balance, {attr: value})
    # NOTE: "Fixed Bonus Rate End Date" is the DB name for what the UI
    #       shows as "Fixed Rate End Date".
    # Truncated account names (marked with *) — rename via UI if needed.
    # ------------------------------------------------------------------
    print("\n[2/2] Creating accounts...")

    await make_account(session, uid, inst_ids["Chase Bank"],
        "Chase Saver", "Fixed / Bonus Rate Saver", 30052.00, {
            "Account Number": "79626386",
            "Sort Code": "60-84-07",
            "Interest Rate": "2.25",
            "Fixed Bonus Rate": "4.5",
        })

    await make_account(session, uid, inst_ids["Coventry Building Society"],
        "3 Access Saver - 1 Year", "Savings Account", 30001.00, {
            "Account Number": "49671977",
            "Sort Code": "40-63-01",
            "Interest Rate": "4.17",
        })

    await make_account(session, uid, inst_ids["Santander"],
        "Monthly Saver", "Savings Account", 800.00, {
            "Roll / Ref Number": "R26506615 LEW",
            "Interest Rate": "5",
        })

    await make_account(session, uid, inst_ids["Willis Towers Watson"],
        "NatWest Pension", "Deferred DB Pension", 0.00, {})

    await make_account(session, uid, inst_ids["Willis Towers Watson"],
        "HSBC Pension", "Deferred DC Pension", 614000.00, {
            "Release Date": "21/03/2043",
        })

    await make_account(session, uid, inst_ids["RCI Bank"],
        "Freedom Savings Account", "Savings Account", 1.00, {
            "Roll / Ref Number": "LFW6GBMFT2",
            "Interest Rate": "3.88",
        })

    await make_account(session, uid, inst_ids["Fidelity"],
        "Trust Invesment Account", "Trust Stocks Investment Account", 75800.79, {
            "Account Number": "AG10150506",
        })

    await make_account(session, uid, inst_ids["Metro Bank"],
        "Bare Trust For Zachary J Lewis", "Trust Bank Account", 199846.29, {
            "Account Number": "57303707",
            "Sort Code": "23-05-80",
        })

    # RSU tranches (* name truncated in screenshot)
    for name, balance, release, shares in [
        ("HSBC Variable Pay Awards - Shares (2029)", 16329.36,  "12/03/2029", "2231"),
        ("HSBC Variable Pay Awards - Shares (2028)", 16307.40,  "14/03/2028", "2228"),
        ("HSBC Variable Pay Awards - Shares (2027)", 73361.34,  "11/03/2027", "10023"),
        ("HSBC Variable Pay Awards - Shares (2026)", 113171.02, "12/03/2026", "15462"),
    ]:
        await make_account(session, uid, inst_ids["Computershare"],
            name, "RSU", balance, {
                "Release Date":    release,
                "Number of Shares": shares,
                "Price":           "1381",
            })

    # Deferred Cash tranches (* name truncated in screenshot)
    for name, balance, release in [
        ("HSBC Variable Pay Awards - Cash (2029)", 2565.00, "12/03/2029"),
        ("HSBC Variable Pay Awards - Cash (2028)", 2564.10, "14/03/2028"),
        ("HSBC Variable Pay Awards - Cash (2027)", 2564.10, "09/03/2027"),
        ("HSBC Variable Pay Awards - Cash (2026)", 2564.10, "12/03/2026"),
    ]:
        await make_account(session, uid, inst_ids["Computershare"],
            name, "Deferred Cash", balance, {
                "Release Date": release,
            })

    # Deferred Shares (* name truncated in screenshot)
    await make_account(session, uid, inst_ids["Computershare"],
        "HSBC Nominee (Vested Shares)", "Deferred Shares", 77878.12, {
            "Release Date":     "20/03/2026",
            "Number of Shares": "6038",
            "Price":            "1381",
        })

    await make_account(session, uid, inst_ids["Fidelity"],
        "Investment ISA", "Stocks ISA", 203719.21, {
            "Account Number": "LEWX000607",
        })

    await make_account(session, uid, inst_ids["Coventry Building Society"],
        "Fixed Rate ISA (315) 31.05.2026", "Fixed Rate ISA", 82590.55, {
            "Account Number":          "48953735",
            "Sort Code":               "40-63-01",
            "Interest Rate":           "4.13",
            "Fixed Bonus Rate End Date": "14/01/2027",
        })

    await make_account(session, uid, inst_ids["Kent Reliance"],
        "D131 1Y FXD RTE CASH ISA 4.25%", "Fixed Rate ISA", 21408.09, {
            "Account Number":          "AFN3697073LEW",
            "Interest Rate":           "4.25",
            "Fixed Bonus Rate End Date": "18/12/2026",
        })

    await make_account(session, uid, inst_ids["Kent Reliance"],
        "D120 1Y FXD RTE CASH ISA 4.25%", "Fixed Rate ISA", 20000.00, {
            "Account Number":          "YND3550904LEW",
            "Interest Rate":           "4.25",
            "Fixed Bonus Rate End Date": "07/07/2026",
        })

    await make_account(session, uid, inst_ids["Kent Reliance"],
        "D108 1Y MTRT FXD RTE ISA 4.0%", "Fixed Rate ISA", 21862.87, {
            "Account Number": "YJL3487940LEW",
            "Interest Rate":  "4",
        })

    await make_account(session, uid, inst_ids["Principality"],
        "Online Bonus 5 Access Cash ISA", "Fixed Rate ISA", 37488.68, {
            "Account Number":          "619389504",
            "Interest Rate":           "4",
            "Fixed Bonus Rate End Date": "16/09/2026",
        })

    await make_account(session, uid, inst_ids["NatWest"],
        "Fixed Rate ISA Annual", "Fixed Rate ISA", 76431.93, {
            "Account Number":          "35007044",
            "Sort Code":               "60-12-13",
            "Interest Rate":           "4.2",
            "Fixed Bonus Rate End Date": "12/11/2026",
        })

    await make_account(session, uid, inst_ids["Yorkshire Building Society"],
        "Single Access eISA", "Cash ISA", 80000.00, {
            "Account Number":   "46535650",
            "Roll / Ref Number": "4653565007",
            "Interest Rate":    "3.8",
        })

    await make_account(session, uid, inst_ids["Yorkshire Building Society"],
        "Internet Saver Plus Issue 13", "Savings Account", 3534.07, {
            "Account Number":   "6290368607",
            "Sort Code":        "60-92-04",
            "Roll / Ref Number": "6290368607",
            "Interest Rate":    "3.5",
        })

    await make_account(session, uid, inst_ids["Santander"],
        "Easy Access Saver Sept 2023", "Savings Account", 44.56, {
            "Account Number": "90005129",
            "Sort Code":      "09-01-29",
            "Interest Rate":  "3",
        })

    await make_account(session, uid, inst_ids["Tesco Bank"],
        "Internet Saver", "Fixed / Bonus Rate Saver", 113072.83, {
            "Account Number":          "24379730",
            "Sort Code":               "40-64-05",
            "Interest Rate":           "1.05",
            "Fixed Bonus Rate":        "4",
            "Fixed Bonus Rate End Date": "14/05/2026",
        })

    await make_account(session, uid, inst_ids["NS & I"],
        "Premium Bonds", "Premium Bonds", 49999.00, {
            "Account Number": "240138706",
        })

    await make_account(session, uid, inst_ids["Cahoot"],
        "Cahoot Savings Account", "Savings Account", 80096.47, {
            "Account Number":     "51752935",
            "Sort Code":          "09-06-43",
            "Interest Rate":      "4.31",
            "Account Opened Date": "05/07/2025",
        })

    await make_account(session, uid, inst_ids["Marcus"],
        "Online Savings Account", "Fixed / Bonus Rate Saver", 87609.74, {
            "Account Number":          "41019753",
            "Sort Code":               "40-64-37",
            "Interest Rate":           "3.19",
            "Fixed Bonus Rate":        "3.75",
            "Fixed Bonus Rate End Date": "27/03/2026",
        })

    await make_account(session, uid, inst_ids["Santander"],
        "Current Account", "Current Account", 14535.97, {
            "Account Number": "30442013",
            "Sort Code":      "09-01-26",
        })

    await make_account(session, uid, inst_ids["HSBC"],
        "Premier Joint Account", "Current Account", 14575.11, {
            "Account Number":     "30018929",
            "Sort Code":          "40-02-46",
            "Account Opened Date": "10/02/2026",
        })

    await make_account(session, uid, inst_ids["HSBC"],
        "Online Bonus Saver", "Fixed / Bonus Rate Saver", 48399.38, {
            "Account Number":          "20259004",
            "Sort Code":               "40-02-46",
            "Interest Rate":           "1.15",
            "Fixed Bonus Rate":        "3.5",
            "Fixed Bonus Rate End Date": "27/03/2026",
        })

    await session.commit()
    print("\n✅ Restore complete!")
    print("\nNOTE: Account names marked with * were truncated in the screenshot.")
    print("      Please rename them via the UI if needed:")
    print("      - HSBC Variable Pay Awards - Shares (2026/2027/2028/2029)")
    print("      - HSBC Variable Pay Awards - Cash (2026/2027/2028/2029)")
    print("      - HSBC Nominee (Vested Shares)")


async def main() -> None:
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session_maker = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session_maker() as session:
        await restore(session)
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
