"""Tests for authentication dependency helpers."""

import pytest
from fastapi import HTTPException

from app.controllers.dependencies import get_current_user, get_current_user_from_token
from app.services.auth import create_access_token


class DummyRequest:
    """Minimal fake request that only exposes headers."""

    def __init__(self, headers: dict[str, str]) -> None:
        self.headers = headers


@pytest.mark.asyncio
async def test_get_current_user_from_token_missing_header() -> None:
    request = DummyRequest(headers={})

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user_from_token(request)

    assert exc_info.value.status_code == 401
    assert "Missing authorization" in exc_info.value.detail


@pytest.mark.asyncio
async def test_get_current_user_from_token_invalid_header_format() -> None:
    request = DummyRequest(headers={"authorization": "InvalidHeader"})

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user_from_token(request)

    assert exc_info.value.status_code == 401
    assert "Invalid authorization header format" in exc_info.value.detail


@pytest.mark.asyncio
async def test_get_current_user_from_token_invalid_token() -> None:
    request = DummyRequest(headers={"authorization": "Bearer invalid.token"})

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user_from_token(request)

    assert exc_info.value.status_code == 401
    assert "Invalid or expired token" in exc_info.value.detail


@pytest.mark.asyncio
async def test_get_current_user_from_token_success() -> None:
    token = create_access_token({"sub": "1"})
    request = DummyRequest(headers={"authorization": f"Bearer {token}"})

    payload = await get_current_user_from_token(request)

    assert payload["sub"] == "1"
    assert "exp" in payload


@pytest.mark.asyncio
async def test_get_current_user_returns_user(db_session, user) -> None:
    payload = {"sub": str(user.id)}

    current_user = await get_current_user(payload, db_session)

    assert current_user.id == user.id


@pytest.mark.asyncio
async def test_get_current_user_user_not_found(db_session) -> None:
    payload = {"sub": "999999"}

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(payload, db_session)

    assert exc_info.value.status_code == 401
    assert "User not found" in exc_info.value.detail


@pytest.mark.asyncio
async def test_get_current_user_invalid_payload(db_session) -> None:
    with pytest.raises(HTTPException) as exc_info:
        await get_current_user({}, db_session)

    assert exc_info.value.status_code == 401
    assert "Invalid token payload" in exc_info.value.detail


@pytest.mark.asyncio
async def test_get_current_user_invalid_user_id(db_session) -> None:
    payload = {"sub": "abc"}

    with pytest.raises(HTTPException) as exc_info:
        await get_current_user(payload, db_session)

    assert exc_info.value.status_code == 401
    assert "Invalid user ID" in exc_info.value.detail
