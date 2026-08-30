from __future__ import annotations

from typing import Any

from fastapi import Depends, FastAPI
from pydantic import BaseModel, Field, HttpUrl

from app.auth import require_bearer
from app.pipeline import STAGE_NAMES, run_pipeline

app = FastAPI(
    title="Agentic Pipeline",
    description="7-stage extract→assemble service (separate from Next.js RAG chat)",
    version="0.1.0",
)


class PipelineRequest(BaseModel):
    url: HttpUrl
    question: str = Field(min_length=3, max_length=2000)


class PipelineResponse(BaseModel):
    answer: str
    sources: list[str]
    scores: dict[str, float]
    trace_id: str
    rejected: bool = False
    reject_reason: str | None = None
    draft_provider: str | None = None
    trace: list[dict[str, Any]] = Field(default_factory=list)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/v1/stages")
async def list_stages(_: None = Depends(require_bearer)) -> dict[str, list[str]]:
    return {"stages": STAGE_NAMES}


@app.post("/v1/pipeline", response_model=PipelineResponse)
async def pipeline(
    body: PipelineRequest,
    _: None = Depends(require_bearer),
) -> PipelineResponse:
    result = await run_pipeline(str(body.url), body.question.strip())
    return PipelineResponse(**result)
