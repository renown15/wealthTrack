"""
Service for fetching stock prices using API Ninjas.
"""
import asyncio
import logging
import os
import time
from typing import Optional

import httpx

logger = logging.getLogger(__name__)


class PriceService:
    """Service for fetching and caching stock prices via API Ninjas."""

    API_NINJAS_URL = "https://api.api-ninjas.com/v1/stockprice"
    API_KEY = os.getenv("API_NINJAS_KEY", "")
    MAX_RETRIES = 2
    INITIAL_BACKOFF = 1  # seconds
    CACHE_TTL = 3600  # 1 hour in seconds
    
    # In-memory cache: symbol -> (price, timestamp)
    _price_cache: dict[str, tuple[str, float]] = {}

    @staticmethod
    async def fetch_price(symbol: str) -> Optional[str]:
        """
        Fetch current stock price using API Ninjas with local caching.
        
        Args:
            symbol: Stock symbol or ticker (e.g., 'AAPL', 'HSBA.L')
            
        Returns:
            Price as string (in pence) or None if fetch fails
        """
        if not symbol or not symbol.strip():
            logger.warning("[PriceService] Symbol is empty")
            return None
        
        if not PriceService.API_KEY:
            logger.warning("[PriceService] API_NINJAS_KEY not configured")
            return None

        # Check local cache first
        now = time.time()
        if symbol in PriceService._price_cache:
            price, timestamp = PriceService._price_cache[symbol]
            age = now - timestamp
            if age < PriceService.CACHE_TTL:
                logger.debug(f"[PriceService] Cache hit for {symbol} (age: {age:.0f}s)")
                return price
            else:
                logger.debug(f"[PriceService] Cache expired for {symbol} (age: {age:.0f}s)")

        for attempt in range(PriceService.MAX_RETRIES):
            try:
                headers = {"X-Api-Key": PriceService.API_KEY}
                params = {"ticker": symbol}
                
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(
                        PriceService.API_NINJAS_URL,
                        headers=headers,
                        params=params
                    )
                    response.raise_for_status()
                    data = response.json()

                    # API Ninjas returns price in pence for UK stocks (LSE)
                    # For other exchanges, it's in the local currency unit
                    price = data.get("price")
                    if price is None:
                        logger.warning(f"[PriceService] No price data for {symbol}")
                        return None
                    
                    # API returns in pence for UK stocks, so just round to integer
                    # Store as string to maintain precision
                    price_in_pence = str(int(float(price)))
                    
                    # Cache the result
                    PriceService._price_cache[symbol] = (price_in_pence, now)
                    logger.info(f"[PriceService] Fetched price for {symbol}: {price_in_pence}p from API Ninjas")
                    return price_in_pence

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:  # Too Many Requests
                    if attempt < PriceService.MAX_RETRIES - 1:
                        backoff = PriceService.INITIAL_BACKOFF * (2 ** attempt)
                        logger.warning(f"[PriceService] Rate limited for {symbol}, retrying in {backoff}s: {e}")
                        await asyncio.sleep(backoff)
                        continue
                logger.error(f"[PriceService] HTTP error fetching {symbol}: {e.response.status_code} - {e}")
                return None
            except httpx.RequestError as e:
                logger.error(f"[PriceService] Request error fetching {symbol}: {e}")
                return None
            except (KeyError, ValueError, TypeError) as e:
                logger.error(f"[PriceService] Parse error for {symbol}: {e}")
                return None
            except Exception as e:
                logger.error(f"[PriceService] Unexpected error fetching {symbol}: {e}")
                return None
        
        return None
