"""MCP stdio server exposing pipeline stages for Cursor/Claude agents."""

from __future__ import annotations

import json

from mcp.server.fastmcp import FastMCP

from app.models import PipelineState
from app.pipeline import STAGE_NAMES, run_pipeline
from app.stages.extractor import run_extractor
from app.stages.validator import run_validator

mcp = FastMCP("agentic-pipeline")


@mcp.tool()
async def pipeline_run(url: str, question: str) -> str:
    """Run the full 7-stage Extractor→Assembler pipeline on a URL + question."""
    result = await run_pipeline(url, question)
    return json.dumps(result, indent=2)


@mcp.tool()
def stage_list() -> str:
    """List pipeline stage names in order."""
    return json.dumps({"stages": STAGE_NAMES})


@mcp.tool()
async def stage_extractor(url: str, question: str = "summarize") -> str:
    """Run extractor stage only."""
    state = PipelineState(url=url, question=question)
    state = await run_extractor(state)
    return json.dumps(
        {"pages": [{"url": p.url, "chars": len(p.markdown)} for p in state.pages]},
        indent=2,
    )


@mcp.tool()
async def stage_validator_check(draft: str, source_text: str) -> str:
    """Validate a draft against source text (groundedness heuristics)."""
    state = PipelineState(url="https://example.com", question="q")
    state.draft = draft
    state.ranked_chunks = [source_text]
    state = run_validator(state)
    return json.dumps(state.validation, indent=2)


def main() -> None:
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
