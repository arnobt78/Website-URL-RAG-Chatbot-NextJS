# PLAN — Hidden / interactive content crawl (REQ-0011)

**Cycle:** C1  
**Gate:** GATE-0011 (pending approval)  
**Status:** PLAN ONLY — no implementation until approved  
**Git HEAD at plan time:** `3075c34`

---

## Problem (verified)

Manual smoke 2026-08-27 on `www.arnobmahmud.com`:

| Area | Result |
|------|--------|
| Resume tabs | Chat answers OK |
| FAQ `/faq` | Questions indexed; **answers missing** (except ~1 item) |
| Dialogs | Untested (portfolio has no content dialogs) |

### Root cause (live HTML audit 2026-08-28)

FAQ uses **Radix Accordion** (`button[aria-expanded]`, `data-state`, empty closed panels). Answers are **not in the DOM** until each item is opened.

Current recipe in `interaction-recipes.ts` does:

1. Click all `details summary` — **none exist** on this FAQ.
2. Click all `[data-state="closed"]` — too broad (nav menus, language picker, accordion **panels** + triggers).
3. Even if triggers fire: **single-open accordion** keeps only the **last** item open → scrape markdown ≈ all questions + one answer. Matches smoke (“work authorization” worked; pricing/timeline/remote did not).

Secondary risks:

- `CRAWL_INTERACT_MAX_PAGES=3` may starve later `preferInteract` targets.
- `INTERACT_PROMPT` does not mention dialogs/modals or single-accordion harvest.
- Interaction recipes are **path-gated** (`/faq`, `/resume|cv|profile`) — other sites with collapsibles/dialogs get no expand pass.
- `hashLinksFromPage` exists but is not wired into the crawl loop (known low priority; optional if time).

---

## Goal

Crawl and index **visible + revealable** page content across common UI patterns so RAG can answer from FAQ answers, dialog body text, toggles, and similar hidden sections — not only already-visible headings.

---

## In scope

1. **FAQ / accordion fix** — deterministic expand+harvest that works for Radix single/multi accordion (validated on `arnobmahmud.com/faq`).
2. **General expand pass** — apply on any page (or heuristically when collapsibles detected), covering:
   - `<details>` / summary
   - Accordion / collapsible (`aria-expanded`, `data-state` on **triggers only**)
   - “Read more” / “Show more” / “Expand” style buttons
   - Hidden panels revealed by toggle buttons (not form submits)
3. **Dialog / modal recipe** — open content dialogs (`aria-haspopup="dialog"`, `[role="dialog"]`), extract body text into harvest node, close without navigating away; **exclude** cookie banners / language menus where detectable.
4. **Interact fallback** — tighten `INTERACT_PROMPT`; reserve/prioritize interact budget for `preferInteract` / thin pages.
5. **Manual smoke**
   - Re-crawl `www.arnobmahmud.com` → chat must answer pricing, timeline, remote, process from FAQ.
   - Crawl a **public dialog demo URL** (proposed: W3C ARIA dialog example, or user-supplied URL) → chat must retrieve dialog body content after open.
6. Unit tests for recipes + plan merge behavior; lint/test/build.

## Out of scope (this gate)

- Phase 5 VPS / Crawl4AI self-host
- Phase 4 README GIF / OSS polish
- Login-gated content, CAPTCHA, paywalls
- Submitting forms or multi-step checkout flows
- Guaranteeing 100% coverage of every exotic widget (document residual gaps)

---

## Proposed design

### A. Shared “expand & harvest” JS action (primary)

Replace brittle click-all with a single `executeJavascript` that:

1. **Harvests** into a visible `#rag-crawl-harvest` node appended to `document.body` (so markdown extractors see it).
2. For each accordion/collapsible **trigger** (`button[aria-expanded]`, `[role="button"][aria-expanded]`, `summary`), excluding `aria-haspopup` menus:
   - click → read controlled panel (`aria-controls` / next sibling) → append `Q/A` or section text to harvest → if single-mode, proceed to next (do not rely on all open at once).
3. For **details**: open all, copy content.
4. For **Read more / Show more**: click matching buttons (text/aria-label heuristics), append newly revealed text.
5. For **dialogs** (optional flag / separate target): click openers with `aria-haspopup="dialog"` (capped), copy `[role="dialog"]` text, press Escape / click close, continue.
6. Never click `type="submit"`, download, or external navigations.

### B. Recipe wiring

- `interaction-recipes.ts`:  
  - FAQ target uses harvest script (not path-only fragile selectors).  
  - Add `expand-all` variant for general pages when HTML heuristics match OR always as low-cost second scrape for top-N pages (config).  
  - Add `dialogs-expanded` target when dialog openers detected or via `/dialog` test path heuristic + general `preferInteract` for modal-heavy pages.
- Keep path shortcuts for known sites but **do not require** `/faq` path for accordion harvest if page has accordion markers.

### C. Budget / config

| Env | Current default | Proposed |
|-----|-----------------|----------|
| `CRAWL_INTERACT_MAX_PAGES` | 3 | Raise default to **8** (still capped ≤20); prioritize `preferInteract` targets first in scrape order |
| `CRAWL_MAX_ACTIONS_PER_PAGE` | 8 | Keep 8+; harvest script is 1 JS action + waits |
| New optional | — | `CRAWL_EXPAND_HIDDEN=true` (default on) to enable general expand pass |

Reorder scrape so expanded/preferInteract targets run while interact budget remains.

### D. Interact prompt

Extend `INTERACT_PROMPT` to: open FAQ items one-by-one and retain all answers; open content dialogs; expand Read more; do not open language/cookie chrome.

---

## Implementation waves (after approval)

| Wave | TASK | Work |
|------|------|------|
| 1 | TASK-0011 | Accordion/FAQ harvest script + FAQ recipe fix + unit tests |
| 2 | TASK-0012 | General expand (details, toggles, read-more) applied beyond `/faq` |
| 3 | TASK-0013 | Dialog/modal recipe + interact prompt + budget/priority |
| 4 | TASK-0014 | Manual smoke: portfolio FAQ + public dialog URL; record VAL; update docs |

---

## Acceptance criteria

1. After re-crawl of `www.arnobmahmud.com`, chat answers at least **pricing**, **timeline**, and **remote** using FAQ answer text (not “I don’t know” / question-only).
2. Indexed markdown for FAQ expanded variant contains multiple answer bodies (spot-check ≥3 distinct answers).
3. On approved dialog test URL, crawl indexes dialog body text that is absent from the closed-page scrape; chat can retrieve a distinctive phrase from the dialog.
4. `npm run lint`, `npm run test`, `npm run build` PASS.
5. No secrets committed; no form-submit interactions in recipes.

---

## Test URLs (proposed)

| Purpose | URL | Notes |
|---------|-----|-------|
| FAQ / accordion | `https://www.arnobmahmud.com/faq` | Primary regression |
| Full site | `https://www.arnobmahmud.com` | Re-crawl end-to-end |
| Dialog | `https://www.w3.org/WAI/content-assets/wai-aria-practices/patterns/dialog-modal/examples/dialog.html` | Stable public ARIA dialog demo — **confirm or replace at Gate** |

---

## Risks

| Risk | Mitigation |
|------|------------|
| Extra scrapes → Firecrawl cost/time | Cap expand targets; raise interact budget carefully; prefer one harvest JS over N scrapes |
| Clicking wrong UI (cookie/lang/chat) | Exclude `aria-haspopup="menu"`, chat widgets, known chrome selectors |
| Single-accordion race | Harvest-per-item into DOM node, don’t require all open |
| Dialog test URL flaky | Allow user override URL; document WAIVE if blocked |
| Markdown extractor ignores harvest node | Style node as visible main content; fallback to interact |

---

## Decision points for human (Gate 0011)

1. Approve scope Waves 1–4 as above?  
2. Confirm dialog smoke URL (W3C default vs your URL)?  
3. OK to raise default `CRAWL_INTERACT_MAX_PAGES` 3 → 8?  
4. Apply general expand to **all** pages in plan, or only when heuristics detect collapsibles/dialogs (recommended: **heuristics + always for `/faq`-like paths**)?
