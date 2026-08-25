# phases/01-baseline-analysis/SUMMARY.md

## Architecture (verified)

```text
Browser
  → proxy.ts (sessionId cookie + x-session-id header)
  → /[...url] Server Component
       → loadChatPageData (runWithRagChatFallback for ingest + history)
       → redis.sismember("indexed-urls")
       → ChatWrapper (client, fetch streaming)
  → POST /api/chat-stream
       → chatWithFallback() (multi-provider LLM chain)
       → text/plain stream to client
```

**Stack:** Next.js 16.3.3, React 19, TypeScript, Tailwind, NextUI, `@upstash/rag-chat@2.0.3`, `@upstash/redis`, native fetch streaming.

**Data stores:** Upstash Vector (via rag-chat), Upstash Redis (history + index set). LLM via multi-provider fallback (`src/lib/ai/`).

## Boundaries

| Layer | Paths |
|-------|-------|
| UI | `src/components/*`, `src/app/page.tsx`, `src/app/[...url]/page.tsx` |
| API | `src/app/api/chat-stream/route.ts` |
| Domain libs | `src/lib/load-chat-page-data.ts`, `src/lib/ai/fallback-rag-chat.ts`, `redis.ts`, `utils.ts` |
| Cross-cutting | `src/proxy.ts` |

## Verified facts vs inferences

| Kind | Item |
|------|------|
| Fact | Catch-all indexing + streaming chat implemented as above |
| Fact | Home page is create-next-app boilerplate |
| Fact | No test suite / no `.env.example` |
| Fact | README OpenAI-centric; code Upstash Llama-3-8B |
| Fact | Local uncommitted asset/README/favicon drift vs `origin/main` |
| Inferred | Production demo may still work if Upstash env + QStash configured |
| Suspected | `/` broken locally for images after SVG deletion |
| Unresolved | Whether QStash model ID remains valid in 2026 |
| Deferred | Multi-provider fallback, scraper revival, PDF ingestion claims in README (PDF not evidenced in `src/`) |
