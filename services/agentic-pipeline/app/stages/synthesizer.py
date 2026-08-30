from __future__ import annotations

from app.llm import complete
from app.models import PipelineState

SYSTEM = (
    "You answer questions using ONLY the provided source excerpts. "
    "If the sources lack the answer, say you do not know. Be concise."
)


async def run_synthesizer(state: PipelineState) -> PipelineState:
    context = "\n\n---\n\n".join(state.ranked_chunks[:6]) or "(no chunks)"
    user = f"Question: {state.question}\n\nSources:\n{context}"
    text, provider = await complete(SYSTEM, user)
    state.draft = text
    state.draft_provider = provider
    state.log("synthesizer", {"provider": provider, "chars": len(text)})
    return state
