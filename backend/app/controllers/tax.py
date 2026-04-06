"""
Tax Hub router — aggregates periods, returns, and documents sub-routers.
"""
from fastapi import APIRouter

from app.controllers.tax_documents import router as documents_router
from app.controllers.tax_periods import router as periods_router
from app.controllers.tax_returns import router as returns_router

router = APIRouter(prefix="/tax", tags=["tax"])

router.include_router(periods_router)
router.include_router(returns_router)
router.include_router(documents_router)
