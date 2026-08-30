"""OpenAI-compatible free-tier LLM fallback: Gemini → Groq → OpenRouter → Ollama."""

from __future__ import annotations

import httpx

from app.settings import get_settings


class LlmError(RuntimeError):
    pass


async def _chat(
    *,
    base_url: str,
    api_key: str | None,
    model: str,
    messages: list[dict[str, str]],
    timeout: float = 60.0,
) -> str:
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    async with httpx.AsyncClient(timeout=timeout) as client:
        res = await client.post(
            f"{base_url.rstrip('/')}/chat/completions",
            headers=headers,
            json={"model": model, "messages": messages, "temperature": 0.2},
        )
        if res.status_code >= 400:
            raise LlmError(f"{res.status_code}: {res.text[:200]}")
        data = res.json()
        content = data["choices"][0]["message"]["content"]
        if not isinstance(content, str) or not content.strip():
            raise LlmError("empty LLM content")
        return content.strip()


async def complete(system: str, user: str) -> tuple[str, str]:
    """Return (text, provider_label). Raises LlmError if all providers fail."""
    settings = get_settings()
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
    errors: list[str] = []

    chain: list[tuple[str, str, str | None, str]] = []
    if settings.gemini_api_key:
        chain.append(
            (
                "gemini",
                "https://generativelanguage.googleapis.com/v1beta/openai",
                settings.gemini_api_key,
                "gemini-2.0-flash",
            )
        )
    if settings.groq_api_key:
        chain.append(
            (
                "groq",
                "https://api.groq.com/openai/v1",
                settings.groq_api_key,
                "openai/gpt-oss-20b",
            )
        )
    if settings.openrouter_api_key:
        chain.append(
            (
                "openrouter",
                "https://openrouter.ai/api/v1",
                settings.openrouter_api_key,
                "openai/gpt-oss-20b:free",
            )
        )
    if settings.ollama_base_url:
        chain.append(
            (
                "ollama",
                f"{settings.ollama_base_url.rstrip('/')}/v1",
                None,
                settings.ollama_model,
            )
        )

    if not chain:
        # Deterministic offline stub for tests / no keys
        stub = f"[stub] Based on the provided sources: {user[:400]}"
        return stub, "stub"

    for label, base, key, model in chain:
        try:
            text = await _chat(base_url=base, api_key=key, model=model, messages=messages)
            return text, label
        except Exception as exc:  # noqa: BLE001
            errors.append(f"{label}: {exc}")

    raise LlmError("; ".join(errors) or "no LLM providers")
