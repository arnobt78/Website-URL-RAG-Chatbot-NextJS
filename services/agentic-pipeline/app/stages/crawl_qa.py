from __future__ import annotations

from app.models import PageDoc, PipelineState

BOILERPLATE = (
    "cookie",
    "privacy policy",
    "newsletter",
    "all rights reserved",
    "subscribe",
)


def score_crawl_quality(pages: list[PageDoc]) -> dict[str, float | int | bool]:
    """Heuristic crawl/harvest QA — thin content, headings, FAQ signals, noise."""
    if not pages:
        return {
            "ok": False,
            "page_count": 0,
            "total_chars": 0,
            "heading_count": 0,
            "faq_signals": 0,
            "boilerplate_hits": 0,
            "quality_score": 0.0,
            "thin_content": True,
        }

    total_chars = sum(len(p.markdown) for p in pages)
    heading_count = 0
    faq_signals = 0
    boilerplate_hits = 0
    for page in pages:
        for line in page.markdown.splitlines():
            s = line.strip()
            if s.startswith("#"):
                heading_count += 1
            if "?" in s and 10 < len(s) < 220:
                faq_signals += 1
            lower = s.lower()
            if any(b in lower for b in BOILERPLATE):
                boilerplate_hits += 1

    thin = total_chars < 400
    # 0..1 composite
    length_score = min(1.0, total_chars / 4000)
    structure_score = min(1.0, heading_count / 8)
    faq_score = min(1.0, faq_signals / 5)
    noise_penalty = min(0.4, boilerplate_hits * 0.05)
    quality = max(0.0, 0.45 * length_score + 0.3 * structure_score + 0.25 * faq_score - noise_penalty)

    return {
        "ok": not thin and quality >= 0.25,
        "page_count": len(pages),
        "total_chars": total_chars,
        "heading_count": heading_count,
        "faq_signals": faq_signals,
        "boilerplate_hits": boilerplate_hits,
        "quality_score": round(quality, 4),
        "thin_content": thin,
    }


def run_crawl_qa(state: PipelineState) -> PipelineState:
    qa = score_crawl_quality(state.pages)
    state.scores["crawl_quality"] = float(qa["quality_score"])
    state.log("crawl_qa", qa)
    return state
