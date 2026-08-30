from __future__ import annotations

from unittest.mock import patch

import pytest

from app.models import PipelineState
from app.stages.extractor import run_extractor
from app.url_safety import assert_safe_public_url


def test_rejects_non_http_scheme():
    with pytest.raises(ValueError, match="http"):
        assert_safe_public_url("file:///etc/passwd")


def test_rejects_localhost():
    with pytest.raises(ValueError, match="not allowed"):
        assert_safe_public_url("http://localhost/admin")


def test_rejects_loopback_ip():
    with pytest.raises(ValueError, match="not allowed"):
        assert_safe_public_url("http://127.0.0.1/")


def test_rejects_private_ip():
    with pytest.raises(ValueError, match="not allowed"):
        assert_safe_public_url("http://192.168.1.1/")


def test_rejects_metadata_ip():
    with pytest.raises(ValueError, match="not allowed"):
        assert_safe_public_url("http://169.254.169.254/latest/meta-data/")


def test_rejects_dns_to_private():
    # Simulate hostname resolving to RFC1918
    fake = [
        (2, 1, 6, "", ("10.0.0.5", 0)),
    ]
    with patch("app.url_safety.socket.getaddrinfo", return_value=fake):
        with pytest.raises(ValueError, match="private|restricted"):
            assert_safe_public_url("https://evil.example/")


def test_allows_public_example():
    assert_safe_public_url("https://example.com/")


@pytest.mark.asyncio
async def test_extractor_skips_unsafe_url():
    state = PipelineState(url="http://127.0.0.1/", question="probe")
    state = await run_extractor(state)
    assert state.pages == []
    assert state.sources == []
    assert any(e.get("stage") == "extractor" for e in state.trace)
