"""
Application configuration using Pydantic settings.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Database
    database_url: str = "postgresql+asyncpg://wealthtrack:password@localhost:5432/wealthtrack"

    # Security
    secret_key: str = "change-this-to-a-random-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Application
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
