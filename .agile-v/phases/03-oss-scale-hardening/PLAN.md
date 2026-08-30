# PLAN — OSS polish + scale hardening (REQ-0012)

**Cycle:** C1  
**Gate:** GATE-0012 (**RESOLVED**)  
**Status:** **DONE** — Waves A+B implemented and verified  
**Git HEAD at plan time:** `fc7403a`  
**Out of scope (kept):** Phase 5 Crawl4AI/VPS; Langfuse/PostHog/Sentry; demo GIF (deferred)

---

## Shipped

| Wave | Outcome |
|------|---------|
| A | README mermaid + crawl/harvest narrative; CONTRIBUTING.md; issue templates; mocked `firecrawl-client` tests |
| B | Env `RATE_LIMIT_*` (defaults unchanged); `crawl-errors.ts` + UI `ingestError`/`phaseDetail`; structured crawl logs |

## Deferred

- README demo GIF (optional later)
- Phase 5 Crawl4AI
- Observability SaaS SDKs

## Acceptance (met)

1. Fresh clone path documented; CONTRIBUTING present; CI green without `FIRECRAWL_API_KEY`.
2. Rate knobs documented; over-limit paths actionable.
3. `lint` + `test` + `build` PASS.
