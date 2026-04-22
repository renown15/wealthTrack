"""
Service for fetching stock prices using API Ninjas.
"""
import asyncio
import logging
import os
import time
from typing import Optional, Protocol

import httpx

logger = logging.getLogger(__name__)


class PriceCache(Protocol):
    """Protocol for price cache implementations."""

    def get(self, symbol: str, now: float, cache_ttl: int) -> Optional[str]:
        """Get cached price if valid, None otherwise."""

    def set(self, symbol: str, price: str, now: float) -> None:
        """Store price in cache."""

    def clear(self) -> None:
        """Clear all cache entries."""


class SimplePriceCache:
    """Simple in-memory price cache implementation."""

    def __init__(self) -> None:
        """Initialize the cache."""
        self._cache: dict[str, tuple[str, float]] = {}

    def get(self, symbol: str, now: float, cache_ttl: int) -> Optional[str]:
        """Get cached price if valid, None otherwise."""
        if symbol not in self._cache:
            return None

        price, timestamp = self._cache[symbol]
        age = now - timestamp

        if age < cache_ttl:
            msg = f"[PriceService] Cache hit for {symbol} (age: {age:.0f} seconds)"
            logger.debug(msg)
            return price

        msg = f"[PriceService] Cache expired for {symbol} (age: {age:.0f} seconds)"
        logger.debug(msg)
        return None

    def set(self, symbol: str, price: str, now: float) -> None:
        """Store price in cache."""
        self._cache[symbol] = (price, now)

    def clear(self) -> None:
        """Clear all cache entries."""
        self._cache.clear()


class PriceService:
    """Service for fetching and caching stock prices via API Ninjas."""

    API_NINJAS_URL = "https://api.api-ninjas.com/v1/stockprice"
    MAX_RETRIES = 2
    INITIAL_BACKOFF = 1  # seconds
    CACHE_TTL = 3600  # 1 hour in seconds

    def __init__(
        self,
        api_key: str,
        client: httpx.AsyncClient,
        cache: PriceCache,
    ) -> None:
        """Initialize service with dependencies."""
        self.api_key = api_key
        self.client = client
        self.cache = cache

    async def _validate_fetch_inputs(self, symbol: str) -> Optional[str]:
        """Validate inputs before fetching price. Returns error message or None."""
        if not symbol or not symbol.strip():
            logger.warning("[PriceService] Symbol is empty")
            return "empty_symbol"

        if not self.api_key:
            logger.warning("[PriceService] API_NINJAS_KEY not configured")
            return "no_api_key"

        return None

    async def _check_cache(self, symbol: str, now: float) -> Optional[str]:
        """Check cache and return price if valid, or None if cache miss/expired."""
        return self.cache.get(symbol, now, self.CACHE_TTL)

    async def _fetch_from_api(self, symbol: str, now: float) -> Optional[str]:
        """Fetch price from API with retry logic."""
        for attempt in range(self.MAX_RETRIES):
            try:
                headers = {"X-Api-Key": self.api_key}
                params = {"ticker": symbol}

                response = await self.client.get(
                    self.API_NINJAS_URL, headers=headers, params=params
                )
                response.raise_for_status()
                data = response.json()

                price = data.get("price")
                if price is None:
                    msg = f"[PriceService] No price data for {symbol}"
                    logger.warning(msg)
                    return None

                price_in_pence = str(int(float(price)))
                self.cache.set(symbol, price_in_pence, now)
                msg = f"Fetched price for {symbol}: {price_in_pence} pence"
                logger.info(msg)
                return price_in_pence

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429 and attempt < self.MAX_RETRIES - 1:
                    backoff = self.INITIAL_BACKOFF * (2**attempt)
                    msg = f"Limited: {symbol}, retry in {backoff} sec: {e}"
                    logger.warning(msg)
                    await asyncio.sleep(backoff)
                    continue
                msg = f"HTTP error: {symbol}, {e.response.status_code} - {e}"
                logger.error(msg)
                return None
            except (httpx.RequestError, KeyError, ValueError, TypeError, RuntimeError) as e:
                msg = f"Error fetching price for {symbol}: {type(e).__name__}"
                logger.error(msg, exc_info=True)
                return None

        return None

    async def fetch_price(self, symbol: str) -> Optional[str]:
        """
        Fetch current stock price using API Ninjas with local caching.

        Args:
            symbol: Stock symbol or ticker (e.g., 'AAPL', 'HSBA.L')

        Returns:
            Price as string (in pence) or None if fetch fails
        """
        # Validate inputs
        error = await self._validate_fetch_inputs(symbol)
        if error:
            return None

        # Check cache
        now = time.time()
        cached_price = await self._check_cache(symbol, now)
        if cached_price:
            return cached_price

        # Fetch from API
        return await self._fetch_from_api(symbol, now)


# Module-level instance for backward compatibility
_default_cache = SimplePriceCache()
_default_client: list[Optional[httpx.AsyncClient]] = [None]  # Use list to avoid global


async def get_price_service() -> PriceService:
    """Factory function to create PriceService with default configuration."""
    if _default_client[0] is None:
        _default_client[0] = httpx.AsyncClient(timeout=10.0)

    api_key = os.getenv("API_NINJAS_KEY", "")
    client = _default_client[0]
    assert client is not None
    return PriceService(api_key=api_key, client=client, cache=_default_cache)
