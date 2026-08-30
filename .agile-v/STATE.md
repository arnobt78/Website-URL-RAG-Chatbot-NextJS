# STATE.md — Agile V Project Memory

| Field | Value |
|-------|-------|
| Cycle | **C1** |
| Phase / Stage | REQ-0015 / GATE-0015 closed; agentic security harden follow-up |
| Gate | GATE-0015 RESOLVED; GATE-0014 RESOLVED |
| Status | Agentic fail-closed auth + extractor SSRF shipped (`4a4d78f`+); Firecrawl default; Coolify operator pending |
| Git HEAD (reconciled) | 1415e2e (includes `4a4d78f` harden) |
| Last updated | 2026-08-31T01:36:00Z |
| Agent | Cursor |

---

## Completed (verified)

- **REQ-0014** / **REQ-0015** + local E2E smoke (VAL-0060…0062)
- **Agentic security harden:** fail-closed Bearer + `AGENTIC_ALLOW_INSECURE_DEV`; `url_safety.py` SSRF; pytest 30 PASS; commit `4a4d78f`
- Post-verify polish: placeholder case match, offline DNS allow-test, `pyrightconfig` + workspace Python interpreter for agentic `.venv`

## Deferred

- PostHog; README demo GIF; Next.js RAG enrichment via agents
- Coolify DNS / Vercel crawl4ai switch (operator)
- Residual SSRF DNS TOCTOU (accepted / out of harden plan)

## Next exact action

Operator: Coolify DNS/secrets (strong `AGENTIC_API_TOKEN`, no `AGENTIC_ALLOW_INSECURE_DEV` on public hosts). Push when ready.
