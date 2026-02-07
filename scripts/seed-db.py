#!/usr/bin/env python3
"""
Seed database with required reference data.
Works for all environments (dev, test, prod).
Usage: python scripts/seed-db.py
       DB_HOST=localhost DB_PORT=5433 DB_USER=wealthtrack DB_PASSWORD=password DB_NAME=wealthtrack python scripts/seed-db.py
"""
import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.models.reference_data import ReferenceData


async def seed_database():
    """Seed the database with reference data."""
    # Get database connection from environment or use defaults
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_user = os.getenv("DB_USER", "wealthtrack")
    db_password = os.getenv("DB_PASSWORD", "wealthtrack_dev_password")
    db_name = os.getenv("DB_NAME", "wealthtrack")
    
    # Build database URL
    database_url = f"postgresql+asyncpg://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    
    print(f"🌱 Seeding database at {db_host}:{db_port}/{db_name}...")
    
    # Create async engine using database URL
    engine = create_async_engine(
        database_url,
        echo=False
    )

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async with async_session() as session:

        reference_data = [
            # User types
            {
                "classkey": "user_type:user",
                "referencevalue": "User",
                "sortindex": 1,
            },
            {
                "classkey": "user_type:superuser",
                "referencevalue": "SuperUser",
                "sortindex": 2,
            },
            # Account types
            {
                "classkey": "account_type:checking",
                "referencevalue": "Checking Account",
                "sortindex": 1,
            },
            {
                "classkey": "account_type:savings",
                "referencevalue": "Savings Account",
                "sortindex": 2,
            },
            {
                "classkey": "account_type:stocks_isa",
                "referencevalue": "Stocks ISA",
                "sortindex": 3,
            },
            {
                "classkey": "account_type:sipp",
                "referencevalue": "SIPP",
                "sortindex": 4,
            },
            {
                "classkey": "account_type:credit_card",
                "referencevalue": "Credit Card",
                "sortindex": 5,
            },
            # Account statuses
            {
                "classkey": "account_status:active",
                "referencevalue": "Active",
                "sortindex": 1,
            },
            {
                "classkey": "account_status:closed",
                "referencevalue": "Closed",
                "sortindex": 2,
            },
            {
                "classkey": "account_status:dormant",
                "referencevalue": "Dormant",
                "sortindex": 3,
            },
            # Event types
            {
                "classkey": "event_type:balance_update",
                "referencevalue": "Balance Update",
                "sortindex": 1,
            },
            {
                "classkey": "event_type:transaction",
                "referencevalue": "Transaction",
                "sortindex": 2,
            },
            {
                "classkey": "event_type:fee",
                "referencevalue": "Fee",
                "sortindex": 3,
            },
            # Attribute types
            {
                "classkey": "attribute_type:interest_rate",
                "referencevalue": "Interest Rate",
                "sortindex": 1,
            },
            {
                "classkey": "attribute_type:overdraft_limit",
                "referencevalue": "Overdraft Limit",
                "sortindex": 2,
            },
            {
                "classkey": "attribute_type:credit_limit",
                "referencevalue": "Credit Limit",
                "sortindex": 3,
            },
        ]

        inserted = 0
        skipped = 0

        for data in reference_data:
            # Check if already exists
            result = await session.execute(
                select(ReferenceData).where(
                    ReferenceData.classkey == data["classkey"]
                )
            )
            existing = result.scalars().first()

            if existing:
                skipped += 1
                print(f"  ⏭️  Skipping {data['referencevalue']} (already exists)")
            else:
                ref_data = ReferenceData(
                    classkey=data["classkey"],
                    referencevalue=data["referencevalue"],
                    sortindex=data["sortindex"],
                )
                session.add(ref_data)
                inserted += 1
                print(f"  ✅ Added {data['referencevalue']}")

        await session.commit()
        print(f"\n✨ Database seeded! ({inserted} inserted, {skipped} skipped)")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())
