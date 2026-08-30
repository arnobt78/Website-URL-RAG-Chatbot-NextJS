from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any, AsyncIterator

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, Field, HttpUrl

from app.auth import assert_can_boot, require_bearer
from app.debate import run_debate
from app.pipeline import STAGE_NAMES, run_pipeline
from app.url_safety import assert_safe_public_url


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    assert_can_boot()
    yield


app = FastAPI(
    title="Agentic Pipeline",
    description="7-stage extract→assemble + multi-agent debate (separate from Next.js RAG chat)",
    version="0.2.0",
    lifespan=lifespan,
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


class DebateResponse(BaseModel):
    answer: str
    winner: str | None = None
    rounds: list[dict[str, Any]] = Field(default_factory=list)
    scores: dict[str, float]
    sources: list[str]
    trace_id: str
    crawl_qa: dict[str, Any] = Field(default_factory=dict)
    rejected: bool = False
    reject_reason: str | None = None
    trace: list[dict[str, Any]] = Field(default_factory=list)


def _require_safe_url(url: HttpUrl) -> str:
    raw = str(url)
    try:
        assert_safe_public_url(raw)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return raw


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/v1/stages")
async def list_stages(_: None = Depends(require_bearer)) -> dict[str, list[str]]:
    return {"stages": STAGE_NAMES, "debate_agents": ["crawl_qa", "draft_a", "draft_b", "boss_validator"]}


@app.post("/v1/pipeline", response_model=PipelineResponse)
async def pipeline(
    body: PipelineRequest,
    _: None = Depends(require_bearer),
) -> PipelineResponse:
    url = _require_safe_url(body.url)
    result = await run_pipeline(url, body.question.strip())
    return PipelineResponse(**result)


@app.post("/v1/debate", response_model=DebateResponse)
async def debate(
    body: PipelineRequest,
    _: None = Depends(require_bearer),
) -> DebateResponse:
    url = _require_safe_url(body.url)
    result = await run_debate(url, body.question.strip())
    return DebateResponse(**result)
