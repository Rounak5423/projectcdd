"""
CIVORA Engine — Production Environment Configuration & Validation (Phase 10)
Centralizes typed configuration, startup invariants validation, and environment defaults.
"""

import os
import sys
from typing import List


class Settings:
    def __init__(self):
        self.ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development").lower()
        self.HOST: str = os.getenv("HOST", "0.0.0.0")
        self.PORT: int = int(os.getenv("PORT", "8000"))
        self.LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()

        # Database
        self.DB_PATH: str = os.getenv(
            "GENESIS_DB_PATH",
            os.path.join(os.path.dirname(__file__), "db", "genesis.db")
        )

        # Security & Authentication
        self.JWT_SECRET: str = os.getenv("GENESIS_JWT_SECRET", "genesis_super_secret_jwt_key_2026_dev")
        self.JWT_ALGORITHM: str = "HS256"
        self.ACCESS_TOKEN_EXPIRE_HOURS: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_HOURS", "24"))

        # CORS
        raw_origins = os.getenv("ALLOWED_ORIGINS", "")
        if raw_origins:
            self.ALLOWED_ORIGINS: List[str] = [orig.strip() for orig in raw_origins.split(",") if orig.strip()]
        else:
            if self.ENVIRONMENT == "production":
                self.ALLOWED_ORIGINS = []
            else:
                self.ALLOWED_ORIGINS = ["*"]

        # Rate Limiting (Requests per minute per IP)
        self.AUTH_RATE_LIMIT_PER_MINUTE: int = int(os.getenv("AUTH_RATE_LIMIT_PER_MINUTE", "30"))

        # AI Providers
        self.OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
        self.ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
        self.GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

        # Capacity & Concurrency (Phases 5, 6, 9)
        self.MAX_WS_CONNECTIONS_PER_WORLD: int = int(os.getenv("MAX_WS_CONNECTIONS_PER_WORLD", "250"))
        self.MAX_WS_TOTAL_CONNECTIONS: int = int(os.getenv("MAX_WS_TOTAL_CONNECTIONS", "1000"))
        self.MAX_AI_CONCURRENCY: int = int(os.getenv("MAX_AI_CONCURRENCY", "6"))
        self.MAX_AI_QUEUE_DEPTH: int = int(os.getenv("MAX_AI_QUEUE_DEPTH", "32"))

    def validate_production_invariants(self) -> None:
        """
        Validates critical configuration keys in production mode.
        Fails fast if critical keys are insecure or missing.
        """
        if self.ENVIRONMENT == "production":
            errors = []
            if self.JWT_SECRET == "genesis_super_secret_jwt_key_2026_dev" or len(self.JWT_SECRET) < 32:
                errors.append(
                    "CRITICAL SECURITY FAILURE: GENESIS_JWT_SECRET must be explicitly set "
                    "to a high-entropy secret (at least 32 characters) in production mode."
                )

            if "*" in self.ALLOWED_ORIGINS:
                errors.append(
                    "SECURITY WARNING: Wildcard '*' in ALLOWED_ORIGINS is unsafe when credentials are used. "
                    "Specify exact allowed domains in ALLOWED_ORIGINS (e.g., https://civora.example.com)."
                )

            if errors:
                err_msg = "\n[CIVORA PRODUCTION CONFIGURATION ERROR]\n" + "\n".join(f" - {e}" for e in errors)
                raise RuntimeError(err_msg)


settings = Settings()
