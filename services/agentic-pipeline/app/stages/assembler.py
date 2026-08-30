from __future__ import annotations

from app.models import PipelineState


def run_assembler(state: PipelineState) -> PipelineState:
    if state.rejected:
        state.answer = (
            "I could not produce a grounded answer from the extracted sources. "
            f"Validator: {state.reject_reason or 'failed'}."
        )
        state.scores["accepted"] = 0.0
    else:
        state.answer = state.draft
        state.scores["accepted"] = 1.0

    state.sources = list(dict.fromkeys(state.sources or [p.url for p in state.pages]))
    state.log(
        "assembler",
        {
            "accepted": not state.rejected,
            "answer_chars": len(state.answer),
            "sources": len(state.sources),
        },
    )
    return state
