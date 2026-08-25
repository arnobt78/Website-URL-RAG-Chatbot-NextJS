# VALIDATION_SUMMARY.md

| ID | Check | Command | Result | When | Notes |
|----|-------|---------|--------|------|-------|
| VAL-0001 | lint | `npm run lint` (`eslint .`) | **PASS** | 2026-08-25 | Next 16 flat eslint-config-next |
| VAL-0002 | build | `npm run build` | **PASS** | 2026-08-25 | Next 16.3.3 Turbopack; Node 24 |
| VAL-0003 | audit | `npm audit` | **PASS (0)** | 2026-08-25 | overrides + Next 16.3.3 |
| VAL-0004 | audit prod | `npm audit --omit=dev` | **PASS (0)** | 2026-08-25 | |
| VAL-0005 | node | `node -v` | v24.19.0 | 2026-08-25 | engines 24.x |
| VAL-0006 | lint | `npm run lint` | **PASS** | 2026-08-25 | post chat-fix + multi-provider fallback |
| VAL-0007 | build | `npm run build` | **PASS** | 2026-08-25 | proxy.ts only (Next 16); no middleware.ts |
| VAL-0008 | localhost E2E | `curl -N POST http://localhost:3000/api/chat-stream` | **PASS** | 2026-08-25 | HTTP 200; `text/plain` body streamed (`Hi`); `X-LLM-Provider: Google Gemini`; `X-LLM-Model: gemini-2.5-flash`; `.env` keys loaded locally (not read/committed) |
| VAL-0009 | unit tests | `npm run test` (`vitest run`) | **PASS** | 2026-08-25 | 7 tests: errors, chat-input-utils, fallback not_configured |
| VAL-0010 | unit tests | `npm run test` | **PASS** | 2026-08-26 | 16 tests (+ url-security, url-to-chat-path, fallback-rag-chat) |
| VAL-0011 | lint | `npm run lint` | **PASS** | 2026-08-26 | post SEO/branding + opengraph-image |
| VAL-0012 | build | `npm run build` | **PASS** | 2026-08-26 | `/opengraph-image` route; package `website-url-rag-chatbot` |
| VAL-0013 | security | `/review-security` | **PASS WITH WARNINGS** | 2026-08-26 | DNS TOCTOU + CSP unsafe-inline accepted for demo scope |

`eval_gate_status`: **NOT_STARTED** (production smoke pending deploy + Human-Action firewall).

Expected build warnings (keep):
- Custom Cache-Control on `/_next/static` (intentional)
- proxy convention (Next 16 `src/proxy.ts`; no `middleware.ts`)
