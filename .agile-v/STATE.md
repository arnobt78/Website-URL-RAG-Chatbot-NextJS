# STATE.md — Agile V Project Memory

| Field | Value |
|-------|-------|
| Cycle | **C1** |
| Phase / Stage | Re-crawl UX fix — commit-ready |
| Gate | GATE-0001 approved; Human-Action: Vercel Firewall + production env |
| Status | Re-crawl clears stale progress immediately; shared `crawlProgressPageCount` (SSR + client) |
| Git HEAD (pre-work baseline) | `910e12e` |
| Last updated | 2026-08-27T01:26:00Z |
| Agent | Cursor |

---

## Completed (verified)

- REQ-0010 + Phase 3 UX (see `910e12e`)
- Re-crawl UX: `mergeLiveCrawlContext` + `preferLiveCounts`; reset counts/lists on re-crawl; POST `httpsUrl`
- Shared `crawlProgressPageCount` in SSR (`load-chat-page-data`) and client poll merge
- Validation: lint PASS, test PASS (66 + 1 skipped), build PASS

## Known limitations

- Live Firecrawl E2E smoke pending (manual, needs production keys)
- Completed-site badge uses job or snapshot `indexed` count (`??` — production OK)

## Next exact action

Local or Vercel smoke: re-crawl indexed site → progress shows 0/N immediately; chat on `www.arnobmahmud.com`.

## Resume command

```text
/agile-v-core
Load .agile-v/STATE.md. Production smoke after deploy.
```
