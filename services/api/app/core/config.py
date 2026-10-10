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
    verification_provider: str = "deterministic"  # options: "deterministic", "mock", "nli", "llm"
    min_evidence_relevance: float = 0.20

    # Neural NLI CrossEncoder configuration
    nli_model_name: str = "cross-encoder/nli-deberta-v3-small"
    nli_device: str = "cpu"
    nli_entailment_threshold: float = 0.65
    nli_contradiction_threshold: float = 0.65
    nli_neutral_threshold: float = 0.50

    # External LLM / Provider configuration (optional in initial foundation)
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    llm_api_base: str | None = None
    anthropic_api_key: str | None = None
    huggingface_api_key: str | None = None
    # Document Chunking configuration
    chunk_size_chars: int = 600
    chunk_overlap_chars: int = 120
    max_chunk_tokens: int = 350

    # Evidence Retrieval configuration
    retrieval_strategy: str = "hybrid"  # options: "hybrid", "bm25", "dense", "lexical"
    retrieval_dense_weight: float = 0.5
    retrieval_bm25_weight: float = 0.5
    rrf_k: int = 60
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_device: str = "cpu"

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

    @property
    def resolved_verification_provider(self) -> str:
        """
        Determines the active verification provider with explicit precedence:
        1. If ENABLE_MOCK_VERIFICATION is True -> 'mock' (explicit simulation mode)
        2. If VERIFICATION_PROVIDER is explicitly set to 'mock' -> 'mock'
        3. Otherwise -> VERIFICATION_PROVIDER (e.g. 'deterministic', 'nli', 'llm')
        """
        if self.enable_mock_verification:
            return "mock"
        provider = self.verification_provider.lower().strip()
        if provider in ["mock", "simulation"]:
            return "mock"
        if provider in ["nli", "neural", "deberta"]:
            return "nli"
        return provider

    @property
    def is_mock_active(self) -> bool:
        """True if the system is configured to produce mock verification results."""
        return self.resolved_verification_provider == "mock"


settings = Settings()
