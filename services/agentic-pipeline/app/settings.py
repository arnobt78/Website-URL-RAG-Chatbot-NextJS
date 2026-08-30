from __future__ import annotations

import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

# Tokens that must never be used in production / secure mode
INSECURE_TOKEN_PLACEHOLDERS = frozenset(
    {
        "",
        "change-me",
        "change-me-to-a-long-random-token",
        "YOUR_TOKEN",
        "your-token",
        "secret",
        "password",
    }
)

MIN_SECURE_TOKEN_LEN = 32


def _truthy(raw: str | None) -> bool:
    return (raw or "").strip().lower() in {"1", "true", "yes", "on"}


def is_token_secure(token: str | None) -> bool:
    """Strong enough for fail-closed HTTP API auth."""
    if not token:
        return False
    t = token.strip()
    if t.lower() in INSECURE_TOKEN_PLACEHOLDERS:
        return False
    if len(t) < MIN_SECURE_TOKEN_LEN:
        return False
    return True


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    agentic_api_token: str = ""
    allow_insecure_dev: bool = False
    crawl4ai_base_url: str | None = None
    crawl4ai_api_token: str | None = None
    firecrawl_api_key: str | None = None
    gemini_api_key: str | None = None
    groq_api_key: str | None = None
    openrouter_api_key: str | None = None
    ollama_base_url: str | None = None
    ollama_model: str = "llama3.2"
    max_debate_rounds: int = 3

    def auth_is_secure(self) -> bool:
        return is_token_secure(self.agentic_api_token)

    def may_boot(self) -> bool:
        """Allow process start: secure token OR explicit insecure-dev opt-in."""
        return self.auth_is_secure() or self.allow_insecure_dev


@lru_cache
def get_settings() -> Settings:
    rounds_raw = os.getenv("MAX_DEBATE_ROUNDS", "3").strip()
    try:
        max_rounds = max(1, min(8, int(rounds_raw)))
    except ValueError:
        max_rounds = 3
    return Settings(
        agentic_api_token=(os.getenv("AGENTIC_API_TOKEN") or "").strip(),
        allow_insecure_dev=_truthy(os.getenv("AGENTIC_ALLOW_INSECURE_DEV")),
        crawl4ai_base_url=os.getenv("CRAWL4AI_BASE_URL") or None,
        crawl4ai_api_token=os.getenv("CRAWL4AI_API_TOKEN") or None,
        firecrawl_api_key=os.getenv("FIRECRAWL_API_KEY") or None,
        gemini_api_key=os.getenv("GEMINI_API_KEY") or None,
        groq_api_key=os.getenv("GROQ_API_KEY") or None,
        openrouter_api_key=os.getenv("OPENROUTER_API_KEY") or None,
        ollama_base_url=os.getenv("OLLAMA_BASE_URL") or None,
        ollama_model=os.getenv("OLLAMA_MODEL", "llama3.2"),
        max_debate_rounds=max_rounds,
    )
