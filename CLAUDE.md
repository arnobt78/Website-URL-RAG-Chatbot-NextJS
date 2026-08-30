# CLAUDE.md

## Project Overview

| Field          | Value                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name           | Website URL RAG Chatbot                                                                                                                                        |
| Description    | Next.js 16 RAG chatbot: Firecrawl whole-site crawl (Upstash Workflow) or Jina single-page fallback, Upstash Vector RAG, multi-provider LLM stream, Redis history, localStorage multi-chat sidebar |
| Current Status | **GATE-0014 RESOLVED** — optional Crawl4AI provider + agentic pipeline service; Firecrawl default; GATE-0002 firewall set |
| Git baseline   | `97a29f6` / was `94abb75` |

---

## Tech Stack

| Area       | Choice                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| Frontend   | Next.js 16 App Router, React 19, TypeScript, Tailwind, NextUI, Framer Motion                         |
| Backend    | Next.js Route Handlers (Node serverless)                                                               |
| Data       | Upstash Redis + Upstash Vector (via `@upstash/rag-chat`); Firecrawl (default) or optional Crawl4AI + QStash Workflow; Jina single-page fallback |
| Deploy     | Vercel; Node **24.x**; optional Coolify for Crawl4AI / agentic-pipeline (see `docs/SELF_HOST_CRAWL.md`) |
| Observability | Optional Sentry (`@sentry/nextjs`, tunnel `/api/monitoring`) + Langfuse (server chat traces); disabled when DSNs/keys empty |
| Testing    | lint (`eslint .`) + `vitest run` + `next build`; optional `test:live-ingest`; agentic `pytest` under `services/agentic-pipeline/` |

---

## Architecture

Preserve existing structure under `src/app`, `src/components`, `src/lib`.

Core flow: `proxy.ts` → `[...url]/page.tsx` (`loadChatPageData` → Firecrawl workflow or Jina fallback) → `ChatWrapper` (polls `/api/crawl/status`; merges live progress via `mergeLiveCrawlContext` + `crawlProgressDisplay`; 403/429 toasts via `crawlStatusPollFailure`) / `ChatShell` → `POST /api/chat-stream` (site-root namespace + cookie + optional `chatId` → `chatWithFallback()`).

Crawl: `buildCrawlPlan` → provider scrape via `scrape-provider` (Firecrawl default or `CRAWL_PROVIDER=crawl4ai`) with **async expand/dialog harvest** + optional Firecrawl **/interact** (skipped for crawl4ai) → Redis live progress → index; each job has a **`runId`**. Separate experimental agentic pipeline: `services/agentic-pipeline/` (does not replace chat RAG).

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
