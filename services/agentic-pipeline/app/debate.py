"""Multi-agent debate: crawl_qa → dual drafts → boss validator loop."""

from __future__ import annotations

import uuid
from typing import Any

from app.llm import complete
from app.models import PipelineState
from app.settings import get_settings
from app.stages.analyzer import run_analyzer
from app.stages.crawl_qa import run_crawl_qa, score_crawl_quality
from app.stages.extractor import run_extractor
from app.stages.optimizer import run_optimizer
from app.stages.preprocessor import run_preprocessor
from app.stages.validator import boss_decide

SYSTEM_A = (
    "You are Draft Agent A. Answer using ONLY the provided source excerpts. "
    "Prefer concise factual bullets. If sources lack the answer, say you do not know."
)

SYSTEM_B = (
    "You are Draft Agent B. Answer using ONLY the provided source excerpts. "
    "Prefer a short narrative paragraph grounded in quotes/phrases from sources. "
    "If sources lack the answer, say you do not know."
)


async def _draft(
    system: str,
    question: str,
    ranked_chunks: list[str],
    *,
    temperature: float,
    feedback: str | None = None,
) -> tuple[str, str]:
    context = "\n\n---\n\n".join(ranked_chunks[:6]) or "(no chunks)"
    user = f"Question: {question}\n\nSources:\n{context}"
    if feedback:
        user += f"\n\nBoss feedback (revise accordingly):\n{feedback}"
    return await complete(system, user, temperature=temperature)


async def run_debate(url: str, question: str) -> dict[str, Any]:
    settings = get_settings()
    max_rounds = settings.max_debate_rounds
    state = PipelineState(url=url, question=question, trace_id=str(uuid.uuid4()))

    state = await run_extractor(state)
    state = run_analyzer(state)
    state = run_crawl_qa(state)
    state = run_preprocessor(state)
    state = run_optimizer(state)

    crawl_qa = score_crawl_quality(state.pages)
    crawl_quality = float(crawl_qa.get("quality_score") or 0.0)

    feedback: str | None = None
    rounds: list[dict[str, Any]] = []
    final_answer = ""
    winner: str | None = None
    rejected = True
    reject_reason = "max_rounds_exceeded"

    for round_idx in range(1, max_rounds + 1):
        draft_a, prov_a = await _draft(
            SYSTEM_A, question, state.ranked_chunks, temperature=0.1, feedback=feedback
        )
        draft_b, prov_b = await _draft(
            SYSTEM_B, question, state.ranked_chunks, temperature=0.4, feedback=feedback
        )
        decision = boss_decide(
            draft_a,
            draft_b,
            state.ranked_chunks,
            crawl_quality=crawl_quality,
        )
        rounds.append(
            {
                "round": round_idx,
                "draft_a": draft_a,
                "draft_b": draft_b,
                "providers": {"a": prov_a, "b": prov_b},
                "boss": decision,
            }
        )
        state.log("boss", {"round": round_idx, "decision": decision["decision"]})

        if decision["decision"] == "accept_a":
            final_answer = draft_a
            winner = "a"
            rejected = False
            reject_reason = ""
            break
        if decision["decision"] == "accept_b":
            final_answer = draft_b
            winner = "b"
            rejected = False
            reject_reason = ""
            break
        if decision["decision"] == "reject":
            rejected = True
            reject_reason = "boss_reject"
            final_answer = (
                "I could not produce a grounded answer from the extracted sources. "
                f"Boss: {decision.get('feedback') or 'rejected'}."
            )
            break
        # revise
        feedback = decision.get("feedback")
        if round_idx == max_rounds:
            rejected = True
            reject_reason = "max_rounds_exceeded"
            # Pick better of last scores even if imperfect
            if decision["score_a"] >= decision["score_b"]:
                final_answer = draft_a
                winner = "a"
            else:
                final_answer = draft_b
                winner = "b"
            if decision["score_a"] < 0.08 and decision["score_b"] < 0.08:
                final_answer = (
                    "I could not produce a grounded answer after debate rounds. "
                    f"Last boss feedback: {feedback or 'none'}."
                )
                winner = None

    scores = {
        **state.scores,
        "crawl_quality": crawl_quality,
        "accepted": 0.0 if rejected else 1.0,
        "rounds": float(len(rounds)),
    }
    if rounds:
        last = rounds[-1]["boss"]
        scores["score_a"] = float(last.get("score_a") or 0.0)
        scores["score_b"] = float(last.get("score_b") or 0.0)

    return {
        "answer": final_answer,
        "winner": winner,
        "rounds": rounds,
        "scores": scores,
        "sources": state.sources or [p.url for p in state.pages],
        "trace_id": state.trace_id,
        "crawl_qa": crawl_qa,
        "rejected": rejected,
        "reject_reason": reject_reason or None,
        "trace": state.trace,
    }
