"""
Main FastAPI application entry point.
"""
import json
import logging
from collections.abc import AsyncGenerator, Awaitable, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import settings

logger = logging.getLogger(__name__)
from app.controllers.account import router as account_router
from app.controllers.account_documents import router as account_documents_router
from app.controllers.share_sale import router as share_sale_router
from app.controllers.account_group import router as account_group_router
from app.controllers.analytics import router as analytics_router
from app.controllers.auth import router as auth_router
from app.controllers.institution import router as institution_router
from app.controllers.institution_security_credentials import (
    router as institution_credentials_router,
)
from app.controllers.portfolio import router as portfolio_router
from app.controllers.reference_data import router as reference_data_router
from app.controllers.tax import router as tax_router
from app.database import async_session_maker, engine
from app.services.type_validator import validate_types_against_db


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan context manager.
    Handles startup and shutdown events.
    """
    # Clear debug log on startup
    with open("/tmp/share_sale_debug.log", "w") as f:
        f.write("[APP STARTUP] WealthTrack API started\n")
    
    # Database tables and reference data are created and managed by Alembic migrations
    async with async_session_maker() as session:
        await validate_types_against_db(session)
    yield

    # Shutdown: Close database connections
    await engine.dispose()


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log raw HTTP request bodies for debugging.
    Specifically targets /share-sale endpoint for detailed inspection.
    """

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Log request body before passing to handlers."""
        if "/share-sale" in request.url.path:
            try:
                body = await request.body()
                if body:
                    debug_msg = f"""
[RAW REQUEST] /share-sale endpoint
Path: {request.url.path}
Method: {request.method}
Content-Type: {request.headers.get("content-type")}
Body: {body.decode(errors="ignore")}
---
"""
                    # Write to /tmp for visibility
                    with open("/tmp/share_sale_debug.log", "a") as f:
                        f.write(debug_msg)
                    logger.error(f"[RequestLogging] Wrote to /tmp/share_sale_debug.log")
            except Exception as e:
                with open("/tmp/share_sale_debug.log", "a") as f:
                    f.write(f"[ERROR] {e}\n")
        
        return await call_next(request)


class SnakeToCamelCaseMiddleware(BaseHTTPMiddleware):
    """
    Middleware that transforms all JSON response bodies from snake_case to camelCase.
    This ensures consistent API responses regardless of internal model naming.
    """

    @staticmethod
    def _to_camel_case(snake_str: str) -> str:
        """Convert snake_case string to camelCase."""
        components = snake_str.split("_")
        return components[0] + "".join(x.title() for x in components[1:])

    @staticmethod
    def _transform_keys(obj: object) -> object:
        """Recursively transform dict keys from snake_case to camelCase."""
        if isinstance(obj, dict):
            return {
                SnakeToCamelCaseMiddleware._to_camel_case(k): (
                    SnakeToCamelCaseMiddleware._transform_keys(v)
                )
                for k, v in obj.items()
            }
        if isinstance(obj, list):
            return [SnakeToCamelCaseMiddleware._transform_keys(item) for item in obj]
        return obj

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Intercept response and transform JSON keys."""
        response = await call_next(request)

        # Only transform JSON responses
        if "application/json" not in response.headers.get("content-type", ""):
            return response

        # Read response body
        body = b""
        async for chunk in response.body_iterator:  # type: ignore[attr-defined]
            body += chunk

        try:
            # Parse, transform, and re-encode JSON
            data = json.loads(body)
            transformed = self._transform_keys(data)
            transformed_body: bytes = json.dumps(transformed).encode()

            # Return new response with transformed body
            # Remove Content-Length header so Starlette recalculates based on new body
            headers = dict(response.headers)
            headers.pop("content-length", None)
            return Response(
                content=transformed_body,
                status_code=response.status_code,
                headers=headers,
                media_type=response.media_type,
            )
        except (json.JSONDecodeError, UnicodeDecodeError):
            # If not valid JSON, return original response unchanged
            return Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )


# Create FastAPI application
app = FastAPI(
    title="WealthTrack API",
    description="Strategic wealth management application API",
    version="1.0.0",
    lifespan=lifespan,
)


# Add custom exception handler for validation errors
@app.exception_handler(422)
async def validation_exception_handler(request: Request, exc: Exception) -> Response:
    """Handler for validation errors — log details to file."""
    try:
        debug_msg = f"""
[VALIDATION ERROR] 422
Path: {request.url.path}
Method: {request.method}
Error Details: {str(exc)}
---
"""
        with open("/tmp/share_sale_debug.log", "a") as f:
            f.write(debug_msg)
    except Exception as log_err:
        logger.error(f"Could not log validation error: {log_err}")
    raise exc

# Add request logging middleware FIRST (to see raw requests)
app.add_middleware(RequestLoggingMiddleware)

# Add snake_to_camelCase middleware BEFORE CORS (so CORS still applies)
app.add_middleware(SnakeToCamelCaseMiddleware)

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


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {"message": "WealthTrack API", "version": "1.0.0"}


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}
