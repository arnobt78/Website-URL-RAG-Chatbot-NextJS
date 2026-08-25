# AGENTS.md

All AI coding agents (Claude Code, Cursor, Codex, Gemini, etc.) follow the same workflow for this repo.

---

## Source of Truth

1. **Code under `src/`** beats README/docs when they conflict.
2. **`.agile-v/STATE.md`** is the resume checkpoint.
3. Update documentation after verifying reality — do not invent status.

---

## Boot sequence

1. `docs/AGILE_V_PROTOCOL.md`
2. `CLAUDE.md`
3. `.agile-v/STATE.md` (+ `CHECKPOINTS.md` if any `PENDING` gate)
4. Relevant REQ/TASK files for the active work only

---

## Before coding

- Inspect architecture and affected files
- Link work to REQ-IDs
- Record risks/assumptions
- Produce a plan
- **Stop for human approval** unless Gate 1 already approved for that scope

---

## During coding

- Implement only approved scope
- Reuse `src/lib/rag-chat.ts`, `redis.ts`, and existing chat UI
- Avoid duplicate provider/RAG stacks
- Keep SSR boundaries (server page, client chat shell)
- Do not read or commit real `.env` values

---

## Validation

Run relevant scripts; never claim pass without execution. Log to `.agile-v/VALIDATION_SUMMARY.md`.

---

## End of session

Update `.agile-v/STATE.md` with: cycle, gate, completed/remaining work, blockers, **next exact action**, resume token if paused.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
