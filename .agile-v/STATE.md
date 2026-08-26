# STATE.md — Agile V Project Memory

| Field | Value |
|-------|-------|
| Cycle | **C1** |
| Phase / Stage | Crawl progress + batched indexing — commit-ready |
| Gate | GATE-0001 approved; Human-Action: Vercel Firewall + production env |
| Status | Monotonic batch scrape/index progress; phase-aware UI; re-crawl clears `ingestError` |
| Git HEAD (pre-work baseline) | `a5e14e4` |
| Last updated | 2026-08-27T01:50:00Z |
| Agent | Cursor |

---

## Completed (verified)

- REQ-0010 + Phase 3 UX (see `910e12e`)
- Re-crawl UX: `mergeLiveCrawlContext` + `preferLiveCounts`; reset counts/lists + `ingestError` on re-crawl (see `a5e14e4`)
- Crawl progress fixes: `crawledOffset` / `indexedOffset` across workflow batches; batched `indexCrawledPages` (size 4); `crawlProgressDisplay` (SSR + client + panel copy)
- Validation: lint PASS, test PASS (69 + 1 skipped), build PASS

## Known limitations

- Live Firecrawl E2E smoke pending (manual, needs production keys; >4-page site not re-run this session)
- Completed-site badge uses job or snapshot `indexed` count (`??` — production OK)

## Next exact action

Local smoke: crawl `www.arnobmahmud.com` — counter climbs 0→N without batch reset; embedding shows X/Y scraped; re-crawl clears stale error badge.

## Resume command

```text
/agile-v-core
Load .agile-v/STATE.md. Production smoke after deploy.
```
