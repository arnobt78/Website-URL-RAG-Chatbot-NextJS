from __future__ import annotations

import pytest

from app.models import PageDoc, PipelineState
from app.stages.analyzer import run_analyzer
from app.stages.assembler import run_assembler
from app.stages.optimizer import run_optimizer
from app.stages.preprocessor import run_preprocessor
from app.stages.validator import run_validator
from app.pipeline import run_pipeline


def test_validator_rejects_empty_draft():
    state = PipelineState(url="https://example.com", question="What is this?")
    state.ranked_chunks = ["Example Domain is for use in documentation examples."]
    state.draft = "Hi"
    state = run_validator(state)
    assert state.rejected
    assert "empty_or_too_short" in state.reject_reason


def test_validator_rejects_ungrounded():
    state = PipelineState(url="https://example.com", question="What is this?")
    state.ranked_chunks = ["Example Domain is for use in illustrative examples in documents."]
    state.draft = (
        "The quantum teleportation protocol uses entangled qubits across galaxies "
        "and requires a warp drive calibration sequence."
    )
    state = run_validator(state)
    assert state.rejected
    assert "ungrounded" in state.reject_reason


def test_validator_accepts_grounded():
    source = (
        "Example Domain. This domain is for use in illustrative examples in documents. "
        "You may use this domain in literature without prior coordination or asking for permission."
    )
    state = PipelineState(url="https://example.com", question="What is example.com for?")
    state.ranked_chunks = [source]
    state.draft = (
        "Example Domain is for use in illustrative examples in documents "
        "without prior coordination or asking for permission."
    )
    state = run_validator(state)
    assert not state.rejected


def test_preprocessor_and_optimizer():
    state = PipelineState(url="https://example.com", question="example domain documents")
    state.pages = [
        PageDoc(
            url="https://example.com",
            markdown="# Example\n\nThis domain is for use in illustrative examples in documents.\n\nCookie policy subscribe to our newsletter.",
        )
    ]
    state = run_analyzer(state)
    state = run_preprocessor(state)
    assert state.chunks
    state = run_optimizer(state)
    assert state.ranked_chunks


@pytest.mark.asyncio
async def test_pipeline_end_to_end_stub_llm(monkeypatch):
    async def fake_extract(state: PipelineState) -> PipelineState:
        state.pages = [
            PageDoc(
                url="https://example.com",
                markdown=(
                    "Example Domain is for use in illustrative examples in documents. "
                    "You may use this domain in literature without prior coordination."
                ),
            )
        ]
        state.sources = ["https://example.com"]
        state.log("extractor", {"pages": 1, "chars": len(state.pages[0].markdown)})
        return state

    monkeypatch.setattr("app.pipeline.run_extractor", fake_extract)
    # Force stub LLM (no keys)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    monkeypatch.delenv("OLLAMA_BASE_URL", raising=False)
    from app.settings import get_settings

    get_settings.cache_clear()

    result = await run_pipeline("https://example.com", "What is example domain for?")
    assert result["trace_id"]
    assert result["answer"]
    assert "extractor" in [t["stage"] for t in result["trace"]]
    assert "assembler" in [t["stage"] for t in result["trace"]]


def test_assembler_sets_reject_message():
    state = PipelineState(url="https://example.com", question="q")
    state.rejected = True
    state.reject_reason = "ungrounded"
    state.draft = "bad"
    state = run_assembler(state)
    assert "could not produce" in state.answer.lower()
    assert state.scores["accepted"] == 0.0
