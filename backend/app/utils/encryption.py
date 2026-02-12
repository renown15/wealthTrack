"""Encryption utilities for sensitive data."""
import os
from base64 import b64decode, b64encode

from cryptography.fernet import Fernet, InvalidToken

# Cache the key to avoid generating multiple times
_ENCRYPTION_KEY_CACHE = None


def get_encryption_key() -> bytes:
    """Get or generate the encryption key from environment."""
    global _ENCRYPTION_KEY_CACHE  # pylint: disable=global-statement

    if _ENCRYPTION_KEY_CACHE is not None:
        return _ENCRYPTION_KEY_CACHE

    key_str = os.getenv("ENCRYPTION_KEY")
    if key_str:
        _ENCRYPTION_KEY_CACHE = (
            key_str.encode() if isinstance(key_str, str) else key_str
        )
        return _ENCRYPTION_KEY_CACHE

    # Use a default key for development/testing
    # In production, ENCRYPTION_KEY must be set via environment
    default_key = b"Cz_99YIHMB-xXdaRIKPx8k3yeoVFexf4z2xqzbXpmIw="
    _ENCRYPTION_KEY_CACHE = default_key
    return default_key


def encrypt_value(plaintext: str) -> str:
    """Encrypt a string value."""
    if not plaintext:
        return plaintext

    key = get_encryption_key()
    f = Fernet(key)
    encrypted = f.encrypt(plaintext.encode())
    return b64encode(encrypted).decode()


def decrypt_value(ciphertext: str) -> str:
    """Decrypt an encrypted string value."""
    if not ciphertext:
        return ciphertext

    try:
        key = get_encryption_key()
        f = Fernet(key)
        encrypted = b64decode(ciphertext.encode())
        decrypted = f.decrypt(encrypted)
        return decrypted.decode()
    except (InvalidToken, ValueError):
        # Return as-is if decryption fails (for backward compatibility)
        return ciphertext
