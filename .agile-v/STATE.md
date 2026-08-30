# STATE.md — Agile V Project Memory

| Field | Value |
|-------|-------|
| Cycle | **C1** |
| Phase / Stage | REQ-0015 / GATE-0015 **closed** at commit-ready |
| Gate | GATE-0015 RESOLVED; GATE-0014 RESOLVED |
| Status | Crawl4AI optional + agentic debate (boss validator) shipped; Firecrawl default; Next RAG unchanged |
| Git HEAD (reconciled) | `29f2996` / parent `97a29f6` |
| Last updated | 2026-08-31T00:45:00Z |
| Agent | Cursor |

---

## Completed (verified)

- **REQ-0014** at `97a29f6` / memory `f616d26`
- **REQ-0015** — `POST /v1/debate`, crawl_qa, draft A/B, boss_decide loop, MCP tools, `scripts/gen-local-service-env.sh`; pytest 13 passed

## Deferred

- PostHog; README demo GIF; Next.js RAG enrichment via agents
- Coolify DNS / Vercel crawl4ai switch (operator)

## Next exact action

Operator: Coolify DNS/secrets for crawl4ai + agents (see `docs/SELF_HOST_CRAWL.md` checklist + private Hetzner guide). Push when ready.
