# VALIDATION_SUMMARY.md

| ID | Check | Command | Result | When | Notes |
|----|-------|---------|--------|------|-------|
| VAL-0001 | lint | `npm run lint` (`eslint .`) | **PASS** | 2026-08-25 | Next 16 flat eslint-config-next |
| VAL-0002 | build | `npm run build` | **PASS** | 2026-08-25 | Next 16.3.3 Turbopack; Node 24 |
| VAL-0003 | audit | `npm audit` | **PASS (0)** | 2026-08-25 | overrides + Next 16.3.3 |
| VAL-0004 | audit prod | `npm audit --omit=dev` | **PASS (0)** | 2026-08-25 | |
| VAL-0005 | node | `node -v` | v24.19.0 | 2026-08-25 | engines 24.x |
| VAL-0006 | lint | `npm run lint` | **PASS** | 2026-08-25 | post chat-fix + multi-provider fallback |
| VAL-0007 | build | `npm run build` | **PASS** | 2026-08-25 | proxy.ts only (Next 16); no middleware.ts |
| VAL-0008 | localhost E2E | `curl -N POST http://localhost:3000/api/chat-stream` | **PASS** | 2026-08-25 | HTTP 200; `text/plain` body streamed (`Hi`); `X-LLM-Provider: Google Gemini`; `X-LLM-Model: gemini-2.5-flash`; `.env` keys loaded locally (not read/committed) |
| VAL-0009 | unit tests | `npm run test` (`vitest run`) | **PASS** | 2026-08-25 | 7 tests: errors, chat-input-utils, fallback not_configured |
| VAL-0010 | unit tests | `npm run test` | **PASS** | 2026-08-26 | 16 tests (+ url-security, url-to-chat-path, fallback-rag-chat) |
| VAL-0011 | lint | `npm run lint` | **PASS** | 2026-08-26 | post SEO/branding + opengraph-image |
| VAL-0012 | build | `npm run build` | **PASS** | 2026-08-26 | `/opengraph-image` route; package `website-url-rag-chatbot` |
| VAL-0013 | security | `/review-security` | **PASS WITH WARNINGS** | 2026-08-26 | DNS TOCTOU + CSP unsafe-inline accepted for demo scope |
| VAL-0014 | lint | `npm run lint` | **PASS** | 2026-08-26 | ingest UX dedup + fetch-page-content tests + GitHub CI |
| VAL-0015 | unit tests | `npm run test` | **PASS** | 2026-08-26 | 29 passed, 1 skipped (live Jina smoke); +9 fetch-page-content mocked |
| VAL-0016 | build | `npm run build` | **PASS** | 2026-08-26 | Next 16.3.3 Turbopack; Node 24 |
| VAL-0017 | live ingest | `npm run test:live-ingest` | **SKIPPED** | 2026-08-26 | gated on `RUN_LIVE_INGEST_SMOKE`; CI job runs when `JINA_API_KEY` secret set |
| VAL-0018 | lint | `npm run lint` | **PASS** | 2026-08-26 | chat UI redesign |
| VAL-0019 | unit tests | `npm run test` | **PASS** | 2026-08-26 | 35 passed (+ chat-sessions-storage, buildSessionId chatId) |
| VAL-0020 | build | `npm run build` | **PASS** | 2026-08-26 | `/api/chat-history`; full-width chat shell |
| VAL-0021 | lint | `npm run lint` | **PASS** | 2026-08-26 | chat UI polish + chip dedupe |
| VAL-0022 | unit tests | `npm run test` | **PASS** | 2026-08-26 | 38 passed, 1 skipped |
| VAL-0023 | build | `npm run build` | **PASS** | 2026-08-26 | commit-ready final |
| VAL-0024 | lint | `npm run lint` | **PASS** | 2026-08-27 | REQ-0009 verify blockers + crawl progress UI |
| VAL-0025 | unit tests | `npm run test` | **PASS** | 2026-08-27 | 46 passed, 1 skipped (+ crawl site-root, url-prioritizer) |
| VAL-0026 | build | `npm run build` | **PASS** | 2026-08-27 | `/api/crawl/workflow`, `/api/crawl/status`; Next 16.3.3 Turbopack |
| VAL-0027 | lint | `npm run lint` | **PASS** | 2026-08-27 | REQ-0010 dynamic crawl v2 |
| VAL-0028 | unit tests | `npm run test` | **PASS** | 2026-08-27 | 51 passed, 1 skipped (+ url-expander, interaction-recipes) |
| VAL-0029 | build | `npm run build` | **PASS** | 2026-08-27 | site-crawl-v2; per-URL scrape workflow |
| VAL-0030 | lint | `npm run lint` | **PASS** | 2026-08-27 | Phase 3 UX + poll error toasts + recrawl tests |
| VAL-0031 | unit tests | `npm run test` | **PASS** | 2026-08-27 | 59 passed, 1 skipped (+ status-poll-errors, isValidSiteRootKey, invalidate-and-recrawl) |
| VAL-0032 | build | `npm run build` | **PASS** | 2026-08-27 | `/api/crawl/recrawl`, `/api/crawl/status`; commit-ready |
| VAL-0033 | lint | `npm run lint` | **PASS** | 2026-08-27 | re-crawl UX + crawlProgressPageCount |
| VAL-0034 | unit tests | `npm run test` | **PASS** | 2026-08-27 | 66 passed, 1 skipped (+ live-crawl-context, crawl-progress-page-count) |
| VAL-0035 | build | `npm run build` | **PASS** | 2026-08-27 | re-crawl stale count fix commit-ready |
| VAL-0036 | lint | `npm run lint` | **PASS** | 2026-08-27 | crawl progress offsets + batched index |
| VAL-0037 | unit tests | `npm run test` | **PASS** | 2026-08-27 | 69 passed, 1 skipped (+ scrape-targets, crawlProgressDisplay) |
| VAL-0038 | build | `npm run build` | **PASS** | 2026-08-27 | monotonic crawl/index progress commit-ready |
| VAL-0039 | manual smoke | local re-crawl `www.arnobmahmud.com` | **PASS (progress)** / **FAIL (FAQ RAG)** | 2026-08-27 | 17/17 crawl complete; resume tabs answer; FAQ answers missing from index |
| VAL-0040 | lint | `npm run lint` | **PASS** | 2026-08-27 | runId re-crawl fix commit-ready |
| VAL-0041 | unit tests | `npm run test` | **PASS** | 2026-08-27 | 69 passed, 1 skipped |
| VAL-0042 | build | `npm run build` | **PASS** | 2026-08-27 | runId re-crawl fix commit-ready |
| VAL-0043 | lint | `npm run lint` | **PASS** | 2026-08-28 | REQ-0011 harvest polish commit-ready |
| VAL-0044 | unit tests | `npm run test` | **PASS** | 2026-08-28 | 82 passed, 1 skipped (+ expand-harvest form/tab/read-more asserts) |
| VAL-0045 | build | `npm run build` | **PASS** | 2026-08-28 | REQ-0011 commit-ready |
| VAL-0046 | live matrix + chat | `scripts/e2e-hidden-content-matrix.ts` + local re-crawl/chat | **PASS** | 2026-08-28 | FAQ 673→10k+; dialog/alert/disclosure/bootstrap/read-more/APG tabs/resume; chat pricing/permit/Slack |
| VAL-0047 | lint | `npm run lint` | **PASS** | 2026-08-30 | REQ-0012 OSS + scale commit-ready |
| VAL-0048 | unit tests | `npm run test` | **PASS** | 2026-08-30 | 93 passed, 1 skipped (+ firecrawl-client mock, parse-positive-int, crawl-errors) |
| VAL-0049 | build | `npm run build` | **PASS** | 2026-08-30 | Next 16.3.3 Turbopack; GATE-0012 commit-ready |
| VAL-0050 | lint | `npm run lint` | **PASS** | 2026-08-30 | GATE-0013 Sentry + Langfuse |
| VAL-0051 | unit tests | `npm run test` | **PASS** | 2026-08-30 | 98 passed, 1 skipped (+ sentry-filters, langfuse truncate) |
| VAL-0052 | build | `npm run build` | **PASS** | 2026-08-30 | `/api/monitoring` rewrite present in routes-manifest |
| VAL-0053 | verify-deep | implementation-verifier + local lint/test/build | **PASS WITH WARNINGS** | 2026-08-30 | No live UI smoke; commit-ready YES |
| VAL-0054 | lint | `npm run lint` | **PASS** | 2026-08-31 | GATE-0014 Crawl4AI + scrape facade |
| VAL-0055 | unit tests | `npm run test` | **PASS** | 2026-08-31 | 103 passed, 1 skipped (+ crawl4ai-client mocks) |
| VAL-0056 | build | `npm run build` | **PASS** | 2026-08-31 | Next 16.3.3; Firecrawl default unchanged |
| VAL-0057 | agentic pytest | `cd services/agentic-pipeline && pytest -q` | **PASS** | 2026-08-31 | 6 passed (validator + stub pipeline) |
| VAL-0058 | verify-deep GATE-0014 | lint/test/build + pytest + implementation-verifier | **PASS** | 2026-08-31 | Commit-ready YES for REQ-0014 |
| VAL-0059 | agentic pytest GATE-0015 | `pytest -q` in services/agentic-pipeline | **PASS** | 2026-08-31 | 13 passed (boss + debate + crawl_qa) |
| VAL-0060 | live Crawl4AI Docker | compose up + `/health` + `/md` | **PASS** | 2026-08-31 | image `unclecode/crawl4ai:latest` healthy; example.com markdown |
| VAL-0061 | live agentic API | uvicorn `:8080` `/v1/pipeline` + `/v1/debate` | **PASS** | 2026-08-31 | example.com; debate winner + rounds |
| VAL-0062 | live Next crawl4ai E2E | `CRAWL_PROVIDER=crawl4ai` + `QSTASH_DEV_PORT=8082` → recrawl → chat | **PASS** | 2026-08-31 | indexed 2/2; chat grounded; note: avoid QStash Dev vs agents on same :8080 |
| VAL-0063 | verify-deep + commit-ready | lint/test/build + pytest + implementation-verifier | **PASS WITH WARNINGS** | 2026-08-31 | STATE hash drift fixed this commit; Coolify still operator |

`eval_gate_status`: **WAIVED for firewall** — GATE-0002 Human-Action (Bot Protection + AI Bots Deny) confirmed by user 2026-08-30; full production eval still optional.

Expected build warnings (keep):
- Custom Cache-Control on `/_next/static` (intentional)
- proxy convention (Next 16 `src/proxy.ts`; no `middleware.ts`)
