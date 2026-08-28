# DECISION_LOG.md

Append-only. Do not rewrite prior entries.

---

## DEC-0001 — Bootstrap Cycle C1
| Field | Value |
|-------|-------|
| Timestamp | 2026-08-25T19:55:26Z |
| Agent | Agile V Orchestrator |
| Decision | No `.agile-v/` existed after restore to `origin/main` @ `24c776f`. Bootstrap Cycle **C1** with planning artifacts only. |
| Rationale | Protocol §1: bootstrap when missing; analyze before coding; wait for Human Gate 1. |
| Linked | GATE-0001, REQ-0001…REQ-0010 |

## DEC-0002 — Treat `src/` as source of truth over README
| Field | Value |
|-------|-------|
| Timestamp | 2026-08-25T19:55:26Z |
| Agent | Agile V Orchestrator |
| Decision | Active LLM path is Upstash RAG Chat + `upstash("meta-llama/Meta-Llama-3-8B-Instruct")`, not the OpenAI-primary narrative in README. |
| Rationale | `src/lib/rag-chat.ts` is authoritative; README/layout keywords still advertise OpenAI. |
| Linked | REQ-0004 |

## DEC-0003 — Portable docs are references, not as-built
| Field | Value |
|-------|-------|
| Timestamp | 2026-08-25T19:55:26Z |
| Agent | Agile V Orchestrator |
| Decision | `docs/LLM_MODEL_SELECTION.md` and `docs/VERCEL_PRODUCTION_GUARDRAILS.md` are reusable playbooks. They reference other projects (CodeBook/FreeScribe) and paths that do not exist here. Do not treat their “reference implementation in this repo” sections as true for this codebase until adapted under approved REQs. |
| Rationale | Avoid false traceability and premature multi-provider work. |
| Linked | REQ-0007, REQ-0008 |

## DEC-0004 — Implementation freeze until Gate 1
| Field | Value |
|-------|-------|
| Timestamp | 2026-08-25T19:55:26Z |
| Agent | Agile V Orchestrator |
| Decision | No implementation code changes in this session. Planning/state docs + CLAUDE.md/AGENTS.md only. |
| Rationale | Protocol §4 / user instruction. |
| Linked | GATE-0001 |

## DEC-0005 — Next 16.3.3 for npm audit 0
| Field | Value |
|-------|-------|
| Timestamp | 2026-08-25T20:40:00Z |
| Agent | Agile V Orchestrator |
| Decision | Upgrade Next from 14.2.x to **16.3.3** (keep React 18.3.1) because npm advisories only clear at next@16.3.3+. Replace AI SDK `useChat` with native stream client to avoid ai@7 breaking rag-chat adapter. Override `langchain` → `@langchain/classic` for legacy deep imports. |
| Rationale | Required for `npm audit` = 0 without deleting RAG functionality. |
| Linked | REQ-0006, REQ-0007, VAL-0001..0004 |

## DEC-0006 — Firewall remains Human-Action
| Field | Value |
|-------|-------|
| Timestamp | 2026-08-25T20:40:00Z |
| Agent | Agile V Orchestrator |
| Decision | Bot Protection Challenge + AI Bots Deny must be enabled in Vercel dashboard (not expressible fully in repo). |
| Rationale | Playbook §1.1; no impact on normal users. |
| Linked | REQ-0007 |

## DEC-0007 — Hidden-content crawl plan (REQ-0011); freeze until GATE-0011
| Field | Value |
|-------|-------|
| Timestamp | 2026-08-28T20:54:00Z |
| Agent | Agile V Orchestrator |
| Decision | New REQ-0011 for FAQ/accordion/dialog/toggle expand+harvest. Root cause: Radix single accordion leaves answers out of DOM until opened; current `[data-state=closed]` click-all is insufficient. Implementation frozen pending GATE-0011. Phase 5 VPS out of this gate. |
| Rationale | Protocol §4; user requested plan-first for remaining RAG blockers. |
| Linked | REQ-0011, GATE-0011, TASK-0011…0014 |

## DEC-0008 — REQ-0011 implemented; Phase 4/5 deferred
| Field | Value |
|-------|-------|
| Timestamp | 2026-08-28T22:50:00Z |
| Agent | Cursor |
| Decision | Ship async expand/dialog harvest (`expand-harvest.ts`): no click-all closed; form-aware isChrome; read-more + `[role="tab"]`; interact default 8; expand default on. GATE-0011 resolved. Next cycle: Phase 4 OSS + abuse/budget/observability; Phase 5 Crawl4AI later — not more resume-tab special cases. |
| Rationale | Live Firecrawl matrix + in-app FAQ chat smoke PASS; accepted limits: CSS-only with no control; resume English labels are bonus on `/resume|cv|profile`. |
| Linked | REQ-0011, GATE-0011, VAL-0043…0046 |
