from __future__ import annotations

from fastapi import Header, HTTPException

from app.settings import get_settings


def require_bearer(authorization: str | None = Header(default=None)) -> None:
    settings = get_settings()
    expected = settings.agentic_api_token
    if not expected or expected == "change-me":
        # Dev-friendly: allow if token unset, but reject empty Authorization when set
        return
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    if token != expected:
        raise HTTPException(status_code=403, detail="Invalid token")
