"""
Authentication utilities for password hashing and JWT token generation.
"""
from datetime import datetime, timedelta
from typing import Any, Optional, cast

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# Password hashing context - use argon2 (more secure than bcrypt, no 72-byte limit)
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.

    Args:
        password: Plain text password

    Returns:
        Hashed password
    """
    return cast(str, pwd_context.hash(password))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.

    Args:
        plain_password: Plain text password
        hashed_password: Hashed password

    Returns:
        True if password matches, False otherwise
    """
    return cast(bool, pwd_context.verify(plain_password, hashed_password))


def create_access_token(data: dict[str, str], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: Data to encode in the token
        expires_delta: Token expiration time

    Returns:
        Encoded JWT token
    """
    to_encode: dict[str, Any] = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)

    to_encode.update({"exp": expire})
    encoded_jwt: str = cast(str, jwt.encode(
        to_encode, settings.secret_key, algorithm=settings.algorithm
    ))
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    """
    Decode and verify a JWT access token.

    Args:
        token: JWT token to decode

    Returns:
        Decoded token data or None if invalid
    """
    try:
        payload: dict[str, Any] = cast(dict[str, Any], jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        ))
        return payload
    except JWTError:
        return None
