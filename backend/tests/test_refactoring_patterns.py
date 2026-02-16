"""
Example tests showing improved testability with refactored pattern.

This demonstrates how dependency injection makes testing much easier.
(Note: Reference implementation code is in docs/REFACTORING_PATTERNS.md)
"""
import pytest
from unittest.mock import AsyncMock, MagicMock


class SimplePriceCache:
    """Simple in-memory price cache with TTL (example from refactoring guide)."""

    def __init__(self, ttl_seconds: int = 3600):
        self.ttl_seconds = ttl_seconds
        self._cache: dict[str, tuple[str, float]] = {}

    async def get(self, symbol: str):
        """Get cached price if valid, or None."""
        if symbol not in self._cache:
            return None

        price, timestamp = self._cache[symbol]
        import time
        age = time.time() - timestamp

        if age < self.ttl_seconds:
            return price

        return None

    async def set(self, symbol: str, price: str) -> None:
        """Store price in cache."""
        import time
        self._cache[symbol] = (price, time.time())


class MockPriceCache:
    """Mock cache for testing without real storage."""

    def __init__(self):
        self.get_called = False
        self.set_called = False
        self.cached_value = None

    async def get(self, symbol: str):
        """Mock get."""
        self.get_called = True
        return self.cached_value

    async def set(self, symbol: str, price: str) -> None:
        """Mock set."""
        self.set_called = True
        self.cached_value = price


class TestRefactoringPatterns:
    """Test example patterns for refactored services."""

    def test_simple_cache_initialization(self):
        """Test that SimplePriceCache can be initialized."""
        cache = SimplePriceCache(ttl_seconds=3600)
        assert cache.ttl_seconds == 3600

    @pytest.mark.asyncio
    async def test_simple_cache_stores_and_retrieves(self):
        """Test that SimplePriceCache stores and retrieves prices."""
        cache = SimplePriceCache(ttl_seconds=3600)
        await cache.set("AAPL", "15000")
        result = await cache.get("AAPL")
        assert result == "15000"

    @pytest.mark.asyncio
    async def test_simple_cache_returns_none_for_missing(self):
        """Test that SimplePriceCache returns None for missing keys."""
        cache = SimplePriceCache(ttl_seconds=3600)
        result = await cache.get("UNKNOWN")
        assert result is None

    def test_mock_cache_initialization(self):
        """Test that MockPriceCache can be initialized."""
        mock_cache = MockPriceCache()
        assert not mock_cache.get_called
        assert not mock_cache.set_called

    @pytest.mark.asyncio
    async def test_mock_cache_tracks_calls(self):
        """Test that MockPriceCache tracks function calls."""
        mock_cache = MockPriceCache()
        mock_cache.cached_value = "12000"

        result = await mock_cache.get("AAPL")
        assert result == "12000"
        assert mock_cache.get_called

    @pytest.mark.asyncio
    async def test_mock_cache_set_tracking(self):
        """Test that MockPriceCache tracks set calls."""
        mock_cache = MockPriceCache()
        await mock_cache.set("AAPL", "15000")
        assert mock_cache.set_called
        assert mock_cache.cached_value == "15000"

    def test_mock_cache_isolation(self):
        """Test that different MockPriceCache instances are isolated."""
        cache1 = MockPriceCache()
        cache2 = MockPriceCache()

        cache1.cached_value = "15000"
        cache2.cached_value = "20000"

        assert cache1.cached_value == "15000"
        assert cache2.cached_value == "20000"

    @pytest.mark.asyncio
    async def test_cache_protocol_pattern(self):
        """
        Demonstrate protocol pattern: both SimplePriceCache and
        MockPriceCache implement same interface (get/set methods).
        This allows easy mocking in tests.
        """
        # Could use SimplePriceCache
        real_cache = SimplePriceCache(ttl_seconds=3600)
        await real_cache.set("TEST", "10000")
        result = await real_cache.get("TEST")
        assert result == "10000"

        # Or use MockPriceCache with same interface
        mock_cache = MockPriceCache()
        mock_cache.cached_value = "20000"
        result = await mock_cache.get("TEST")
        assert result == "20000"
        # Both work seamlessly!
