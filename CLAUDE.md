# CLAUDE.md

## Project Overview

| Field          | Value                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name           | Website URL RAG Chatbot                                                                                                                                        |
| Description    | Next.js 16 RAG chatbot: Firecrawl whole-site crawl (Upstash Workflow) or Jina single-page fallback, Upstash Vector RAG, multi-provider LLM stream, Redis history, localStorage multi-chat sidebar |
| Current Status | **GATE-0013 + GATE-0002 RESOLVED** — Sentry tunnel + Langfuse; Vercel firewall/env set |
| Git baseline   | pending commit (parent `9075d59` / `origin/main`) |

---

## Tech Stack

| Area       | Choice                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| Frontend   | Next.js 16 App Router, React 19, TypeScript, Tailwind, NextUI, Framer Motion                         |
| Backend    | Next.js Route Handlers (Node serverless)                                                               |
| Data       | Upstash Redis + Upstash Vector (via `@upstash/rag-chat`); Firecrawl + QStash Workflow for site crawl; Jina Reader single-page fallback |
| LLM (code) | Multi-provider fallback in `src/lib/ai/` (Gemini → Groq → OpenRouter → Hugging Face → optional OpenAI) |
| Streaming  | Native `fetch` + ReadableStream (no AI SDK client)                                                     |
| Auth       | None (anonymous `sessionId` HttpOnly cookie via `src/proxy.ts`; API binds session to cookie + `canonicalUrl` + optional `chatId`) |
| Sessions UI | Browser localStorage registry (`chat-sessions-storage.ts`); not multi-tenant DB                      |
| SEO        | `src/lib/site.ts`, `opengraph-image.tsx`, `robots.ts`                                                        |
| Deploy     | Vercel; Node **24.x**; security headers + robots; GitHub Actions CI                                   |
| Observability | Optional Sentry (`@sentry/nextjs`, tunnel `/api/monitoring`) + Langfuse (server chat traces); disabled when DSNs/keys empty |
| Testing    | lint (`eslint .`) + `vitest run` + `next build`; optional `test:live-ingest`                          |

---

## Architecture

Preserve existing structure under `src/app`, `src/components`, `src/lib`.

Core flow: `proxy.ts` → `[...url]/page.tsx` (`loadChatPageData` → Firecrawl workflow or Jina fallback) → `ChatWrapper` (polls `/api/crawl/status`; merges live progress via `mergeLiveCrawlContext` + `crawlProgressDisplay`; 403/429 toasts via `crawlStatusPollFailure`) / `ChatShell` → `POST /api/chat-stream` (site-root namespace + cookie + optional `chatId` → `chatWithFallback()`).

Crawl: `buildCrawlPlan` → batched Firecrawl scrape (`crawledOffset`) + batched embed (`indexedOffset`, batch size 4) with **async expand/dialog harvest** (`expand-harvest.ts`: accordions, details, read-more, `[role="tab"]`, dialogs) + optional **/interact** fallback (`CRAWL_INTERACT_MAX_PAGES` default 8; `CRAWL_EXPAND_HIDDEN` default on) → Redis live progress → index; each job has a **`runId`** so stale workflow steps cannot overwrite a re-crawl. `CrawlProgressPanel` shows phase-aware "Crawling X/Y" or "Embedding X/Y". Index snapshot in Redis (`crawl:index-meta:{siteRootKey}`, 90-day TTL). Re-crawl via `POST /api/crawl/recrawl` (always invalidates + restarts; clears stale counts + `ingestError`).

Security: SSRF DNS checks (`url-security.ts`), ingest/chat/crawl rate limits, CSP headers, session namespace isolation (`INDEX_CONTENT_VERSION`).

Do not invent a parallel RAG/LLM stack without an approved REQ.

Details: `.agile-v/phases/01-baseline-analysis/SUMMARY.md`, `docs/PROJECT_PLAN.md`

---

## Rendering Rules

- Keep `[...url]/page.tsx` a Server Component.
- Keep chat interactivity in client components (`ChatWrapper`, `chat/*`).
- Do not client-render entire pages for one interactive region.

---

## Coding Rules

- TypeScript; reuse `rag-chat`, `redis`, `utils`, existing chat components.
- No secrets in git; never dump `.env` into docs or chat.
- Prefer `.env.example` placeholders only.

---

## Validation

Record results in `.agile-v/VALIDATION_SUMMARY.md`.

Minimum after implementation: `npm run lint`, `npm run test`, `npm run build`.

---

## Project Memory

Resume from: **`.agile-v/STATE.md`**

Protocol: `docs/AGILE_V_PROTOCOL.md`

Playbooks (not as-built): `docs/VERCEL_PRODUCTION_GUARDRAILS.md`, `docs/LLM_MODEL_SELECTION.md`

---

## Session Workflow

1. Analyze → Plan → **Wait for Gate 1 approval**
2. After approval: implement approved TASK/REQ only → validate → update `.agile-v/`
