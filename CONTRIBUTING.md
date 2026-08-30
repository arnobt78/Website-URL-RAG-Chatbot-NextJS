# Contributing

Thanks for helping improve this Website URL RAG Chatbot.

## Prerequisites

- **Node.js 24.x** (see `.nvmrc`)
- npm
- Copy `.env.example` → `.env` with your own keys (never commit secrets)

## Local setup

```bash
npm ci
npm run dev
```

## Before you open a PR

Run the same checks CI runs:

```bash
npm run lint
npm run test
npm run build
```

Do **not** require live Firecrawl/Jina keys for default unit tests. Optional live scripts (e.g. `scripts/e2e-hidden-content-matrix.ts`, `npm run test:live-ingest`) stay local-only.

## Pull request expectations

- Keep scope focused; link issues when relevant
- Prefer reusing `src/lib/rag-chat.ts`, `redis.ts`, and existing crawl/chat UI
- No secrets, real `.env` values, or API keys in commits or screenshots
- Update `.env.example` when adding env vars
- Describe what you changed and how you validated it

## Reporting bugs / features

Use the GitHub issue templates under `.github/ISSUE_TEMPLATE/`.

Security issues: see [SECURITY.md](./SECURITY.md) — do not file public issues for vulnerabilities.
