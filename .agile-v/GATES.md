# GATES.md

## GATE-0001 — Human Gate 1 (Requirements / Plan Approval)

| Field | Value |
|-------|-------|
| Stage | After Requirements + Analysis; before Synthesis (Build) |
| Status | **PENDING** |
| Cycle | C1 |
| Resume token | `C1-GATE1-2026-08-25` |

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
| Status | NOT STARTED |
| Prereqs | VALIDATION_SUMMARY, EVAL_RESULTS (or WAIVE), Red Team verification |
