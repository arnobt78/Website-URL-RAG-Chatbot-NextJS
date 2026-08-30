from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class PageDoc:
    url: str
    markdown: str
    title: str | None = None


@dataclass
class PipelineState:
    url: str
    question: str
    pages: list[PageDoc] = field(default_factory=list)
    analysis: dict[str, Any] = field(default_factory=dict)
    chunks: list[str] = field(default_factory=list)
    ranked_chunks: list[str] = field(default_factory=list)
    draft: str = ""
    draft_provider: str = ""
    validation: dict[str, Any] = field(default_factory=dict)
    answer: str = ""
    sources: list[str] = field(default_factory=list)
    scores: dict[str, float] = field(default_factory=dict)
    trace: list[dict[str, Any]] = field(default_factory=list)
    trace_id: str = ""
    rejected: bool = False
    reject_reason: str = ""

    def log(self, stage: str, detail: str | dict[str, Any]) -> None:
        self.trace.append({"stage": stage, "detail": detail})
