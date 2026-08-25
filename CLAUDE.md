# CLAUDE.md

## Project Overview

| Field          | Value                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name           | Website URL RAG Chatbot                                                                                                                                        |
| Description    | Next.js 16 RAG chatbot: Jina ingest via `/[...url]`, Upstash Vector RAG, multi-provider LLM stream, Redis history, localStorage multi-chat sidebar             |
| Current Status | **Implementation complete** — lint/test/build PASS; commit-ready; Human-Action: Vercel Firewall + production LLM/Jina env                                      |
| Git baseline   | `94ccdc6` / `origin/main` (pre Jina + chat UI overhaul)                                                                                                        |

---

## Tech Stack

| Area       | Choice                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| Frontend   | Next.js 16 App Router, React 19, TypeScript, Tailwind, NextUI, Framer Motion                         |
| Backend    | Next.js Route Handlers (Node serverless)                                                               |
| Data       | Upstash Redis + Upstash Vector (via `@upstash/rag-chat`); Jina Reader for page text                    |
| LLM (code) | Multi-provider fallback in `src/lib/ai/` (Gemini → Groq → OpenRouter → Hugging Face → optional OpenAI) |
| Streaming  | Native `fetch` + ReadableStream (no AI SDK client)                                                     |
| Auth       | None (anonymous `sessionId` HttpOnly cookie via `src/proxy.ts`; API binds session to cookie + `canonicalUrl` + optional `chatId`) |
| Sessions UI | Browser localStorage registry (`chat-sessions-storage.ts`); not multi-tenant DB                      |
| SEO        | `src/lib/site.ts`, `opengraph-image.tsx`, `robots.ts`                                                        |
| Deploy     | Vercel; Node **24.x**; security headers + robots; GitHub Actions CI                                   |
| Testing    | lint (`eslint .`) + `vitest run` + `next build`; optional `test:live-ingest`                          |

---

## Architecture

Preserve existing structure under `src/app`, `src/components`, `src/lib`.

Core flow: `proxy.ts` → `[...url]/page.tsx` (`fetchPageContentAsText` / Jina + `loadChatPageData`) → `ChatWrapper` / `ChatShell` → `POST /api/chat-stream` (`canonicalUrl` + cookie + optional `chatId` → `chatWithFallback()`).

Security: SSRF DNS checks (`url-security.ts`), ingest/chat rate limits, CSP headers, session namespace isolation (`INDEX_CONTENT_VERSION`).

Do not invent a parallel RAG/LLM stack without an approved REQ.

Details: `.agile-v/phases/01-baseline-analysis/SUMMARY.md`

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
