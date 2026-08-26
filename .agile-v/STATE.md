# STATE.md — Agile V Project Memory

| Field | Value |
|-------|-------|
| Cycle | **C1** |
| Phase / Stage | REQ-0010 + Phase 3 UX — **committed** |
| Gate | GATE-0001 approved; Human-Action: Vercel Firewall + production env |
| Status | Per-URL scrape, tab/accordion actions, interact fallback, live progress, re-crawl, index snapshot, poll error toasts |
| Git HEAD (pre-work baseline) | `94ccdc6` |
| Last updated | 2026-08-27T01:10:00Z |
| Agent | Cursor |

---

## Completed (verified)

- REQ-0010: `buildCrawlPlan` + `scrape-targets` per-URL loop (replaces origin batch `/crawl`)
- Hash URL expansion + resume tab click actions + FAQ accordion actions
- Firecrawl v2 `/interact` fallback when content thin or `preferInteract` (caps via env)
- Live progress: `currentPath`, `phaseDetail`, per-page `crawled`/`indexed` in Redis + `CrawlProgressPanel`
- `INDEX_CONTENT_VERSION = site-crawl-v2` (forces re-index)
- Phase 3: index snapshot (`crawl:index-meta:{siteRootKey}`, 90-day TTL), `recrawlSite` + `POST /api/crawl/recrawl`, hardened `GET /api/crawl/status` (session cookie, rate limit, `isValidSiteRootKey`)
- UI: `IndexedPagesDialog`, hero trust rotator, re-crawl confirm in dialog
- Poll UX: `crawlStatusPollFailure` — 403/429 toasts; stop poll on 403
- Validation: lint PASS, test PASS (59 + 1 skipped), build PASS

## Known limitations

- Universal dynamic UI (every dialog/modal/infinite scroll) not guaranteed — interact + recipes cover common patterns
- Interact + extra scrapes use more Firecrawl credits; capped by `CRAWL_INTERACT_MAX_PAGES`
- Workflow trigger failure after invalidate: SSR re-crawl on reload acceptable for v1
- Live Firecrawl E2E smoke pending (manual, needs production keys)

## Next exact action

Production smoke `www.arnobmahmud.com` (education, employers, FAQ tabs); deploy with Firecrawl + QStash env on Vercel.

## Resume command

```text
/agile-v-core
Load .agile-v/STATE.md. Production smoke after deploy with site-crawl-v2.
```
