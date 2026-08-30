from __future__ import annotations

import logging

from fastapi import Header, HTTPException

from app.settings import get_settings, is_token_secure

logger = logging.getLogger(__name__)


def require_bearer(authorization: str | None = Header(default=None)) -> None:
    """
    Fail-closed by default: require a strong Bearer token.
    Opt-in open mode only when AGENTIC_ALLOW_INSECURE_DEV=true (local demos).
    """
    settings = get_settings()

    if not settings.auth_is_secure():
        if settings.allow_insecure_dev:
            return
        raise HTTPException(
            status_code=503,
            detail=(
                "AGENTIC_API_TOKEN is missing or insecure. "
                "Set a token ≥32 chars (see ./scripts/gen-local-service-env.sh), "
                "or set AGENTIC_ALLOW_INSECURE_DEV=true for local demos only."
            ),
        )

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    if token != settings.agentic_api_token:
        raise HTTPException(status_code=403, detail="Invalid token")


def assert_can_boot() -> None:
    """Call at app lifespan startup — refuse insecure deploy without opt-in."""
    settings = get_settings()
    if settings.may_boot():
        if settings.allow_insecure_dev and not settings.auth_is_secure():
            logger.warning(
                "AGENTIC_ALLOW_INSECURE_DEV=true — HTTP API auth is DISABLED. "
                "Never use this on Coolify/public hosts."
            )
        return
    raise RuntimeError(
        "Refusing to start: AGENTIC_API_TOKEN is missing, a known placeholder, "
        f"or shorter than 32 characters (secure={is_token_secure(settings.agentic_api_token)}). "
        "Run ./scripts/gen-local-service-env.sh or set a strong token in Coolify. "
        "For local demos only: AGENTIC_ALLOW_INSECURE_DEV=true"
    )
