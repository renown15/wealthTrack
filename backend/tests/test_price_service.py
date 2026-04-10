"""Tests for PriceService with dependency injection."""

import time
from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest

from app.services.price_service import PriceService, SimplePriceCache


class TestSimplePriceCache:
    """Test SimplePriceCache implementation."""

    def test_get_miss(self):
        """Test cache miss returns None."""
        cache = SimplePriceCache()
        now = time.time()
        result = cache.get("AAPL", now, 3600)
        assert result is None

    def test_set_and_get(self):
        """Test setting and getting cache value."""
        cache = SimplePriceCache()
        now = time.time()
        cache.set("AAPL", "150", now)
        result = cache.get("AAPL", now, 3600)
        assert result == "150"

    def test_expiration(self):
        """Test that cache respects expiration."""
        cache = SimplePriceCache()
        now = time.time()
        past = now - 3700  # Older than TTL
        cache.set("AAPL", "150", past)
        result = cache.get("AAPL", now, 3600)
        assert result is None

    def test_clear(self):
        """Test clearing cache."""
        cache = SimplePriceCache()
        now = time.time()
        cache.set("AAPL", "150", now)
        cache.clear()
        result = cache.get("AAPL", now, 3600)
        assert result is None

    def test_multiple_symbols(self):
        """Test cache with multiple symbols."""
        cache = SimplePriceCache()
        now = time.time()
        cache.set("AAPL", "150", now)
        cache.set("GOOGL", "2800", now)
        assert cache.get("AAPL", now, 3600) == "150"
        assert cache.get("GOOGL", now, 3600) == "2800"


class TestPriceServiceWithMocks:
    """Test PriceService with mock dependencies."""

    def test_initialization_valid(self):
        """Test service initializes with valid parameters."""
        mock_cache = SimplePriceCache()
        mock_client = AsyncMock(spec=httpx.AsyncClient)

        service = PriceService(api_key="test_key", client=mock_client, cache=mock_cache)

        assert service.api_key == "test_key"
        assert service.client is mock_client
        assert service.cache is mock_cache

    @pytest.mark.asyncio
    async def test_validate_fetch_inputs_empty_symbol(self):
        """Test validation rejects empty symbol."""
        mock_cache = SimplePriceCache()
        mock_client = AsyncMock(spec=httpx.AsyncClient)
        service = PriceService(api_key="test_key", client=mock_client, cache=mock_cache)

        result = await service._validate_fetch_inputs("")
        assert result == "empty_symbol"

    @pytest.mark.asyncio
    async def test_validate_fetch_inputs_no_api_key(self):
        """Test validation rejects when no api key."""
        mock_cache = SimplePriceCache()
        mock_client = AsyncMock(spec=httpx.AsyncClient)
        service = PriceService(api_key="", client=mock_client, cache=mock_cache)

        result = await service._validate_fetch_inputs("AAPL")
        assert result == "no_api_key"

    @pytest.mark.asyncio
    async def test_validate_fetch_inputs_valid(self):
        """Test validation accepts valid input."""
        mock_cache = SimplePriceCache()
        mock_client = AsyncMock(spec=httpx.AsyncClient)
        service = PriceService(api_key="test_key", client=mock_client, cache=mock_cache)

        result = await service._validate_fetch_inputs("AAPL")
        assert result is None

    @pytest.mark.asyncio
    async def test_check_cache_hit(self):
        """Test cache hit returns value."""
        mock_cache = SimplePriceCache()
        now = time.time()
        mock_cache.set("AAPL", "150", now)
        mock_client = AsyncMock(spec=httpx.AsyncClient)
        service = PriceService(api_key="test_key", client=mock_client, cache=mock_cache)

        result = await service._check_cache("AAPL", now)
        assert result == "150"

    @pytest.mark.asyncio
    async def test_check_cache_miss(self):
        """Test cache miss returns None."""
        mock_cache = SimplePriceCache()
        now = time.time()
        mock_client = AsyncMock(spec=httpx.AsyncClient)
        service = PriceService(api_key="test_key", client=mock_client, cache=mock_cache)

        result = await service._check_cache("AAPL", now)
        assert result is None

    @pytest.mark.asyncio
    async def test_fetch_price_http_error(self):
        """Test handling of HTTP errors."""
        mock_cache = SimplePriceCache()
        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_client.get = AsyncMock(
            side_effect=httpx.HTTPStatusError(
                message="Not found",
                request=MagicMock(),
                response=mock_response
            )
        )

        service = PriceService(api_key="test_key", client=mock_client, cache=mock_cache)

        result = await service.fetch_price("INVALID")

        assert result is None

    @pytest.mark.asyncio
    async def test_fetch_price_missing_data(self):
        """Test handling of missing price data in response."""
        mock_cache = SimplePriceCache()
        mock_client = AsyncMock(spec=httpx.AsyncClient)
        mock_response = MagicMock()
        mock_response.json = MagicMock(return_value={"data": {}})
        mock_client.get = AsyncMock(return_value=mock_response)

        service = PriceService(api_key="test_key", client=mock_client, cache=mock_cache)

        result = await service.fetch_price("AAPL")

        assert result is None
