from __future__ import annotations

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.auth import assert_can_boot, require_bearer
from app.settings import get_settings, is_token_secure


SECURE_TOKEN = "a" * 32


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_is_token_secure_rejects_placeholders():
    assert not is_token_secure(None)
    assert not is_token_secure("")
    assert not is_token_secure("change-me")
    assert not is_token_secure("change-me-to-a-long-random-token")
    assert not is_token_secure("short")
    assert is_token_secure(SECURE_TOKEN)


def test_assert_can_boot_refuses_insecure(monkeypatch):
    monkeypatch.setenv("AGENTIC_API_TOKEN", "change-me")
    monkeypatch.delenv("AGENTIC_ALLOW_INSECURE_DEV", raising=False)
    get_settings.cache_clear()
    with pytest.raises(RuntimeError, match="Refusing to start"):
        assert_can_boot()


def test_assert_can_boot_allows_insecure_dev(monkeypatch):
    monkeypatch.setenv("AGENTIC_API_TOKEN", "")
    monkeypatch.setenv("AGENTIC_ALLOW_INSECURE_DEV", "true")
    get_settings.cache_clear()
    assert_can_boot()


def test_assert_can_boot_allows_secure_token(monkeypatch):
    monkeypatch.setenv("AGENTIC_API_TOKEN", SECURE_TOKEN)
    monkeypatch.delenv("AGENTIC_ALLOW_INSECURE_DEV", raising=False)
    get_settings.cache_clear()
    assert_can_boot()


def test_require_bearer_fail_closed_without_token(monkeypatch):
    monkeypatch.setenv("AGENTIC_API_TOKEN", "change-me")
    monkeypatch.delenv("AGENTIC_ALLOW_INSECURE_DEV", raising=False)
    get_settings.cache_clear()
    with pytest.raises(HTTPException) as exc:
        require_bearer(authorization=None)
    assert exc.value.status_code == 503


def test_require_bearer_accepts_matching_token(monkeypatch):
    monkeypatch.setenv("AGENTIC_API_TOKEN", SECURE_TOKEN)
    monkeypatch.delenv("AGENTIC_ALLOW_INSECURE_DEV", raising=False)
    get_settings.cache_clear()
    require_bearer(authorization=f"Bearer {SECURE_TOKEN}")


def test_require_bearer_rejects_wrong_token(monkeypatch):
    monkeypatch.setenv("AGENTIC_API_TOKEN", SECURE_TOKEN)
    get_settings.cache_clear()
    with pytest.raises(HTTPException) as exc:
        require_bearer(authorization="Bearer wrong-token-that-is-long-enough-xx")
    assert exc.value.status_code == 403


def test_api_401_without_bearer(monkeypatch):
    monkeypatch.setenv("AGENTIC_API_TOKEN", SECURE_TOKEN)
    monkeypatch.delenv("AGENTIC_ALLOW_INSECURE_DEV", raising=False)
    get_settings.cache_clear()
    from app.main import app

    with TestClient(app) as client:
        res = client.get("/v1/stages")
        assert res.status_code == 401


def test_api_400_on_private_url(monkeypatch):
    monkeypatch.setenv("AGENTIC_API_TOKEN", SECURE_TOKEN)
    get_settings.cache_clear()
    from app.main import app

    with TestClient(app) as client:
        res = client.post(
            "/v1/pipeline",
            headers={"Authorization": f"Bearer {SECURE_TOKEN}"},
            json={"url": "http://127.0.0.1/", "question": "What is this site?"},
        )
        assert res.status_code == 400
