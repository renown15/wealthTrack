"""
Controllers package initialization.
"""
from app.controllers.auth import router as auth_router

__all__ = ["auth_router"]
