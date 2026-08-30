# GATES.md

## GATE-0001 — Human Gate 1 (Requirements / Plan Approval)

| Field | Value |
|-------|-------|
| Stage | After Requirements + Analysis; before Synthesis (Build) |
| Status | **RESOLVED** (see APPROVALS.md; historical) |

### Evidence Summary
```
Scope: analyzed repo + bootstrapped .agile-v planning | Traceability: REQ-0001..0010, TASK-0001..0009
Findings: FLAG — docs drift; broken home assets; no tests; guardrails not applied; multi-provider docs not wired
Decision Points: LLM choice; asset strategy; C1 vs C2 scope for Wave 3
Log: 2026-08-25T19:55:26Z | ORCHESTRATOR | PLAN_READY | awaiting human | GATE-0001
```

### Approve by recording below (human)

```text
APPROVED: GATE-0001
resume_token: C1-GATE1-2026-08-25
scope: [Waves 1-2 | Waves 1-2-3 | custom]
LLM decision: [keep Upstash | OpenAI | multi-provider C2]
assets: [restore SVGs | use logo.svg | other]
approver: <name>
date: <ISO>
```

Until this appears in `APPROVALS.md` (or explicit chat approval matching the token), **no implementation**.

---

## GATE-0002 — Human Gate 2 (Release / Acceptance)

| Field | Value |
|-------|-------|
| Status | **RESOLVED** (firewall Human-Action reported done 2026-08-30) |
| Prereqs | VALIDATION_SUMMARY; Bot Protection Challenge + AI Bots Deny on Vercel |

### Evidence Summary
```
Scope: Vercel Bot Protection Challenge + AI Bots Deny; production env incl. Sentry/Langfuse
Source: human confirmed dashboard configuration complete
Log: 2026-08-30T22:10:00Z | ORCHESTRATOR | GATE_RESOLVED | firewall Human-Action
```

---

## GATE-0011 — Human Gate 1 (Hidden-content crawl plan)

| Field | Value |
|-------|-------|
| Stage | After analysis + PLAN; Synthesis complete for REQ-0011 |
| Status | **RESOLVED** |
| Cycle | C1 |
| Resume token | `C1-GATE1-HIDDEN-2026-08-28` |
| Plan | `.agile-v/phases/02-hidden-content-crawl/PLAN.md` |
| Approval | `.agile-v/APPROVALS.md` |

### Evidence Summary
```
Scope: REQ-0011 FAQ/accordion/dialog/toggle expand+harvest | Traceability: TASK-0011..0014
Findings: PASS — async harvest; live matrix + in-app FAQ chat smoke; form-aware isChrome; role=tab + read-more
Defaults locked: interact budget 8; CRAWL_EXPAND_HIDDEN on; dialog smoke W3C APG
Log: 2026-08-28T22:50:00Z | ORCHESTRATOR | GATE_RESOLVED | REQ-0011 verified
```

---

## GATE-0012 — Human Gate 1 (OSS polish + scale hardening)

| Field | Value |
|-------|-------|
| Stage | After REQ-0011; Synthesis complete for REQ-0012 |
| Status | **RESOLVED** |
| Cycle | C1 |
| Resume token | `C1-GATE1-SCALE-2026-08-30` |
| Plan | `.agile-v/phases/03-oss-scale-hardening/PLAN.md` |
| Approval | `.agile-v/APPROVALS.md` |

### Evidence Summary
```
Scope: REQ-0012 Phase 4 OSS + scale hardening | Traceability: TASK-0015..0020
Findings: PASS — mermaid README (no GIF); CONTRIBUTING + issue templates; mocked Firecrawl tests;
  env RATE_LIMIT_*; crawl-errors UX; lint/test/build green
Defaults locked: GIF deferred; observability SaaS out; Phase 5 deferred
Log: 2026-08-30T21:46:00Z | ORCHESTRATOR | GATE_RESOLVED | REQ-0012 verified
```

---

## GATE-0013 — Human Gate 1 (Sentry tunnel + Langfuse)

| Field | Value |
|-------|-------|
| Stage | Observability after REQ-0012 |
| Status | **RESOLVED** (implementation verified; commit pending) |
| Cycle | C1 |
| Resume token | `C1-GATE1-OBS-2026-08-30` |
| Approval | `.agile-v/APPROVALS.md` |

### Evidence Summary
```
Scope: REQ-0013 Sentry tunnel + quiet CI/filters + Langfuse chat tracing | PostHog out
Findings: PASS — tunnelRoute /api/monitoring in routes-manifest; lint/test/build green
Log: 2026-08-30T22:05:00Z | ORCHESTRATOR | GATE_RESOLVED | REQ-0013 implemented
```

---

## GATE-0014 — Human Gate 1 (Phase 5 Crawl4AI + agentic)

| Field | Value |
|-------|-------|
| Stage | After REQ-0013; Phase 5 plan |
| Status | **RESOLVED** (lint/test/build + pytest PASS; commit-ready) |
| Cycle | C1 |
| Resume token | `C1-GATE1-PHASE5-2026-08-31` |
| Approval | `.agile-v/APPROVALS.md` |

### Evidence Summary
```
Scope: REQ-0014 Wave A Crawl4AI + Wave B agentic pipeline | default crawl: firecrawl
Findings: PASS — docker/crawl4ai; crawl4ai-client + scrape-provider; SELF_HOST_CRAWL.md;
  services/agentic-pipeline 7-stage + MCP; VAL-0054..0057
Log: 2026-08-31 | ORCHESTRATOR | GATE_RESOLVED | REQ-0014 verified
```
