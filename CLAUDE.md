# CLAUDE.md

## Project Overview

| Field          | Value                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name           | Website URL RAG Chatbot                                                                                                                                        |
| Description    | Next.js 16 RAG chatbot: ingest a webpage via `/[...url]`, retrieve context from Upstash Vector, stream answers via multi-provider LLM fallback + Redis history |
| Current Status | **Implementation complete** — lint/test/build PASS; commit-ready; Human-Action: Vercel Firewall + production LLM env |
| Git baseline   | `24c776f` / `origin/main` (pre-overhaul)                                                                                                                       |

---

## Tech Stack

| Area       | Choice                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| Frontend   | Next.js 16 App Router, React 19, TypeScript, Tailwind, NextUI, Framer Motion                         |
| Backend    | Next.js Route Handlers (Node serverless)                                                               |
| Data       | Upstash Redis + Upstash Vector (via `@upstash/rag-chat`)                                               |
| LLM (code) | Multi-provider fallback in `src/lib/ai/` (Gemini → Groq → OpenRouter → Hugging Face → optional OpenAI) |
| Streaming  | Native `fetch` + ReadableStream (no AI SDK client)                                                     |
| Auth       | None (anonymous `sessionId` HttpOnly cookie via `src/proxy.ts`; API binds session to cookie + `canonicalUrl`) |
| SEO        | `src/lib/site.ts`, `opengraph-image.tsx`, `robots.ts`                                                        |
| Deploy     | Vercel; Node **24.x**; security headers + robots                                                       |
| Testing    | lint (`eslint .`) + `vitest run` + `next build`; npm audit 0                                           |

---

## Architecture

Preserve existing structure under `src/app`, `src/components`, `src/lib`.

Core flow: `proxy.ts` → `[...url]/page.tsx` (`loadChatPageData` + DNS-validated ingest) → `ChatWrapper` → `POST /api/chat-stream` (`canonicalUrl` + cookie → `chatWithFallback()`).

Security: SSRF DNS checks (`url-security.ts`), ingest/chat rate limits, CSP headers, session namespace isolation.

Do not invent a parallel RAG/LLM stack without an approved REQ.

Details: `.agile-v/phases/01-baseline-analysis/SUMMARY.md`

---

## Rendering Rules

- Keep `[...url]/page.tsx` a Server Component.
- Keep chat interactivity in client components (`ChatWrapper`, inputs).
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
