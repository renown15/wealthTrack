#!/usr/bin/env python3
"""Seed reference data. Runs inside the backend Docker container via docker-compose exec."""
import asyncio
import os

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.models.reference_data import ReferenceData
from app.services.reference_data import seed_reference_data
from app.services.reference_data_items import REFERENCE_DATA_ITEMS


async def run() -> None:
    database_url = os.environ["DATABASE_URL"]
    print(f"Seeding: {database_url.split('@')[-1]}")
    print(f"{len(REFERENCE_DATA_ITEMS)} items to sync\n")

    engine = create_async_engine(database_url)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)  # type: ignore

    async with Session() as session:
        before = (await session.execute(select(func.count()).select_from(ReferenceData))).scalar()
        await seed_reference_data(session)
        after = (await session.execute(select(func.count()).select_from(ReferenceData))).scalar()

    await engine.dispose()

    inserted = (after or 0) - (before or 0)
    skipped = len(REFERENCE_DATA_ITEMS) - inserted
    print(f"Done: {inserted} inserted, {skipped} already existed")


if __name__ == "__main__":
    asyncio.run(run())
