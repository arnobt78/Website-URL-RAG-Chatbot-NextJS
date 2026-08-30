from __future__ import annotations

import re
from typing import Any

from app.models import PipelineState

HALLUCINATION_MARKERS = (
    "as an ai",
    "i made this up",
    "no sources needed",
)


def groundedness_score(draft: str, ranked_chunks: list[str]) -> tuple[float, list[str]]:
    """Return (overlap_score, rejection_reasons)."""
    text = (draft or "").strip()
    reasons: list[str] = []
    if len(text) < 20:
        reasons.append("empty_or_too_short")

    source_blob = " ".join(ranked_chunks).lower()
    if not source_blob.strip():
        reasons.append("no_source_chunks")
        return 0.0, reasons

    words = [
        w
        for w in re.findall(r"[a-z0-9]{4,}", text.lower())
        if w not in {"that", "this", "with", "from", "have", "does", "about"}
    ]
    if not words:
        reasons.append("empty_or_too_short")
        return 0.0, reasons

    hits = sum(1 for w in words[:40] if w in source_blob)
    overlap = hits / max(1, min(40, len(words)))
    if (
        overlap < 0.08
        and "do not know" not in text.lower()
        and "don't know" not in text.lower()
    ):
        reasons.append("ungrounded")

    lower = text.lower()
    if any(m in lower for m in HALLUCINATION_MARKERS):
        reasons.append("hallucination_marker")

    return overlap, reasons


def run_validator(state: PipelineState) -> PipelineState:
    overlap, reasons = groundedness_score(state.draft, state.ranked_chunks)
    state.scores["groundedness"] = overlap
    ok = len(reasons) == 0
    state.validation = {"ok": ok, "reasons": reasons}
    if not ok:
        state.rejected = True
        state.reject_reason = ",".join(reasons)
    state.log("validator", state.validation)
    return state


def boss_decide(
    draft_a: str,
    draft_b: str,
    ranked_chunks: list[str],
    *,
    crawl_quality: float = 1.0,
) -> dict[str, Any]:
    """
    Boss validator: compare drafts vs sources.
    Returns decision: accept_a | accept_b | revise | reject
    """
    score_a, reasons_a = groundedness_score(draft_a, ranked_chunks)
    score_b, reasons_b = groundedness_score(draft_b, ranked_chunks)

    # Prefer higher groundedness when both pass
    if not reasons_a and not reasons_b:
        if abs(score_a - score_b) < 0.02:
            winner = "a" if len(draft_a) >= len(draft_b) else "b"
        else:
            winner = "a" if score_a >= score_b else "b"
        return {
            "decision": f"accept_{winner}",
            "winner": winner,
            "score_a": score_a,
            "score_b": score_b,
            "reasons_a": reasons_a,
            "reasons_b": reasons_b,
            "feedback": None,
        }

    if not reasons_a and reasons_b:
        return {
            "decision": "accept_a",
            "winner": "a",
            "score_a": score_a,
            "score_b": score_b,
            "reasons_a": reasons_a,
            "reasons_b": reasons_b,
            "feedback": None,
        }

    if reasons_a and not reasons_b:
        return {
            "decision": "accept_b",
            "winner": "b",
            "score_a": score_a,
            "score_b": score_b,
            "reasons_a": reasons_a,
            "reasons_b": reasons_b,
            "feedback": None,
        }

    # Both failed — revise if crawl has some content; else reject
    feedback = (
        f"Both drafts failed grounding (A: {','.join(reasons_a) or 'n/a'}; "
        f"B: {','.join(reasons_b) or 'n/a'}). "
        "Rewrite using only source excerpts; cite concrete phrases from sources."
    )
    if crawl_quality >= 0.15 and ranked_chunks:
        return {
            "decision": "revise",
            "winner": None,
            "score_a": score_a,
            "score_b": score_b,
            "reasons_a": reasons_a,
            "reasons_b": reasons_b,
            "feedback": feedback,
        }

    return {
        "decision": "reject",
        "winner": None,
        "score_a": score_a,
        "score_b": score_b,
        "reasons_a": reasons_a,
        "reasons_b": reasons_b,
        "feedback": feedback,
    }
