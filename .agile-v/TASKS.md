# TASKS.md — Prioritized Plan

**Active gate:** GATE-0011 (hidden-content crawl) — **blocked on human approval**  
**Rule:** No implementation until GATE-0011 approval. After approval, execute waves in order.

Historical C1 Waves 1–3 (REQ-0004…0010) were largely executed under prior GATE-0001 approval; see `CHANGELOG.md` / commits through `3075c34`.

---

## Wave 1 — FAQ / accordion harvest (P0)

| ID | Task | REQs | Affected files (expected) |
|----|------|------|---------------------------|
| TASK-0011 | Deterministic expand+harvest JS for Radix/single accordion; fix FAQ recipe; unit tests | REQ-0011 | `interaction-recipes.ts`, `interaction-recipes.test.ts`, possibly shared `expand-harvest.ts` |

## Wave 2 — General hidden toggles (P0)

| ID | Task | REQs | Affected files (expected) |
|----|------|------|---------------------------|
| TASK-0012 | Apply expand pass beyond `/faq`: details, collapsible, Read more / Show more; heuristic or always-on expand target | REQ-0011 | `interaction-recipes.ts`, `url-expander.ts` / `buildCrawlPlan`, tests |

## Wave 3 — Dialogs + budget (P0/P1)

| ID | Task | REQs | Affected files (expected) |
|----|------|------|---------------------------|
| TASK-0013 | Dialog/modal open→harvest→close; tighten `INTERACT_PROMPT`; raise/prioritize interact budget | REQ-0011 | `interaction-recipes.ts`, `firecrawl-client.ts`, `scrape-targets.ts`, `config.ts`, `.env.example` |

## Wave 4 — Prove (P0)

| ID | Task | REQs | Notes |
|----|------|------|-------|
| TASK-0014 | Manual smoke: portfolio FAQ answers + dialog test URL; VAL entries; sync STATE/PROJECT_PLAN/CLAUDE | REQ-0011 | Dialog URL confirmed at Gate |

---

## Explicit human decisions needed at GATE-0011

1. **Scope:** Approve TASK-0011…0014 (REQ-0011) for implementation?
2. **Dialog smoke URL:** W3C ARIA dialog demo (default in PLAN) or provide another URL?
3. **Interact budget:** Raise default `CRAWL_INTERACT_MAX_PAGES` 3 → 8?
4. **Expand coverage:** Heuristics when collapsibles/dialogs detected + always for FAQ-like paths (recommended), or expand every page?
