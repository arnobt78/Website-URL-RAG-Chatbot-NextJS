````md
/agile-v-core
/agile-v-pipeline

# Agile V Project Initialization and Resume Protocol

Use the Agile V Infinity Loop as the governing workflow for:

- new feature implementation
- project extension
- bug and issue resolution
- refactoring
- architecture improvements
- performance optimization
- security hardening
- validation and regression prevention

Follow the available Agile V architecture, pipeline, strategies, commands, skills, gates, and traceability conventions.

Do not invent unavailable Agile V commands or skills. Discover and use the Agile V-related capabilities that actually exist in the current environment.

---

## 1. Resume or Bootstrap the Project

First inspect the repository and determine whether an existing Agile V workspace already exists.

If `.agile-v/` exists:

1. Load its current state.
2. Resume from the most recent valid checkpoint.
3. Reconcile the recorded state with the actual repository.
4. Preserve valid historical decisions, requirements, gates, risks, and validation evidence.
5. Identify incomplete, deferred, blocked, failed, or outdated work.
6. Continue from where the previous session stopped.

If `.agile-v/` does not exist:

1. Bootstrap Cycle 1 as `C1`.
2. Create the required Agile V project memory and traceability files.
3. Analyze the existing codebase before defining requirements.
4. Assign stable requirement IDs such as `REQ-0001`.
5. Do not begin implementation until the initial analysis and plan are approved.

Create or maintain this structure where appropriate:

```text
Project/
├── CLAUDE.md
├── AGENTS.md
├── .cursorignore
│
├── .agile-v/
│   ├── STATE.md
│   ├── REQUIREMENTS.md
│   ├── DECISION_LOG.md
│   ├── VALIDATION_SUMMARY.md
│   ├── TASKS.md
│   ├── PLAYBOOK.md
│   ├── RISKS.md
│   ├── GATES.md
│   ├── CHECKLIST.md
│   └── CHANGELOG.md
│
├── .claude/
│   └── project-specific Claude configuration, commands, and skills
│
├── .cursor/
│   └── project-specific Cursor rules and configuration
│
└── docs/
    ├── architecture.md
    ├── api.md
    ├── deployment.md
    └── testing.md
```
````

Create only files that provide real value. Do not generate empty, duplicated, speculative, or contradictory documentation.

---

## 2. Synchronize Project Memory

Before proposing changes, inspect and synchronize:

- `.agile-v/*`
- `.claude/*`
- `.cursor/*`
- `CLAUDE.md`
- `AGENTS.md`
- existing architecture documentation
- repository history when available
- current source code
- tests and validation scripts
- package and dependency configuration
- database schema and migrations
- environment-variable examples
- deployment configuration

Treat the actual codebase as the source of truth when documentation is stale.

Update project memory so a future agent can understand:

- what the project does
- current architecture and stack
- current cycle and gate
- completed work
- active requirements
- open tasks
- deferred work
- known risks
- validation status
- important decisions
- next recommended action
- exact point where work stopped

Do not record unverified assumptions as facts.

---

## 3. Requirements and Traceability

Every meaningful requirement must have a stable ID:

```text
REQ-0001
REQ-0002
REQ-0003
```

Link requirements to:

- affected features
- architectural decisions
- implementation tasks
- code changes
- tests
- validation evidence
- risks
- gate decisions
- deferred work

Use additional IDs where useful:

```text
TASK-0001
DEC-0001
RISK-0001
VAL-0001
GATE-0001
ISSUE-0001
```

Never silently remove a requirement.

When a requirement changes, record:

- what changed
- why it changed
- who or what requested the change
- affected implementation
- affected tests
- migration or compatibility impact

---

## 4. Initial Analysis — No Coding Yet

For this first phase, do not write or modify implementation code.

Perform the following:

1. Analyze the complete repository structure.
2. Understand the architecture and data flow.
3. Identify frontend, backend, database, infrastructure, and integration boundaries.
4. Identify established coding conventions and reusable patterns.
5. Inspect related requirements, prior decisions, tests, and documentation.
6. Identify affected files and modules.
7. Detect duplicated, redundant, obsolete, conflicting, or unreachable code.
8. Detect security, performance, consistency, scalability, and maintainability risks.
9. Identify missing validation and regression coverage.
10. Prepare a detailed implementation or remediation plan.
11. Update the planning-related Agile V files.
12. Wait for explicit approval before changing implementation code.

The analysis must distinguish between:

- verified facts
- inferred behavior
- suspected problems
- unresolved questions
- recommended improvements
- deferred or out-of-scope work

Do not claim a problem is fixed before validating it.

---

## 5. Architecture and Consistency Rules

Preserve the existing architecture unless there is a documented reason to change it.

Follow the project’s established:

- folder structure
- naming conventions
- TypeScript conventions
- component architecture
- UI design system
- layouts
- spacing
- typography
- colors
- responsive behavior
- API conventions
- error-handling strategy
- authentication and authorization model
- database patterns
- caching strategy
- testing strategy
- deployment workflow

Prefer extending existing reusable abstractions over creating parallel implementations.

Before creating a new component, hook, utility, type, schema, service, API route, query key, invalidation helper, or styling pattern, search for an existing equivalent.

Avoid:

- duplicated business logic
- duplicated API requests
- duplicated schemas
- repeated query keys
- repeated mutation logic
- redundant state
- unnecessary wrappers
- premature abstractions
- dead code
- conflicting implementations
- unrelated refactoring

Do not modify unrelated files.

---

## 6. Server and Client Rendering Boundaries

For frameworks supporting server rendering, preserve server-first architecture.

Use route or page-level server components for:

- authentication and authorization checks
- initial data loading
- metadata
- route parameters
- stable page structure
- layout shells
- static text
- headings
- icons
- navigation
- server-prefetched data
- initial query state

Use client components only where client behavior is required, such as:

- local interactivity
- event handlers
- forms
- mutations
- live filters
- dialogs
- optimistic updates
- browser-only APIs
- client-side query synchronization

Do not mark an entire page as client-rendered merely because one small part is interactive.

Extract only the interactive portion into a client component.

Preserve stable server-rendered layout during navigation so the destination page can paint immediately while dynamic data resolves.

Use precise inline fallbacks only where data genuinely may be delayed.

Fallbacks should:

- preserve the final element’s dimensions
- avoid layout shift
- appear in the exact data location
- use subtle pulse or loading feedback
- not replace the entire page unnecessarily
- not display on every navigation when cached or prefetched data is already available

---

## 7. Navigation and Perceived Performance

Optimize navigation so pages feel immediate without making unsupported claims of literal zero latency.

Audit and improve:

- route prefetching
- server-rendered shells
- initial data hydration
- client query caching
- back and forward navigation
- tab changes
- detail-page navigation
- navbar links
- breadcrumbs
- title links
- pagination
- filters
- search
- role-based navigation
- nested layouts

The destination page should display its stable structure immediately when practical:

- layout
- shell
- headings
- labels
- buttons
- icons
- cards
- tables
- badges
- tabs
- static descriptions

Only unresolved server data should wait or show a dimension-preserving fallback.

Avoid unnecessary full-page loading states.

---

## 8. CRUD Mutation Consistency

Audit every create, read, update, and delete workflow.

After every successful mutation:

1. Confirm the server persisted the change.
2. Update or invalidate every affected client query.
3. Revalidate affected server-rendered routes or cached data where required.
4. Update optimistic state safely when beneficial.
5. Reconcile optimistic state with the server response.
6. Refresh derived values such as:
   - KPI cards
   - counts
   - badges
   - tables
   - detail pages
   - navigation indicators
   - notifications
   - analytics
   - insights
   - role-dependent views

7. Ensure back navigation does not display stale data.
8. Ensure another page using the same entity does not retain an old value.
9. Ensure failed mutations roll back optimistic changes.
10. Ensure successful mutations do not visually revert to stale cached data.

Use one consistent mutation and invalidation architecture across the codebase.

Centralize, where appropriate:

- query keys
- mutation domains
- invalidation mappings
- route revalidation
- optimistic update helpers
- cross-tab synchronization
- entity normalization
- mutation error handling

Do not issue duplicate refetches or invalidate unrelated domains.

Do not claim cross-device realtime unless WebSocket, SSE, subscription, polling, or equivalent infrastructure actually exists.

---

## 9. Shared Data and State

Use typed shared contracts for important domain entities.

Ensure relevant schema properties are consistently available to:

- server-rendered pages
- client components
- reusable hooks
- tables
- detail pages
- forms
- KPI cards
- badges
- analytics
- notifications
- role-based views

Do not pass every property globally without need.

Pass or preload only the data required by the relevant route or component while preserving a consistent typed domain model.

Avoid:

- deeply duplicated props
- stale local copies of server state
- untyped response shapes
- inconsistent entity representations
- independent sources of truth for the same data
- unnecessary global state

Client server-state should use the project’s established query/cache system.

UI-only state should remain local unless genuine cross-component sharing is required.

---

## 10. Data Durability and Production Safety

For every mutation, verify that changes are durable and do not revert after:

- navigation
- refresh
- reopening the page
- server restart
- deployment
- cache expiration
- background revalidation

Persist business data in the authoritative datastore.

Do not treat client cache, component state, browser storage, or temporary server memory as the business-data source of truth unless explicitly required.

Use transactions for multi-step business operations when partial completion would create inconsistency.

Validate:

- authorization
- ownership
- role permissions
- input schemas
- database constraints
- concurrency behavior
- idempotency
- retry behavior
- error handling
- rollback behavior

Never expose secrets through:

- source files
- logs
- screenshots
- generated documentation
- command-line arguments
- commits
- AI context
- examples containing real credentials

Do not intentionally expose `.env` or `.env.local` contents to an AI agent. Use `.env.example` with placeholder values for configuration understanding.

---

## 11. Implementation Protocol After Approval

After explicit approval:

1. Implement one logical step at a time.
2. Stay within the approved scope.
3. Follow existing architecture and conventions.
4. Reuse existing components, hooks, utilities, types, and services.
5. Avoid unrelated cleanup.
6. Add or update tests alongside behavior changes.
7. Validate each major step before continuing.
8. Explain important architectural decisions.
9. Update traceability documents as work progresses.
10. Stop and ask before making a major unapproved architectural change.

Use small, reviewable changes.

Do not mark requirements complete solely because code was written.

A requirement is complete only after relevant validation passes.

---

## 12. Validation Pipeline

Use the repository’s actual scripts and tooling.

At minimum, where supported, validate:

- formatting
- static analysis
- type checking
- linting
- unit tests
- integration tests
- end-to-end tests
- database migration behavior
- production build
- dependency/security audit
- accessibility
- performance
- authorization boundaries
- regression scenarios

Record:

- exact commands executed
- pass/fail result
- relevant output
- known limitations
- environment limitations
- skipped checks and reasons
- remaining manual verification

Never report a check as passed unless it was actually executed successfully.

Do not confuse local validation with production evidence.

---

## 13. Documentation Update Rules

Before finishing a work session, update only the files affected by the work.

At minimum, review:

```text
.agile-v/STATE.md
.agile-v/REQUIREMENTS.md
.agile-v/TASKS.md
.agile-v/DECISION_LOG.md
.agile-v/VALIDATION_SUMMARY.md
.agile-v/RISKS.md
.agile-v/GATES.md
.agile-v/CHANGELOG.md
CLAUDE.md
AGENTS.md
docs/architecture.md
docs/api.md
docs/deployment.md
docs/testing.md
```

Do not edit every file automatically.

Update a file only when its recorded information changed.

Keep `CLAUDE.md` and `AGENTS.md` compact and operational.

Put detailed history in `.agile-v/` or `docs/`.

Avoid copying the same information into multiple files.

---

## 14. End-of-Session Handoff

Before ending, write a precise handoff in `.agile-v/STATE.md` containing:

- current cycle
- current phase
- current gate
- active requirement IDs
- completed work
- files changed
- validation completed
- validation still required
- known failures
- deferred work
- blockers
- unresolved questions
- next exact action
- command or prompt needed to resume

A future agent should be able to continue without reconstructing the entire conversation.

---

## 15. Current Request

For the current session:

1. Load `CLAUDE.md`, `AGENTS.md`, and the latest `.agile-v/` state.
2. Discover available Agile V commands and skills.
3. Resume the latest valid cycle if one exists.
4. Otherwise bootstrap `C1`.
5. Reconcile documentation with the current repository.
6. Analyze the codebase architecture and current implementation.
7. Identify incomplete, deferred, inconsistent, duplicated, stale, or risky work.
8. Produce a prioritized plan with requirement IDs and affected files.
9. Update planning and state documents as needed.
10. Do not modify implementation code yet.
11. Wait for my approval before implementation.

````

## Short recurring prompt

After the project has been initialized once, use this for later sessions instead of pasting the full prompt:

```md
/agile-v-core
/agile-v-pipeline

Load `CLAUDE.md`, `AGENTS.md`, and the latest `.agile-v/STATE.md`.

Resume from the latest valid Agile V checkpoint and reconcile the recorded state with the actual repository.

Follow existing requirements, architecture, conventions, reusable patterns, rendering boundaries, mutation/invalidation strategy, validation pipeline, and traceability rules.

For this request:

1. Analyze the relevant code and current state.
2. Identify affected requirements and files.
3. Record risks, assumptions, and dependencies.
4. Produce a scoped implementation plan.
5. Do not modify implementation code until I approve the plan.

After approval:

1. Implement one logical step at a time.
2. Avoid unrelated changes and duplication.
3. Validate each affected behavior.
4. Update only the relevant `.agile-v/`, `CLAUDE.md`, `AGENTS.md`, and `docs/` files.
5. Finish with an exact resume point in `.agile-v/STATE.md`.
````

One important correction from the earlier setup: real `.env` and `.env.local` files should normally remain excluded from AI indexing. Keep only `.env.example` available, containing placeholder values rather than secrets.
