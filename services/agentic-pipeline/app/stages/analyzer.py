from __future__ import annotations

import re

from app.models import PipelineState


def run_analyzer(state: PipelineState) -> PipelineState:
    headings: list[str] = []
    faq_candidates: list[str] = []
    noise_hits = 0

    noise_patterns = (
        r"cookie",
        r"privacy policy",
        r"subscribe to our newsletter",
        r"all rights reserved",
    )

    for page in state.pages:
        for line in page.markdown.splitlines():
            stripped = line.strip()
            if stripped.startswith("#"):
                headings.append(stripped.lstrip("# ").strip())
            if "?" in stripped and 10 < len(stripped) < 200:
                faq_candidates.append(stripped)
            lower = stripped.lower()
            if any(re.search(p, lower) for p in noise_patterns):
                noise_hits += 1

    state.analysis = {
        "headings": headings[:40],
        "faq_candidates": faq_candidates[:20],
        "noise_hits": noise_hits,
        "page_count": len(state.pages),
    }
    state.log("analyzer", state.analysis)
    return state
