# RISKS.md

| ID | Severity | Status | Description | Mitigation / next step | Linked |
|----|----------|--------|-------------|------------------------|--------|
| RISK-0001 | High | Open | **Docs vs code drift** (OpenAI vs Upstash QStash). Misconfiguration likely for new deploys. | REQ-0004 / TASK-0001 | REQ-0004 |
| RISK-0002 | High | Open | **LLM/provider dependency** on single Upstash model string; model/API deprecations break chat. | Consider REQ-0008 in C2; verify QStash model still available | REQ-0002, REQ-0008 |
| RISK-0003 | Medium | Open | **Broken static assets on `/`** after local SVG deletion; layout OG still points at `/next.svg`. | REQ-0005 / TASK-0002 | REQ-0005 |
| RISK-0004 | Medium | Open | **No automated tests**; only `lint`/`build` scripts. Regressions undetected. | REQ-0006, REQ-0010 | REQ-0006 |
| RISK-0005 | Medium | Open | **Public demo cost/abuse**: catch-all URL indexing + SSR can burn Vercel/Upstash quotas (bot crawl). | REQ-0007 guardrails + dashboard bot protection | REQ-0007 |
| RISK-0006 | Medium | Open | **Unvalidated HTML ingestion** of arbitrary URLs (SSRF-ish / content risk / large pages). | Rate limits, allowlist, timeouts — not yet specified | REQ-0001 |
| RISK-0007 | Low | Open | **No `.env.example`**; `.env` exists locally (gitignored). Agents must not read secrets. | Add placeholder example only | REQ-0004 |
| RISK-0008 | Low | Open | **Stale Next 14.2.5 / deps**; security advisories possible. | Audit after baseline green | REQ-0006 |
| RISK-0009 | Info | Noted | Prior experimental code (scraper/Groq/etc.) was intentionally removed via `git reset --hard` + `git clean`. Do not resurrect without REQ. | Preserve baseline | DEC-0001 |
