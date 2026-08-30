# STATE.md — Agile V Project Memory

| Field | Value |
|-------|-------|
| Cycle | **C1** |
| Phase / Stage | REQ-0015 / GATE-0015 **closed** at commit-ready |
| Gate | GATE-0015 RESOLVED; GATE-0014 RESOLVED |
| Status | Crawl4AI optional + agentic debate shipped; local E2E smoke PASS; Firecrawl default; Coolify operator pending |
| Git HEAD (reconciled) | `5906b5e` / includes `29f2996` feat + smoke docs |
| Last updated | 2026-08-31T01:17:00Z |
| Agent | Cursor |

---

## Completed (verified)

- **REQ-0014** at `97a29f6` / memory `f616d26`
- **REQ-0015** at `29f2996` / memory `d148d42`; gitignore fix `67d040a`; smoke docs `5906b5e`
- Live smoke VAL-0060…0062: Crawl4AI Docker, agentic debate, Next crawl4ai→chat

## Deferred

- PostHog; README demo GIF; Next.js RAG enrichment via agents
- Coolify DNS / Vercel crawl4ai switch (operator)

## Next exact action

Operator: Coolify DNS/secrets for crawl4ai + agents (see `docs/SELF_HOST_CRAWL.md` checklist + private Hetzner guide). Push when ready.
