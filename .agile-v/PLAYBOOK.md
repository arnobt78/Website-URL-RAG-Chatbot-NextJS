# PLAYBOOK.md — How to work this repo under Agile V

1. Read `docs/AGILE_V_PROTOCOL.md`, then `CLAUDE.md`, then `.agile-v/STATE.md`.
2. Code is source of truth; update docs when drift is found.
3. Never read or commit `.env` secrets; use `.env.example` placeholders only.
4. Prefer extending `src/lib/rag-chat.ts`, `redis.ts`, and existing chat components over parallel stacks.
5. Server-first: keep `[...url]/page.tsx` as Server Component; keep interactivity in `ChatWrapper` / inputs.
6. After each approved change: validate, append DECISION_LOG / VALIDATION_SUMMARY, update STATE resume point.
7. Reference playbooks:
   - Production hardening: `docs/VERCEL_PRODUCTION_GUARDRAILS.md` (apply Next.js subset only)
   - Provider strategy: `docs/LLM_MODEL_SELECTION.md` (adapt; do not assume Express paths exist)
