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
| RISK-0010 | High | Mitigated | **Hidden UI content missing from RAG** — FAQ answers / dialogs / toggles not indexed when collapsed (Radix single accordion confirmed on arnobmahmud.com). | REQ-0011 async harvest shipped + live matrix/chat smoke | REQ-0011 |
| RISK-0011 | Medium | Accepted | **Expand/interact cost** — more actions + higher interact budget burns Firecrawl credits and lengthens crawl. | Cap targets; prioritize preferInteract; default interact 8; **env rate limits + clearer errors (REQ-0012)** | REQ-0011, REQ-0012 |
| RISK-0012 | Medium | Mitigated | **False clicks** — expand scripts may open language/cookie/chat chrome or navigate. | Exclude menus/haspopup; form submits only inside `<form>`; smoke test | REQ-0011 |
| RISK-0013 | Medium | Mitigated | **OSS docs drift / missing CONTRIBUTING** — README lagged whole-site crawl + harvest. | REQ-0012 Wave A shipped (README mermaid, CONTRIBUTING, templates) | REQ-0012 |
| RISK-0014 | Medium | Mitigated | **Hard-coded rate limits** — cannot tune per deploy; opaque abuse UX. | REQ-0012 Wave B: `RATE_LIMIT_*` + `crawl-errors.ts` | REQ-0012, RISK-0005 |
