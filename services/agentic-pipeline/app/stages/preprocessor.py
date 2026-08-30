from __future__ import annotations

import re

from app.models import PipelineState

CHUNK_SIZE = 800
CHUNK_OVERLAP = 100


def _clean(md: str) -> str:
    text = md.replace("\r\n", "\n")
    text = re.sub(r"!\[[^\]]*\]\([^)]+\)", " ", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _chunk(text: str) -> list[str]:
    if len(text) <= CHUNK_SIZE:
        return [text] if text else []
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(len(text), start + CHUNK_SIZE)
        chunks.append(text[start:end].strip())
        if end >= len(text):
            break
        start = max(0, end - CHUNK_OVERLAP)
    return [c for c in chunks if c]


def run_preprocessor(state: PipelineState) -> PipelineState:
    chunks: list[str] = []
    for page in state.pages:
        cleaned = _clean(page.markdown)
        for part in _chunk(cleaned):
            chunks.append(f"Source: {page.url}\n\n{part}")
    state.chunks = chunks
    state.log("preprocessor", {"chunks": len(chunks)})
    return state
