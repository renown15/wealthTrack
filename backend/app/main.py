"""
Main FastAPI application entry point.
"""
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.controllers.account import router as account_router
from app.controllers.auth import router as auth_router
from app.controllers.institution import router as institution_router
from app.controllers.portfolio import router as portfolio_router
from app.controllers.reference_data import router as reference_data_router
from app.database import Base, async_session_maker, engine
from app.services.reference_data import seed_reference_data


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan context manager.
    Handles startup and shutdown events.
    """
    # Startup: Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed reference data so foreign keys have valid defaults
    async with async_session_maker() as session:
        await seed_reference_data(session)

    yield

    # Shutdown: Close database connections
    await engine.dispose()


# Create FastAPI application
app = FastAPI(
    title="WealthTrack API",
    description="Strategic wealth management application API",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS dynamically based on configuration
allow_origins = [
    f"http://{settings.frontend_host}:{settings.frontend_port}",
]
# Add additional allowed origins for development/testing
if settings.environment in ("development", "test"):
    allow_origins.extend([
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:8080",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(account_router, prefix=settings.api_v1_prefix)
app.include_router(institution_router, prefix=settings.api_v1_prefix)
app.include_router(portfolio_router, prefix=settings.api_v1_prefix)
app.include_router(reference_data_router, prefix=settings.api_v1_prefix)


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {"message": "WealthTrack API", "version": "1.0.0"}


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}
