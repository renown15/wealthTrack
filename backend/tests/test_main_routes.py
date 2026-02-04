"""
Tests for main.py routes to ensure all endpoints are covered.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient) -> None:
    """Test root endpoint returns expected response."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "WealthTrack API"
    assert "version" in data


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient) -> None:
    """Test health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
