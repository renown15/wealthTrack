#!/usr/bin/env python3
"""
Seed database with all reference data from app.services.reference_data.

This script is the canonical way to populate reference data.
All reference data is defined in backend/app/services/reference_data.py.

Works for all environments (dev, test, prod).

Usage:
    python scripts/seed-db.py
    DB_HOST=localhost DB_PORT=5433 DB_USER=wealthtrack DB_PASSWORD=password DB_NAME=wealthtrack python scripts/seed-db.py
    DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db python scripts/seed-db.py
"""
import asyncio
import os
import sys
from pathlib import Path

# Add backend to path so app.services can be imported
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.models.reference_data import ReferenceData  # type: ignore
from app.services.reference_data import REFERENCE_DATA_ITEMS, seed_reference_data  # type: ignore


async def run_seed() -> None:
    """Seed the database with all reference data."""
    # Prefer DATABASE_URL env var (used by pr-check); fall back to individual vars
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5433")
        db_user = os.getenv("DB_USER", "wealthtrack")
        db_password = os.getenv("DB_PASSWORD", "wealthtrack_dev_password")
        db_name = os.getenv("DB_NAME", "wealthtrack")
        database_url = f"postgresql+asyncpg://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

    print(f"🌱 Seeding database: {database_url.split('@')[-1]}")
    print(f"   {len(REFERENCE_DATA_ITEMS)} canonical items across all classes\n")

    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)  # type: ignore

    async with async_session() as session:
        count_before = (await session.execute(select(func.count()).select_from(ReferenceData))).scalar()
        await seed_reference_data(session)
        count_after = (await session.execute(select(func.count()).select_from(ReferenceData))).scalar()

    await engine.dispose()

    inserted = (count_after or 0) - (count_before or 0)
    skipped = len(REFERENCE_DATA_ITEMS) - inserted
    print(f"✨ Done! {inserted} inserted, {skipped} already existed")


if __name__ == "__main__":
    asyncio.run(run_seed())
