# STATE.md — Agile V Project Memory

| Field | Value |
|-------|-------|
| Cycle | **C1** |
| Phase / Stage | Stage 2 — REQ-0011 hidden-content crawl **DONE** |
| Gate | **GATE-0011 RESOLVED**; GATE-0002 firewall Human-Action may remain open |
| Status | Async expand/dialog harvest shipped + verified; FAQ/dialog/tabs/read-more live matrix + in-app chat smoke PASS |
| Git HEAD (pre this commit) | `f4f8c04` (+ uncommitted harvest polish: form-aware isChrome, read-more host, role=tab, widened matrix) |
| Last updated | 2026-08-28T22:50:00Z |
| Agent | Cursor |

---

## Completed (verified)

- REQ-0010 + Phase 3 UX through `3075c34` (progress offsets, batched embed, runId, force re-crawl)
- **REQ-0011** — `expand-harvest.ts` async harvest; recipes; interact budget 8; `CRAWL_EXPAND_HIDDEN` default on
- Live Firecrawl matrix: FAQ Radix, APG dialog/alert/disclosure/tabs, Bootstrap collapse, W3Schools read-more, resume `#` / recipe tabs, plan priority
- In-app re-crawl + chat: pricing, work permit/Bangladesh, Slack/Teams grounded from FAQ answers

## Accepted limitations

- Pure CSS-hidden text with **no** control is not crawlable
- Resume path recipe uses English Experience/Education/Skills labels as a bonus; generic `[role="tab"]` harvest is global
- Portfolio `?tab=` alone may not auto-select; crawl still clicks tab controls

## Known deferred (next cycle — not REQ-0011)

- **Phase 4** — OSS/README polish, mocked Firecrawl CI, CONTRIBUTING/SECURITY
- **Scale toward 8.5–9** — abuse limits, budget caps, clearer crawl errors, observability
- **Phase 5** — Crawl4AI / VPS (optional)
- GATE-0002 Vercel firewall Human-Action may still be pending

## Next exact action

**After commit:** Start Phase 4 OSS polish, then abuse/budget/observability; optional Phase 5 Crawl4AI. Do **not** add more resume-tab special cases.

## Resume command

```text
/agile-v-core
Load .agile-v/STATE.md. REQ-0011 closed. Next: Phase 4 OSS + scale hardening (not Crawl4AI unless asked).
```
