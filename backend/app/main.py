"""
Main FastAPI application entry point.
"""
import logging
from collections.abc import AsyncGenerator, Sequence
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.requests import Request

from app.config import settings
from app.controllers.account import router as account_router
from app.controllers.account_documents import router as account_documents_router
from app.controllers.account_group import router as account_group_router
from app.controllers.analytics import router as analytics_router
from app.controllers.auth import router as auth_router
from app.controllers.dividends import router as dividends_router
from app.controllers.family import router as family_router
from app.controllers.gifts import router as gifts_router
from app.controllers.institution import router as institution_router
from app.controllers.institution_security_credentials import (
    router as institution_credentials_router,
)
from app.controllers.outgoings import router as outgoings_router
from app.controllers.portfolio import router as portfolio_router
from app.controllers.reference_data import router as reference_data_router
from app.controllers.risk_scenarios import router as risk_scenarios_router
from app.controllers.share_sale import router as share_sale_router
from app.controllers.tax import router as tax_router
from app.database import async_session_maker, engine
from app.middleware import SnakeToCamelCaseMiddleware
from app.services.type_validator import validate_types_against_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan — validates reference data on startup."""
    async with async_session_maker() as session:
        await validate_types_against_db(session)
    yield
    await engine.dispose()


app = FastAPI(
    title="WealthTrack API",
    description="Strategic wealth management application API",
    version="1.0.0",
    lifespan=lifespan,
)


def _serializable_errors(errors: Sequence[Any]) -> list[Any]:
    """Convert Pydantic v2 errors to JSON-serializable form."""
    result = []
    for error in errors:
        item = dict(error)
        if "ctx" in item and isinstance(item["ctx"], dict):
            item["ctx"] = {
                k: str(v) if isinstance(v, Exception) else v
                for k, v in item["ctx"].items()
            }
        result.append(item)
    return result


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Return validation errors as JSON."""
    errors = _serializable_errors(exc.errors())
    logger.warning("Validation error %s %s: %s", request.method, request.url.path, errors)
    return JSONResponse(status_code=422, content={"detail": errors})


app.add_middleware(SnakeToCamelCaseMiddleware)

allow_origins = [f"http://{settings.frontend_host}:{settings.frontend_port}"]
if settings.environment in ("development", "test"):
    allow_origins.extend([
        "http://localhost:3000", "http://localhost:3001", "http://localhost:8080",
        "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://127.0.0.1:8080",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.api_v1_prefix)
app.include_router(analytics_router, prefix=settings.api_v1_prefix)
app.include_router(account_router, prefix=settings.api_v1_prefix)
app.include_router(account_group_router, prefix=settings.api_v1_prefix)
app.include_router(institution_router, prefix=settings.api_v1_prefix)
app.include_router(institution_credentials_router, prefix=settings.api_v1_prefix)
app.include_router(portfolio_router, prefix=settings.api_v1_prefix)
app.include_router(reference_data_router, prefix=settings.api_v1_prefix)
app.include_router(tax_router, prefix=settings.api_v1_prefix)
app.include_router(account_documents_router, prefix=settings.api_v1_prefix)
app.include_router(share_sale_router, prefix=settings.api_v1_prefix)
app.include_router(dividends_router, prefix=settings.api_v1_prefix)
app.include_router(gifts_router, prefix=settings.api_v1_prefix)
app.include_router(outgoings_router, prefix=settings.api_v1_prefix)
app.include_router(family_router, prefix=settings.api_v1_prefix)
app.include_router(risk_scenarios_router, prefix=settings.api_v1_prefix)


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {"message": "WealthTrack API", "version": "1.0.0"}


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}
