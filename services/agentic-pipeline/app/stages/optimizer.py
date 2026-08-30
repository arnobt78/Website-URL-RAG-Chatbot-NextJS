from __future__ import annotations

import math
import re
from collections import Counter

from app.models import PipelineState

BOILERPLATE = (
    "cookie",
    "newsletter",
    "all rights reserved",
    "follow us on",
    "sign up for",
)


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def _bm25_scores(query: str, docs: list[str], k1: float = 1.5, b: float = 0.75) -> list[float]:
    if not docs:
        return []
    q_tokens = _tokenize(query)
    if not q_tokens:
        return [0.0] * len(docs)
    tokenized = [_tokenize(d) for d in docs]
    avgdl = sum(len(t) for t in tokenized) / len(tokenized)
    df: Counter[str] = Counter()
    for toks in tokenized:
        df.update(set(toks))
    N = len(docs)
    scores: list[float] = []
    for toks in tokenized:
        tf = Counter(toks)
        score = 0.0
        dl = len(toks) or 1
        for term in q_tokens:
            if term not in tf:
                continue
            n_qi = df[term]
            idf = math.log(1 + (N - n_qi + 0.5) / (n_qi + 0.5))
            freq = tf[term]
            score += idf * (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * dl / avgdl))
        scores.append(score)
    return scores


def run_optimizer(state: PipelineState) -> PipelineState:
    filtered = [
        c
        for c in state.chunks
        if not any(b in c.lower() for b in BOILERPLATE) or len(c) > 400
    ]
    if not filtered:
        filtered = list(state.chunks)

    scores = _bm25_scores(state.question, filtered)
    ranked = [c for _, c in sorted(zip(scores, filtered, strict=True), key=lambda x: -x[0])]
    state.ranked_chunks = ranked[:8]
    top = scores[scores.index(max(scores))] if scores else 0.0
    state.scores["bm25_top"] = float(top)
    state.log("optimizer", {"kept": len(state.ranked_chunks), "bm25_top": top})
    return state
