from __future__ import annotations

import pytest

from app.models import PageDoc, PipelineState
from app.stages.crawl_qa import score_crawl_quality
from app.stages.validator import boss_decide


def test_boss_rejects_both_ungrounded():
    sources = ["Example Domain is for use in illustrative examples in documents."]
    decision = boss_decide(
        "Quantum warp drives enable interstellar travel across galaxies instantly.",
        "Teleportation protocols require entangled neutrinos and dark matter fuel.",
        sources,
        crawl_quality=0.5,
    )
    assert decision["decision"] == "revise"
    assert decision["winner"] is None


def test_boss_prefers_higher_groundedness():
    source = (
        "Example Domain is for use in illustrative examples in documents. "
        "You may use this domain in literature without prior coordination or asking for permission."
    )
    good = (
        "Example Domain is for use in illustrative examples in documents "
        "without prior coordination or asking for permission."
    )
    weak = "This site exists."
    decision = boss_decide(good, weak, [source], crawl_quality=0.8)
    assert decision["decision"] == "accept_a"
    assert decision["winner"] == "a"
    assert decision["score_a"] >= decision["score_b"]


def test_boss_accepts_b_when_a_fails():
    source = (
        "Example Domain is for use in illustrative examples in documents. "
        "You may use this domain in literature without prior coordination."
    )
    bad = "Warp drive calibration sequence complete."
    good = (
        "Example Domain is for use in illustrative examples in documents "
        "without prior coordination."
    )
    decision = boss_decide(bad, good, [source], crawl_quality=0.8)
    assert decision["decision"] == "accept_b"
    assert decision["winner"] == "b"


def test_boss_hard_reject_when_no_chunks():
    decision = boss_decide("short", "also short text here enough", [], crawl_quality=0.0)
    assert decision["decision"] == "reject"


def test_crawl_qa_thin_content():
    qa = score_crawl_quality([PageDoc(url="https://x.com", markdown="hi")])
    assert qa["thin_content"] is True
    assert qa["ok"] is False


def test_crawl_qa_rich_page():
    md = "# FAQ\n\n## What is this?\n\n" + ("Example Domain documents literature. " * 40)
    qa = score_crawl_quality([PageDoc(url="https://example.com", markdown=md)])
    assert qa["quality_score"] > 0.2
    assert qa["heading_count"] >= 1


@pytest.mark.asyncio
async def test_debate_stops_within_max_rounds(monkeypatch):
    from app.models import PageDoc, PipelineState
    from app import debate as debate_mod

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
        state.log("extractor", {"pages": 1})
        return state

    call_count = {"n": 0}

    async def fake_complete(system: str, user: str, *, temperature: float = 0.2):
        call_count["n"] += 1
        # Always return grounded stub-like text from sources
        return (
            "Example Domain is for use in illustrative examples in documents "
            "without prior coordination.",
            "stub",
        )

    monkeypatch.setattr(debate_mod, "run_extractor", fake_extract)
    monkeypatch.setattr(debate_mod, "complete", fake_complete)
    monkeypatch.setenv("MAX_DEBATE_ROUNDS", "3")
    from app.settings import get_settings

    get_settings.cache_clear()

    result = await debate_mod.run_debate(
        "https://example.com", "What is example domain for?"
    )
    assert result["trace_id"]
    assert result["winner"] in ("a", "b")
    assert result["rejected"] is False
    assert len(result["rounds"]) >= 1
    assert len(result["rounds"]) <= 3
    assert "crawl_qa" in result
    assert call_count["n"] >= 2
