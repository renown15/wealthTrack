"""
Refactored price service with dependency injection for better testability.

This version separates concerns and uses dependency injection to make
the service easily mockable for unit tests.
"""
import asyncio
import logging
import time
from typing import Optional, Protocol

import httpx

logger = logging.getLogger(__name__)


class PriceCache(Protocol):
    """Protocol for price cache implementations."""

    async def get(self, symbol: str) -> Optional[str]:
        """Get cached price or None if not found/expired."""
        ...

    async def set(self, symbol: str, price: str) -> None:
        """Store price in cache."""
        ...


class SimplePriceCache:
    """Simple in-memory price cache with TTL."""

    def __init__(self, ttl_seconds: int = 3600):
        self.ttl_seconds = ttl_seconds
        self._cache: dict[str, tuple[str, float]] = {}

    async def get(self, symbol: str) -> Optional[str]:
        """Get cached price if valid, or None."""
        if symbol not in self._cache:
            return None

        price, timestamp = self._cache[symbol]
        age = time.time() - timestamp

        if age < self.ttl_seconds:
            msg = f"[PriceCache] Hit for {symbol} (age: {age:.0f}s)"
            logger.debug(msg)
            return price

        msg = f"[PriceCache] Expired for {symbol} (age: {age:.0f}s)"
        logger.debug(msg)
        return None

    async def set(self, symbol: str, price: str) -> None:
        """Store price in cache."""
        self._cache[symbol] = (price, time.time())


class PriceServiceRefactored:
    """Refactored price service with dependency injection."""

    def __init__(
        self,
        api_key: str,
        cache: Optional[PriceCache] = None,
        api_url: str = "https://api.api-ninjas.com/v1/stockprice",
        max_retries: int = 2,
        initial_backoff: float = 1.0,
    ):
        self.api_key = api_key
        self.api_url = api_url
        self.max_retries = max_retries
        self.initial_backoff = initial_backoff
        self.cache = cache or SimplePriceCache()

    def _validate_inputs(self, symbol: str) -> Optional[str]:
        """Validate inputs. Returns error message or None."""
        if not symbol or not symbol.strip():
            logger.warning("[PriceService] Symbol is empty")
            return "empty_symbol"

        if not self.api_key:
            logger.warning("[PriceService] API key not configured")
            return "no_api_key"

        return None

    async def _fetch_from_api(self, symbol: str) -> Optional[str]:
        """Fetch price from API with retry logic."""
        for attempt in range(self.max_retries):
            try:
                headers = {"X-Api-Key": self.api_key}
                params = {"ticker": symbol}

                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(
                        self.api_url, headers=headers, params=params
                    )
                    response.raise_for_status()
                    data = response.json()

                    price = data.get("price")
                    if price is None:
                        msg = f"[PriceService] No price data for {symbol}"
                        logger.warning(msg)
                        return None

                    price_in_pence = str(int(float(price)))
                    await self.cache.set(symbol, price_in_pence)
                    msg = f"Fetched price for {symbol}: {price_in_pence} pence"
                    logger.info(msg)
                    return price_in_pence

            except httpx.HTTPStatusError as e:
                if (
                    e.response.status_code == 429
                    and attempt < self.max_retries - 1
                ):
                    backoff = self.initial_backoff * (2 ** attempt)
                    msg = f"Rate limited for {symbol}, retry in {backoff}s"
                    logger.warning(msg)
                    await asyncio.sleep(backoff)
                    continue
                msg = f"HTTP error for {symbol}: {e.response.status_code}"
                logger.error(msg)
                return None
            except (
                httpx.RequestError,
                KeyError,
                ValueError,
                TypeError,
                RuntimeError,
            ) as e:
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
        error = self._validate_inputs(symbol)
        if error:
            return None

        # Check cache
        cached_price = await self.cache.get(symbol)
        if cached_price:
            return cached_price

        # Fetch from API
        return await self._fetch_from_api(symbol)
