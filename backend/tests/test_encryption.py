"""Tests for encryption utilities."""

import os
from unittest.mock import patch

import pytest

from app.utils.encryption import decrypt_value, encrypt_value, get_encryption_key


class TestEncryption:
    """Tests for encryption utilities."""

    def test_get_encryption_key_default(self):
        """Test getting default encryption key."""
        # Clear cache to ensure default is returned
        import app.utils.encryption as enc_module
        enc_module._ENCRYPTION_KEY_CACHE = None

        key = get_encryption_key()
        assert isinstance(key, bytes)
        assert len(key) > 0

    def test_get_encryption_key_cached(self):
        """Test that key is cached after first call."""
        import app.utils.encryption as enc_module
        enc_module._ENCRYPTION_KEY_CACHE = None

        key1 = get_encryption_key()
        key2 = get_encryption_key()
        assert key1 == key2

    @patch.dict(os.environ, {"ENCRYPTION_KEY": "test_key"})
    def test_get_encryption_key_from_env_string(self):
        """Test getting encryption key from environment as string."""
        import app.utils.encryption as enc_module
        enc_module._ENCRYPTION_KEY_CACHE = None

        key = get_encryption_key()
        assert isinstance(key, bytes)
        assert key == b"test_key"

    @patch.dict(os.environ, {"ENCRYPTION_KEY": ""})
    def test_get_encryption_key_empty_env(self):
        """Test that empty env var falls back to default."""
        import app.utils.encryption as enc_module
        enc_module._ENCRYPTION_KEY_CACHE = None

        # getenv returns empty string but that's falsy
        key = get_encryption_key()
        assert isinstance(key, bytes)

    def test_encrypt_decrypt_roundtrip(self):
        """Test that encryption and decryption work together."""
        plaintext = "test_value"
        encrypted = encrypt_value(plaintext)
        assert encrypted != plaintext
        assert isinstance(encrypted, str)

        decrypted = decrypt_value(encrypted)
        assert decrypted == plaintext

    def test_encrypt_empty_string(self):
        """Test that empty string returns empty."""
        result = encrypt_value("")
        assert result == ""

    def test_encrypt_none_value(self):
        """Test that None/falsy returns as-is."""
        result = encrypt_value(None)
        assert result is None

    def test_decrypt_empty_string(self):
        """Test that empty string returns empty."""
        result = decrypt_value("")
        assert result == ""

    def test_decrypt_none_value(self):
        """Test that None/falsy returns as-is."""
        result = decrypt_value(None)
        assert result is None

    def test_decrypt_invalid_data(self):
        """Test that invalid encrypted data returns as-is."""
        invalid_data = "not_valid_encrypted_data"
        result = decrypt_value(invalid_data)
        assert result == invalid_data

    def test_decrypt_corrupted_base64(self):
        """Test that corrupted base64 returns as-is."""
        corrupted = "!!!not_base64!!!"
        result = decrypt_value(corrupted)
        # Should return as-is due to error handling
        assert result == corrupted

    def test_encrypt_special_characters(self):
        """Test encryption with special characters."""
        plaintext = "test@#$%^&*()"
        encrypted = encrypt_value(plaintext)
        decrypted = decrypt_value(encrypted)
        assert decrypted == plaintext

    def test_encrypt_unicode(self):
        """Test encryption with unicode characters."""
        plaintext = "こんにちは世界"
        encrypted = encrypt_value(plaintext)
        decrypted = decrypt_value(encrypted)
        assert decrypted == plaintext
