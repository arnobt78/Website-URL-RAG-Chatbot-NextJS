# APPROVALS.md

Append-only approval records.

---

## GATE-0001 — Plan approval (Guardrails + Deps + Node 24)

```text
APPROVED: GATE-0001
resume_token: C1-GATE1-2026-08-25
scope: Vercel guardrails + dependency/security upgrade + Node 24.x
source: user attached/confirmed plan Guardrails Deps Node24
approver: user
date: 2026-08-25
```

---

## GATE-0011 — Hidden-content crawl plan approval

```text
APPROVED: GATE-0011
resume_token: C1-GATE1-HIDDEN-2026-08-28
scope: TASK-0011..0014
dialog_url: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/
interact_budget: 8
expand_mode: heuristics+faq (CRAWL_EXPAND_HIDDEN default on)
source: user directed implement-deep + verify-deep + commit-ready
approver: user
date: 2026-08-28
```

---

## GATE-0012 — OSS polish + scale hardening approval

```text
APPROVED: GATE-0012
resume_token: C1-GATE1-SCALE-2026-08-30
scope: TASK-0015..0020
demo_media: mermaid+README (GIF deferred)
observability_saas: out
source: user approved GATE-0012 defaults + implement-deep + verify-deep + commit-ready
approver: user
date: 2026-08-30
```

---

## GATE-0013 — Sentry tunnel + Langfuse tracing approval

```text
APPROVED: GATE-0013
resume_token: C1-GATE1-OBS-2026-08-30
scope: Sentry tunnel + quiet CI/filters + Langfuse chat tracing
posthog: out
source: user confirmed plan implement GATE-0013
approver: user
date: 2026-08-30
```

---

## GATE-0002 — Vercel firewall / Bot Protection (Human-Action)

```text
APPROVED: GATE-0002
resume_token: C1-GATE2-FIREWALL
scope: Vercel Bot Protection Challenge + AI Bots Deny + production env (Sentry/Langfuse)
source: user confirmed dashboard settings complete during GATE-0013 commit-ready
approver: user
date: 2026-08-30
```

---

## GATE-0014 — Phase 5 Crawl4AI + agentic pipeline approval

```text
APPROVED: GATE-0014
resume_token: C1-GATE1-PHASE5-2026-08-31
scope: Wave A Crawl4AI + Wave B agentic pipeline (separate service)
default_crawl: firecrawl
source: user confirmed plan implement GATE-0014
approver: user
date: 2026-08-31
```

---

## GATE-0015 — Multi-agent debate approval

```text
APPROVED: GATE-0015
resume_token: C1-GATE1-DEBATE-2026-08-31
scope: crawl_qa + draft A/B + boss validator; local gitignored env tokens
source: user approved plan GATE-0014 close-out + GATE-0015 multi-agent
approver: user
date: 2026-08-31
```
