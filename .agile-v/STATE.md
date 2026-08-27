# STATE.md — Agile V Project Memory

| Field | Value |
|-------|-------|
| Cycle | **C1** |
| Phase / Stage | Manual smoke done — FAQ accordion RAG gap open |
| Gate | GATE-0001 approved; Human-Action: Vercel Firewall + production env |
| Status | Crawl progress/re-crawl verified (17/17); FAQ answers not in vector index |
| Git HEAD (pre-work baseline) | `2e3191b` |
| Last updated | 2026-08-27T02:22:00Z |
| Agent | Cursor |

---

## Completed (verified)

- REQ-0010 + Phase 3 UX (see `910e12e`, `2e3191b`)
- Manual smoke 2026-08-27: re-crawl → **Crawling X/17** → **completed 17/17**; resume tabs answer in chat
- `runId` on crawl jobs + force re-crawl invalidation (stale zombie job fix)

## Known limitations / open issues

- **FAQ accordion answers** — `/faq` indexed with questions only; chat cannot answer pricing, timeline, remote, etc. (see `docs/PROJECT_PLAN.md` manual smoke)
- **Dialog/modal pages** — not tested (portfolio has no dialog UI)
- Completed-site badge uses job or snapshot `indexed` count (`??` — production OK)

## Next exact action

Fix FAQ/hidden-content scrape: audit `interaction-recipes.ts` selectors vs `arnobmahmud.com` FAQ DOM; review `CRAWL_INTERACT_MAX_PAGES` budget.

## Resume command

```text
/agile-v-core
Load .agile-v/STATE.md. FAQ accordion scrape fix.
```
