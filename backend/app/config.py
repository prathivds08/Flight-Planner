from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables / .env file."""

    airlabs_api_key: Optional[str] = None
    use_mock_data: bool = True
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

# Auto-enable live data when an AirLabs API key is available
if settings.airlabs_api_key:
    settings.use_mock_data = False
