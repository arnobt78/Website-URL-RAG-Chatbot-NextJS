# TASKS.md — Prioritized Plan

**Active gate:** GATE-0012 — **RESOLVED** (REQ-0012 DONE)  
Historical: REQ-0004…0010 (GATE-0001); REQ-0011 (GATE-0011) → `fc7403a`.

---

## REQ-0011 — DONE

| ID | Status |
|----|--------|
| TASK-0011…0014 | **DONE** |

---

## Wave A — Phase 4 OSS polish — DONE

| ID | Task | Status |
|----|------|--------|
| TASK-0015 | README whole-site crawl + harvest; architecture mermaid; env table | **DONE** |
| TASK-0016 | CONTRIBUTING.md + GitHub issue templates | **DONE** |
| TASK-0017 | Mocked Firecrawl client unit tests (default CI) | **DONE** |

## Wave B — Scale hardening — DONE

| ID | Task | Status |
|----|------|--------|
| TASK-0018 | Env-configurable rate limits; `.env.example` | **DONE** |
| TASK-0019 | Clearer crawl/recrawl/status error + phaseDetail | **DONE** |
| TASK-0020 | VAL + sync STATE/CLAUDE/PROJECT_PLAN | **DONE** (this commit) |

---

## Deferred (not GATE-0012)

| Priority | Item |
|----------|------|
| Optional | README demo GIF (user deferred) |
| P2 | Phase 5 — Crawl4AI / VPS |
| Low | `hashLinksFromPage` wiring |
| Later | Langfuse / PostHog / Sentry |
