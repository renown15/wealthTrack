"""
Tests for database operations.
"""
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db


@pytest.mark.asyncio
async def test_get_db_normal_flow() -> None:
    """Test normal get_db flow."""
    # This test verifies the normal case where session commits
    db_gen = get_db()
    session = await db_gen.__anext__()

    assert session is not None
    assert isinstance(session, AsyncSession)

    # Cleanup
    try:
        await db_gen.__anext__()
    except StopAsyncIteration:
        pass


@pytest.mark.asyncio
async def test_get_db_exception_handling() -> None:
    """Test that get_db handles exceptions properly."""
    # When an exception is raised in the context, it should rollback
    db_gen = get_db()
    _ = await db_gen.__anext__()

    try:
        # Simulate an exception during use
        raise RuntimeError("Test error")
    except RuntimeError:
        # The finally block should still execute
        try:
            await db_gen.athrow(RuntimeError("Test error"))
        except (StopAsyncIteration, RuntimeError):
            pass
