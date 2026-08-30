from __future__ import annotations

import re

from app.models import PipelineState

HALLUCINATION_MARKERS = (
    "as an ai",
    "i made this up",
    "no sources needed",
)


def run_validator(state: PipelineState) -> PipelineState:
    draft = (state.draft or "").strip()
    reasons: list[str] = []

    if len(draft) < 20:
        reasons.append("empty_or_too_short")

    source_blob = " ".join(state.ranked_chunks).lower()
    if not source_blob.strip():
        reasons.append("no_source_chunks")

    # Groundedness heuristic: require overlap of content words with sources
    words = [w for w in re.findall(r"[a-z0-9]{4,}", draft.lower()) if w not in {"that", "this", "with", "from", "have", "does", "about"}]
    if words and source_blob:
        hits = sum(1 for w in words[:40] if w in source_blob)
        overlap = hits / max(1, min(40, len(words)))
        state.scores["groundedness"] = overlap
        if overlap < 0.08 and "do not know" not in draft.lower() and "don't know" not in draft.lower():
            reasons.append("ungrounded")
    else:
        state.scores["groundedness"] = 0.0

    lower = draft.lower()
    if any(m in lower for m in HALLUCINATION_MARKERS):
        reasons.append("hallucination_marker")

    ok = len(reasons) == 0
    state.validation = {"ok": ok, "reasons": reasons}
    if not ok:
        state.rejected = True
        state.reject_reason = ",".join(reasons)
    state.log("validator", state.validation)
    return state
