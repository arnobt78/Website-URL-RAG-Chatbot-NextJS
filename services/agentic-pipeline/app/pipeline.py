from __future__ import annotations

import uuid
from typing import Any

from app.models import PipelineState
from app.stages.analyzer import run_analyzer
from app.stages.assembler import run_assembler
from app.stages.extractor import run_extractor
from app.stages.optimizer import run_optimizer
from app.stages.preprocessor import run_preprocessor
from app.stages.synthesizer import run_synthesizer
from app.stages.validator import run_validator

STAGE_NAMES = [
    "extractor",
    "analyzer",
    "preprocessor",
    "optimizer",
    "synthesizer",
    "validator",
    "assembler",
]


async def run_pipeline(url: str, question: str) -> dict[str, Any]:
    state = PipelineState(url=url, question=question, trace_id=str(uuid.uuid4()))
    state = await run_extractor(state)
    state = run_analyzer(state)
    state = run_preprocessor(state)
    state = run_optimizer(state)
    state = await run_synthesizer(state)
    state = run_validator(state)
    state = run_assembler(state)
    return {
        "answer": state.answer,
        "sources": state.sources,
        "scores": state.scores,
        "trace_id": state.trace_id,
        "rejected": state.rejected,
        "reject_reason": state.reject_reason or None,
        "trace": state.trace,
        "draft_provider": state.draft_provider,
    }
