"""
Tests for authentication service.
"""
from app.services.auth import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_hash_password() -> None:
    """Test password hashing."""
    password = "TestPassword123"
    hashed = hash_password(password)

    assert hashed != password
    assert len(hashed) > 0


def test_verify_password() -> None:
    """Test password verification."""
    password = "TestPassword123"
    hashed = hash_password(password)

    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_create_access_token() -> None:
    """Test JWT token creation."""
    data = {"sub": "testuser"}
    token = create_access_token(data)

    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 0


def test_decode_access_token() -> None:
    """Test JWT token decoding."""
    data = {"sub": "testuser"}
    token = create_access_token(data)
    decoded = decode_access_token(token)

    assert decoded is not None
    assert decoded["sub"] == "testuser"
    assert "exp" in decoded


def test_decode_invalid_token() -> None:
    """Test decoding invalid token returns None."""
    decoded = decode_access_token("invalid.token.here")

    assert decoded is None
