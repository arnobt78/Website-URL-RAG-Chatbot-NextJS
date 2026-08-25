# TASKS.md — Prioritized Plan (Gate 1)

**Blocked on:** GATE-0001 human approval  
**Rule:** No implementation until approval. After approval, execute one logical step at a time.

---

## Wave 1 — Stabilize baseline (P0)

| ID | Task | REQs | Affected files (expected) |
|----|------|------|---------------------------|
| TASK-0001 | Decide & document active LLM provider; sync README; add `.env.example` placeholders | REQ-0004 | `README.md`, `.env.example` (new), possibly comment cleanup in `src/lib/rag-chat.ts` |
| TASK-0002 | Repair home/OG static assets (`next.svg`/`vercel.svg` vs `logo.svg`) | REQ-0005 | `src/app/page.tsx`, `src/app/layout.tsx`, `public/*` |
| TASK-0003 | Run lint + production build; record evidence | REQ-0006 | `.agile-v/VALIDATION_SUMMARY.md` |

## Wave 2 — Production guardrails (P1)

| ID | Task | REQs | Affected files (expected) |
|----|------|------|---------------------------|
| TASK-0004 | Add security headers via `next.config.mjs` (+ optional `vercel.json`) | REQ-0007 | `next.config.mjs`, `vercel.json` |
| TASK-0005 | Add `robots.ts` / crawl guidance appropriate for a chat demo | REQ-0007 | `src/app/robots.ts` |
| TASK-0006 | Document Human-Action: Vercel Bot Protection / AI Bots Deny | REQ-0007 | `.agile-v/GATES.md`, `docs/` only if needed |

## Wave 3 — Product upgrades (P2 — optional, choose at Gate 1)

| ID | Task | REQs | Notes |
|----|------|------|-------|
| TASK-0007 | Product home / URL entry UX | REQ-0009 | Only if approved |
| TASK-0008 | Multi-provider fallback design+impl adapted to this repo | REQ-0008 | Large; may become C2 |
| TASK-0009 | Minimal regression/smoke strategy | REQ-0010 | May WAIVE live RAG e2e |

---

## Recommended C1 approval package

**Approve for implementation now:** TASK-0001 … TASK-0006 (REQ-0004…0007)  
**Defer to C2 unless you say otherwise:** TASK-0007…0009 (REQ-0008…0010)

---

## Explicit human decisions needed at Gate 1

1. **LLM:** Keep Upstash QStash Llama-3-8B, switch to OpenAI, or plan multi-provider (REQ-0008)?
2. **Assets:** Restore stock SVGs, switch fully to `logo.svg`, or mixed?
3. **C1 scope:** Waves 1–2 only, or include Wave 3 items?
