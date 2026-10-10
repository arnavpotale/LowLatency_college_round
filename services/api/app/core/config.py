import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Second Opinion API"
    app_version: str = "0.1.0"
    app_env: str = "development"
    debug: bool = True

    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    database_url: str = "sqlite:///./second_opinion.db"

    upload_dir: str = "./uploads"
    max_upload_size_bytes: int = 10 * 1024 * 1024  # 10 MB
    allowed_extensions: str = "pdf,txt,md"

    enable_mock_verification: bool = True

    # External LLM / Provider configuration (optional in initial foundation)
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    anthropic_api_key: str | None = None
    huggingface_api_key: str | None = None
    embedding_model: str = "all-MiniLM-L6-v2"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip().lower() for ext in self.allowed_extensions.split(",") if ext.strip()]


settings = Settings()
