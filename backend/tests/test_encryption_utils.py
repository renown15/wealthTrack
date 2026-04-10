"""Tests for encryption utilities."""
from app.utils.encryption import (
    decrypt_value,
    encrypt_value,
    get_encryption_key,
)


def test_get_encryption_key_from_cache() -> None:
    """Test retrieving key from cache."""
    key = get_encryption_key()
    assert key is not None
    assert isinstance(key, bytes)


def test_get_encryption_key_default() -> None:
    """Test getting default encryption key."""
    key = get_encryption_key()
    assert key is not None
    assert len(key) > 0


def test_encrypt_value_empty_string() -> None:
    """Test encrypting empty string returns empty string."""
    result = encrypt_value("")
    assert result == ""


def test_encrypt_value_none_string() -> None:
    """Test encrypting None returns None."""
    result = encrypt_value(None)
    assert result is None


def test_encrypt_value_normal_string() -> None:
    """Test encrypting normal string."""
    plaintext = "test_secret_value"
    encrypted = encrypt_value(plaintext)

    # Should produce output
    assert encrypted
    assert encrypted != plaintext


def test_decrypt_value_empty_string() -> None:
    """Test decrypting empty string returns empty string."""
    result = decrypt_value("")
    assert result == ""


def test_decrypt_value_none_string() -> None:
    """Test decrypting None returns None."""
    result = decrypt_value(None)
    assert result is None


def test_encrypt_decrypt_roundtrip() -> None:
    """Test that encryption and decryption are inverse operations."""
    plaintext = "sensitive_data_123"
    encrypted = encrypt_value(plaintext)
    decrypted = decrypt_value(encrypted)

    assert decrypted == plaintext


def test_decrypt_invalid_token() -> None:
    """Test decrypting invalid token returns it as-is."""
    invalid_ciphertext = "invalid_base64_and_token"
    result = decrypt_value(invalid_ciphertext)

    # Should return the invalid ciphertext (fallback)
    assert result == invalid_ciphertext


def test_decrypt_invalid_base64() -> None:
    """Test decrypting invalid base64 returns it as-is."""
    invalid_base64 = "!!!invalid!!!base64!!!"
    result = decrypt_value(invalid_base64)

    # Should return the invalid value (fallback)
    assert result == invalid_base64


def test_encrypt_special_characters() -> None:
    """Test encrypting text with special characters."""
    plaintext = "!@#$%^&*()_+-=[]{}|;':,.<>?/~`"
    encrypted = encrypt_value(plaintext)
    decrypted = decrypt_value(encrypted)

    assert decrypted == plaintext


def test_encrypt_unicode() -> None:
    """Test encrypting unicode text."""
    plaintext = "Hello 世界 مرحبا мир"
    encrypted = encrypt_value(plaintext)
    decrypted = decrypt_value(encrypted)

    assert decrypted == plaintext


def test_encrypt_long_string() -> None:
    """Test encrypting very long string."""
    plaintext = "x" * 10000
    encrypted = encrypt_value(plaintext)
    decrypted = decrypt_value(encrypted)

    assert decrypted == plaintext
