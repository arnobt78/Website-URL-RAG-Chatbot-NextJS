# REQUIREMENTS.md — Cycle C1

Status legend: `DRAFT` | `APPROVED` | `IN_PROGRESS` | `DONE` | `DEFERRED` | `WAIVED`

All items below are **DRAFT** pending **GATE-0001**.

---

## Baseline product (as-built)

### REQ-0001 — Webpage RAG chat via catch-all URL
**Priority:** P0  
**Status:** DRAFT (as-built; needs revalidation)  
**Description:** Visiting `/[...url]` reconstructs a target URL, indexes HTML into Upstash Vector if not already in Redis `indexed-urls`, loads last 10 messages for the session, and renders the chat UI.  
**Evidence paths:** `src/app/[...url]/page.tsx`, `src/lib/load-chat-page-data.ts`, `src/lib/ai/fallback-rag-chat.ts`, `src/lib/redis.ts`  
**Acceptance:** Given a public HTML site, first visit indexes; subsequent visits skip re-index; chat returns streamed answers grounded in indexed context.

### REQ-0002 — Streaming chat API
**Priority:** P0  
**Status:** DRAFT (as-built)  
**Description:** `POST /api/chat-stream` accepts `{ messages, sessionId }`, calls `chatWithFallback()` with streaming, returns `text/plain` stream with `X-LLM-Provider` / `X-LLM-Model` headers.  
**Evidence paths:** `src/app/api/chat-stream/route.ts`, `src/lib/ai/fallback-rag-chat.ts`, `src/components/ChatWrapper.tsx`  
**Acceptance:** Client `useChat` receives incremental tokens; history persists under `sessionId`.

### REQ-0003 — Anonymous session cookie
**Priority:** P0  
**Status:** DRAFT (as-built)  
**Description:** `src/proxy.ts` sets `sessionId` cookie (UUID) if missing and forwards `x-session-id` so chat history is per-browser+URL.  
**Evidence paths:** `src/proxy.ts`  
**Acceptance:** First response sets cookie; subsequent requests reuse it.

---

## Stabilization / correctness

### REQ-0004 — Align docs and env contract with code
**Priority:** P0  
**Status:** DRAFT  
**Description:** README and env documentation must match the active LLM provider (currently Upstash `upstash("meta-llama/Meta-Llama-3-8B-Instruct")` + Vector + Redis + QStash). Provide `.env.example` with placeholders only (never real secrets).  
**Acceptance:** New contributor can configure from `.env.example` + README without contradictory OpenAI-required messaging unless OpenAI path is re-enabled.

### REQ-0005 — Fix broken home-route static assets
**Priority:** P1  
**Status:** DRAFT  
**Description:** `src/app/page.tsx` still references `/next.svg` and `/vercel.svg`. Local tree deleted those files and added `public/logo.svg`. Home route must not 404 images.  
**Acceptance:** `/` loads without missing-asset errors; OG/twitter images in layout consistent with available public assets.

### REQ-0006 — Establish validation baseline
**Priority:** P0  
**Status:** DRAFT  
**Description:** Run and record `lint`, `build` (and typecheck if available). Document commands and results in `VALIDATION_SUMMARY.md`.  
**Acceptance:** At least one clean production build recorded, or failures filed as ISSUEs with owners.

---

## Production safety (from playbook — scoped)

### REQ-0007 — Apply Next.js-relevant Vercel production guardrails
**Priority:** P1  
**Status:** DRAFT  
**Description:** From `docs/VERCEL_PRODUCTION_GUARDRAILS.md`, apply only stack-matching items: security headers, static asset caching guidance, `robots` guidance, and document Human-Action dashboard bot protection. Do not break chat or SSR ingestion.  
**Acceptance:** Checklist items for Next.js marked done or explicitly deferred with rationale in `RISKS.md` / `DECISION_LOG.md`.

---

## Optional product evolution (needs explicit scope choice)

### REQ-0008 — Multi-provider LLM fallback
**Priority:** P2  
**Status:** DRAFT / candidate  
**Description:** Adapt patterns from `docs/LLM_MODEL_SELECTION.md` to this Next.js Upstash RAG app (not the Express `backend/src/lib/ai/providers.ts` referenced in that doc). Preserve RAG context injection.  
**Acceptance:** Documented provider chain; automatic failover on provider errors; secrets server-side only.  
**Note:** Deferred unless Gate 1 includes it in C1 scope.

### REQ-0009 — Replace create-next-app home with product entry UX
**Priority:** P2  
**Status:** DRAFT / candidate  
**Description:** Replace boilerplate `page.tsx` with a minimal entry that explains how to chat via `/www.example.com` (or URL input). Preserve server-first rules.  
**Acceptance:** First viewport communicates product purpose and path to chat.

### REQ-0010 — Automated regression for RAG happy path
**Priority:** P2  
**Status:** DRAFT / candidate  
**Description:** Add minimal test or scripted smoke for session cookie + chat route contract (no live paid API required for unit-level; integration may be manual/WAIVED).  
**Acceptance:** Documented VAL entry; automated where feasible without leaking secrets.

---

## Crawl quality — hidden / interactive content

### REQ-0011 — Expand and index revealable page content (FAQ, toggles, dialogs)
**Priority:** P0  
**Status:** DONE (GATE-0011 resolved)  
**Description:** Whole-site crawl indexes text available after common UI reveals: FAQ/accordion (including Radix single-open), `<details>`, collapsible panels, “Read more” / expand toggles, `[role="tab"]` tablists, and content dialogs/modals. Deterministic async Firecrawl `executeJavascript` harvest into `#rag-crawl-harvest` is preferred; `/interact` remains a budgeted fallback (`CRAWL_INTERACT_MAX_PAGES` default 8). `CRAWL_EXPAND_HIDDEN` defaults on. Does not submit forms (only skips `type=submit` inside `<form>`) or navigate off-site.  
**Evidence paths:** `src/lib/crawl/expand-harvest.ts`, `interaction-recipes.ts`, `scrape-targets.ts`, `firecrawl-client.ts`, `config.ts`, `scripts/e2e-hidden-content-matrix.ts`, `.agile-v/phases/02-hidden-content-crawl/PLAN.md`  
**Acceptance:**
1. Re-crawl `www.arnobmahmud.com` → chat answers FAQ **pricing**, **work permit**, and **communication** from indexed answer bodies. **PASS**
2. Dialog smoke on W3C APG dialog URL → distinctive dialog body text harvested. **PASS**
3. Unit tests cover harvest + recipes; `lint` + `test` + `build` PASS. **PASS**
**Linked:** TASK-0011…0014 (done), RISK-0010 (mitigated), GATE-0011

---

## OSS polish + scale hardening

### REQ-0012 — Phase 4 OSS polish + crawl/chat scale hardening
**Priority:** P0  
**Status:** DONE (GATE-0012 resolved)  
**Description:** Prepare the repo for public GitHub use and harden demo-scale abuse/cost UX: accurate README + architecture mermaid for whole-site crawl + expand harvest; CONTRIBUTING + issue templates; mocked Firecrawl tests in CI; env-tunable rate limits; clearer crawl error and progress messaging. Demo GIF deferred. Phase 5 Crawl4AI and observability SaaS out.  
**Evidence paths:** `README.md`, `CONTRIBUTING.md`, `.github/ISSUE_TEMPLATE/`, `src/lib/rate-limit.ts`, `src/lib/parse-positive-int.ts`, `src/lib/crawl/crawl-errors.ts`, `src/lib/crawl/firecrawl-client.test.ts`, `.env.example`, `.agile-v/phases/03-oss-scale-hardening/PLAN.md`  
**Acceptance:**
1. README/CONTRIBUTING match shipped crawl+RAG architecture; default CI green without live Firecrawl key. **PASS**
2. Rate limits configurable via env; over-limit paths show actionable user-facing errors. **PASS**
3. `lint` + `test` + `build` PASS. **PASS**
**Linked:** TASK-0015…0020 (done), GATE-0012, RISK-0005, RISK-0011, RISK-0013, RISK-0014

---

## Observability

### REQ-0013 — Sentry same-origin tunnel + Langfuse chat tracing
**Priority:** P0  
**Status:** DONE (GATE-0013 resolved; Vercel env + firewall confirmed)  
**Description:** Optional Sentry via `@sentry/nextjs` with same-origin tunnel `/api/monitoring` (ad-blocker bypass), quiet CI (`silent`/`telemetry` off spam), shared noise filters. Optional server-only Langfuse traces on `/api/chat-stream`. PostHog out. Empty keys disable both.  
**Evidence paths:** `next.config.mjs`, `instrumentation-client.ts`, `sentry.*.config.ts`, `src/instrumentation.ts`, `src/lib/sentry-*.ts`, `src/lib/langfuse.ts`, `src/app/api/chat-stream/route.ts`, `.env.example`  
**Acceptance:**
1. Client events use `/api/monitoring` rewrite (not direct ingest from browser). **PASS** (routes-manifest)
2. Empty Sentry/Langfuse env → lint/test/build PASS. **PASS**
3. Filters drop extension noise; expected 429/403 do not ERROR-flood Langfuse. **PASS**
**Linked:** GATE-0013, RISK-0005

---

## Non-goals for C1 (unless approved)

- Reintroducing the previously removed experimental scraper / Groq-only parallel stack without a REQ.
- Reading or committing real `.env` values.
- Unrelated refactors of UI libraries (NextUI/Shadcn) unless required by an approved REQ.
- Phase 5 VPS / Crawl4AI self-host (deferred; not part of GATE-0012).
- README demo GIF (deferred; mermaid + screenshots instead).
