# Security Policy

## Supported Versions

Security fixes are applied to the latest version on the `main` branch of this repository.

| Version | Supported |
| ------- | --------- |
| latest on `main` | yes |
| older forks / tags | best effort |

---

## Reporting a Vulnerability

**Please do not open public GitHub issues for security vulnerabilities.**

If you discover a security issue in this project, report it privately:

- **Email:** [contact@arnobmahmud.com](mailto:contact@arnobmahmud.com)
- **Subject line:** `[SECURITY] website-url-rag-chatbot — brief description`

Include as much detail as possible:

- Description of the vulnerability and potential impact
- Steps to reproduce
- Affected routes, files, or components (if known)
- Suggested fix (optional)

---

## What to Expect

- **Acknowledgment** within 72 hours (typically sooner)
- **Status update** as the report is triaged and addressed
- **Coordinated disclosure** — we ask that you do not publish details until a fix is available, unless already public

---

## Scope Notes

This project is an open-source demo/educational RAG chatbot. In scope for reports:

- Server-side secret exposure (API keys, tokens in client bundles)
- Authentication/session handling flaws in `src/proxy.ts`
- Injection or abuse vectors in `/api/chat-stream` (rate limits, validation bypass)
- Unsafe redirects, SSRF via URL ingestion, or data leakage between sessions

Out of scope (unless chained with a serious issue):

- Denial of service from expected free-tier rate limits
- Issues in third-party services (Upstash, Gemini, Groq, OpenRouter, Hugging Face, Vercel)
- Social engineering or phishing using the public demo URL

---

## Security Practices in This Repo

- LLM and Upstash credentials are **server-only** — never use `NEXT_PUBLIC_*` for API keys
- Chat API uses Zod validation and Redis-backed rate limiting
- Session cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production
- `.env` is gitignored; use `.env.example` as a template only

Thank you for helping keep this project and its users safe.
