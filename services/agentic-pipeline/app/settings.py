from __future__ import annotations

import os
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    agentic_api_token: str = "change-me"
    crawl4ai_base_url: str | None = None
    crawl4ai_api_token: str | None = None
    firecrawl_api_key: str | None = None
    gemini_api_key: str | None = None
    groq_api_key: str | None = None
    openrouter_api_key: str | None = None
    ollama_base_url: str | None = None
    ollama_model: str = "llama3.2"


@lru_cache
def get_settings() -> Settings:
    return Settings(
        agentic_api_token=os.getenv("AGENTIC_API_TOKEN", "change-me"),
        crawl4ai_base_url=os.getenv("CRAWL4AI_BASE_URL") or None,
        crawl4ai_api_token=os.getenv("CRAWL4AI_API_TOKEN") or None,
        firecrawl_api_key=os.getenv("FIRECRAWL_API_KEY") or None,
        gemini_api_key=os.getenv("GEMINI_API_KEY") or None,
        groq_api_key=os.getenv("GROQ_API_KEY") or None,
        openrouter_api_key=os.getenv("OPENROUTER_API_KEY") or None,
        ollama_base_url=os.getenv("OLLAMA_BASE_URL") or None,
        ollama_model=os.getenv("OLLAMA_MODEL", "llama3.2"),
    )
