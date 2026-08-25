# Vercel Production Guardrails (Generic, Reusable Playbook)

> **Attach this file to any project conversation.** Agents must detect the stack (Next.js vs Vite vs API-only), apply only matching rules, and leave human browsing fast and unbroken. Normative intent: **OWASP ASVS**, **HTTPS/TLS**, and **ISO/IEC 27001-aligned** information-security / privacy practices (confidentiality, integrity, availability). Do not invent non-existent ISO numbers.

---

## Why This Exists — Real-World Incident

This project (FreeScribe) **exceeded Vercel free tier limits in production** within a single billing cycle due to bot/crawler traffic and unconstrained resource exposure. Observed overages:

| Metric                               | Used     | Free Limit | Notes                                                    |
| ------------------------------------ | -------- | ---------- | -------------------------------------------------------- |
| Fluid Active CPU                     | 7h 16m   | 4h         | **183% over** — bot crawl storm driving SSR/function CPU |
| Fast Origin Transfer                 | 16.32 GB | 10 GB      | **163% over** — bots downloading JS bundles repeatedly   |
| Edge Requests                        | 1.5M     | 1M         | **150% over** — crawlers hitting all routes              |
| Image Optimization - Transformations | 5.9K     | 5K         | **118% over** — bots triggering image transforms         |
| Function Invocations                 | 722K     | 1M         | Approaching limit                                        |
| Fast Data Transfer                   | 30.05 GB | 100 GB     | Under limit but high                                     |

**Root causes identified:**

- No bot protection enabled on Vercel dashboard
- No security/cache headers — bots downloaded unbounded static assets
- `/_next/static/` not set to immutable caching — every crawler re-fetched all bundles
- No `robots.ts` — crawlers had no scope guidance
- AI scrapers (GPTBot, CCBot etc.) were indexing everything with no restrictions

**This is why the guardrails in this file matter.** Apply them before deploying any public project. Goal: **real humans browse normally**; scrapers must not burn Fluid CPU, Edge requests, origin transfer, or image transforms.

---

## 0) Purpose & AI Agent Instructions (entry ritual)

**When this file is attached**, do the following **before** writing code:

1. **Detect stack**
   - **Next.js** if `next.config.ts` / `next.config.js` / `next.config.mjs` exists (or `dependencies.next`).
   - **Vite** if `vite.config.ts` / `vite.config.js` exists (or `dependencies.vite`) and no Next app router.
   - **API-only** if primarily `api/` / server handlers with little or no SPA.
2. **Detect secret leakage risk** — search for `VITE_*`, `NEXT_PUBLIC_*`, client `import.meta.env` / `process.env` used for **private** API keys, DB URLs, signing secrets. Private secrets must **never** use public/client prefixes.
3. **Detect auth** — login/register/session cookies present? If **no**, skip Section 9 (Auth). If **yes**, apply Section 9 fully.
4. **Detect AI/LLM calls** — browser calling OpenAI/Gemini/Groq/etc. directly? If **yes**, apply Section 7 (server-side proxy) immediately.
5. **Apply only matching presets** — skip ISR/`next/image` rules on pure Vite CSR; skip `/_next/static` on Vite; skip Vite `/assets` rules on Next.
6. **Never break functionality** — no artificial delays, no hydration breaks, no unrelated refactors, no deleting working features.
7. **No new summary `.md` files** unless explicitly asked; update this playbook or existing project memory only.
8. **Minimal footprint** — only add what the checklist requires for this stack.

---

## 1) Safe Defaults To Enable On Day 1

### 1.1 Firewall / Bot (Vercel Dashboard — Human-Action)

These managed rulesets are **dashboard-only** (not fully expressible in `vercel.json`):

| Setting | Value | Effect on normal users |
|---------|-------|------------------------|
| Bot Protection | **Challenge** | Real browsers continue; automated scrapers get challenged |
| AI Bots | **Deny** | AI crawlers blocked |
| Attack Mode | **OFF** (default) | Use only during active attacks |

Normal users can browse and use the app as much as they need. Do **not** add client-side delays or CAPTCHA loops in app code for Day 1.

### 1.2 Security headers (both stacks)

```ts
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=()" },
];
```

- **[Next]** Prefer `headers()` in `next.config.ts` **and** mirror in `vercel.json`.
- **[Vite]** Put the same headers in `vercel.json` (no `next.config`).

### 1.3 Immutable hashed static assets

| Stack | Path pattern | Cache-Control |
|-------|--------------|---------------|
| **[Next]** | `/_next/static/(.*)` | `public, max-age=31536000, immutable` |
| **[Vite]** | `/assets/(.*)` | `public, max-age=31536000, immutable` |

Never use `/_next/static` on Vite projects. Never skip immutable caching on content-hashed bundles — bots otherwise re-download JS forever (see incident table).

### 1.4 Robots / crawl scope

- **Single source of truth**: Next App Router `src/app/robots.ts` **OR** `public/robots.txt` — **never both**.
- **[Vite]** use `public/robots.txt` only.
- Allow user-facing pages (`Allow: /`).
- Disallow `/api/` (and `/_next/` on Next).
- Disallow high-cardinality dynamic routes with no SEO value.
- Optionally disallow known AI scrapers by `User-agent`.

**[Next] minimal `robots.ts`:**

```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/_next/", "/api/"],
      },
    ],
  };
}
```

**[Vite] minimal `public/robots.txt`:**

```txt
User-agent: *
Allow: /
Disallow: /api/
```

### 1.5 Node.js 24.x (both stacks)

Vercel retires Node 20 for new builds after Oct 1 (EOL). **Always pin:**

```json
{
  "engines": {
    "node": "24.x"
  }
}
```

Also add `.nvmrc` with `24`. Confirm Vercel Project Settings → Node.js Version is 24 (or rely on `engines`; package.json overrides dashboard when set).

### 1.6 Next-only Day-1 extras

- `data-scroll-behavior="smooth"` on `<html>` in `src/app/layout.tsx` when using App Router.
- Prefer ISR (`revalidate`) for server-rendered pages; avoid unnecessary `force-dynamic`.
- Review `next/image` usage (sizes, priority, transforms) — bots can burn Image Optimization quota.

---

## 2) Stack Matrix — What To Apply Where

| Concern | Next.js | Vite CSR + Vercel Functions |
|---------|---------|------------------------------|
| Headers | `next.config` + `vercel.json` | `vercel.json` |
| Static cache | `/_next/static/(.*)` | `/assets/(.*)` |
| Robots | `robots.ts` **or** `robots.txt` | `public/robots.txt` only |
| SSR / ISR | Apply Section 3 caching | N/A — skip |
| `next/image` | Review transforms | N/A — skip |
| Serverless API | `app/api` or `pages/api` | top-level `api/*.ts` |
| Local API | `next dev` | **`vercel dev`** (plain `vite` does not serve `/api/*`) |
| Node engines | `24.x` | `24.x` |

### Presets by project type

**Static / CSR-only (Vite or static export)**  
Bot Challenge + AI Bots Deny; security headers; robots; immutable assets; no ISR.

**SSR / API-heavy (Next)**  
Above + ISR/revalidate; disallow high-cardinality routes; payload caps; rate-limit expensive APIs.

**API-only**  
Bot Challenge + AI Bots Deny; rate-limit writes; authenticate expensive ops; cache hot reads when safe.

---

## 3) Architecture Rules That Prevent Spikes

- On expensive routes, fetch only above-the-fold data; cap list sizes; avoid N+1 and duplicate API calls.
- Minimize API response fields; paginate.
- High-cardinality dynamic routes: `noindex` + robots disallow unless SEO is proven.
- Filter bots at **firewall/edge first** — never with client scripts that delay first paint.
- Keep the critical rendering path unchanged for real browsers.

---

## 4) Monitoring Routine (Free-Tier Friendly)

After every deployment:

- **T+15 min**: Observability → Edge Requests → Bot Name + Routes
- **T+1 hour**: Usage → Edge Requests, Fast Origin Transfer, Fluid Active CPU
- **Next morning**: Compare **slope/trend**, not only cumulative totals

Watch for: `/_next/image` storms, one dominating bot, 4xx + firewall denies, repeated bursts on one path family.

---

## 5) Incident Playbook (When Metrics Spike)

1. Confirm top source in Observability (`Bot Name`, `Routes`).
2. Bot-driven → Bot Protection = **Challenge**, AI Bots = **Deny**, Attack Mode OFF unless uncontrollable.
3. Image/media dominate → reduce transforms; verify media patterns.
4. CPU/Origin still high → trim payloads; tighten crawl surface; rate-limit expensive APIs.
5. Re-check at 15 / 60 / 180 minutes.

---

## 6) Non-Negotiables

- Never ship conflicting robots policies.
- Never leave ID-based dynamic routes fully crawlable by default.
- Never launch a public project without Bot Protection = Challenge.
- Never put private API keys, DB URLs, or signing secrets in `VITE_*` / `NEXT_PUBLIC_*` / client bundles.
- Never add artificial sleep/delays as “security.”
- Monitor slope; stage security controls; watch false positives.
- Prefer Fluid Compute / Node serverless for AI proxies; do not default to Edge runtime for Prisma/heavy Node APIs.

---

## 7) Secrets & Server-Side Chat / LLM Proxy (Showcase Pattern)

### Problem

Browser-held keys (`VITE_OPENAI_API_KEY`, etc.) are extractable from the JS bundle and Network tab → quota theft, billing abuse, data leakage.

### Required pattern (any stack with LLM features)

```text
UI  →  POST /api/chat  →  server env keys  →  providers (fallback chain)
UI  →  GET /api/chat-providers  →  { name, displayName, icon, available } only
```

**Rules:**

1. Store keys as **non-public** env: `GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `HUGGINGFACE_API_KEY`, `OPENAI_API_KEY` (never `VITE_` / `NEXT_PUBLIC_`).
2. Move provider HTTP callers to **server-only** modules (e.g. `shared/ai/` imported by `api/chat.ts` or Next route handlers).
3. Validate request body with **Zod** (message required, length caps, optional provider enum).
4. Soft **per-IP rate limit** on chat/write endpoints (return `429` — no sleep).
5. Return `{ content, provider, success, error? }` — never stack traces or key material.
6. Client becomes a thin `fetch("/api/chat")` wrapper.
7. Availability endpoint returns **booleans only** — never keys.
8. Keep auto-fallback order documented and identical when migrating from client-side calls.

**Reference shape (this repo):** `api/chat.ts`, `api/chat-providers.ts`, `shared/ai/*`, thin `src/services/aiService.ts`.

**Local note:** Vite alone cannot serve `/api/*` — use `vercel dev` or a Vercel preview.

---

## 8) Node 24 + Dependency Upgrade Playbook (0 vulnerabilities)

Run on every attach when Node &lt; 24 or audit is dirty:

1. Set `"engines": { "node": "24.x" }` + `.nvmrc` → `24`; `nvm install 24 && nvm use`.
2. Upgrade dependencies to **latest stable within compatible majors**. Do **not** blindly jump majors that break peers (examples often held: React 18 vs 19, Prisma 6 vs 7, Vite 7 vs 8, Recharts 2 vs 3, ESLint 9 vs 10) unless the project is ready for the migration guide.
3. Clean install: remove `node_modules` + lockfile → `npm install`.
4. `npm audit` / `npm audit --omit=dev` → drive to **0**. Prefer **scoped `overrides`** for transitive fixes; avoid `audit fix --force` major downgrades that break tools (e.g. global `ajv`/`minimatch` breaking ESLint).
5. Gate: `npm run lint` && `npm run build` (and typecheck if separate). Fix only upgrade-induced issues.
6. Re-run lint + build + audit until all pass.
7. Record results in project validation memory if the repo uses Agile V / similar.

---

## 9) Auth, Sessions & Cookies (conditional — skip if anonymous-only)

Apply when the project has login/registration. Align with OWASP ASVS + ISO 27001-oriented access control.

### Passwords (registration / login)

- Use a **memory-hard KDF with salt**: **Argon2id** (preferred) or **bcrypt** / **scrypt**.
- **Do not** store `SHA-256(password)` (or any raw SHA) as a “password hash.” SHA is for integrity / tokens — **not** password storage.
- HMAC-SHA256 is fine for **signed tokens** / CSRF tokens — not a substitute for password KDFs.
- Rate-limit login/register; lockout or backoff on brute force; generic error messages.

### Session cookies

| Attribute | Requirement |
|-----------|-------------|
| `HttpOnly` | Yes — no JS access |
| `Secure` | Yes — HTTPS only |
| `SameSite` | `Lax` or `Strict` as UX allows |
| Path / Domain | Least privilege |
| TTL | Short absolute + idle timeout |

**Clear / invalidate cookies when:**

- User logs out
- Account is deleted
- Password is reset / credentials rotated
- Session absolute or idle expiry hits
- Privilege change (e.g. role upgrade) — rotate session id

Server must invalidate server-side session store (DB/Redis) **and** clear the cookie (`Max-Age=0` / `Expires` in the past). Deleting a cookie only in the browser is not enough if the server still accepts the session id.

### CSRF & authorization

- Cookie sessions need CSRF protection on state-changing routes.
- Every mutation checks **authn + authz** (ownership/role) server-side.
- Never trust client-only “isAdmin” flags.

### Skip this section

Anonymous demos (e.g. public AI chat with localStorage history and no login) — do not invent auth unless product requires it.

---

## 10) Transport, Privacy & “Secured Transactions”

Industrial-standard secure processing (no middleman reading plaintext on the wire):

1. **TLS everywhere** (HTTPS). Prefer HSTS on production domains once HTTPS is stable.
2. **No client-side “SHA encryption” theater** for API payloads — TLS already protects transit. End-to-end crypto is a separate product decision (not a substitute for server secrets).
3. Validate all inputs (Zod/schema); reject oversize bodies.
4. Minimize data returned; never leak secrets, stack traces, or internal IDs in public errors.
5. **Never log** API keys, cookies, password hashes, raw tokens, or unnecessary PII.
6. Mutations: authorize, persist, then invalidate/revalidate caches so UIs show fresh data without relying on stale client secrets.
7. Idempotency keys for payment-like operations when applicable.

---

## 11) Logging Hygiene (dev and prod)

- Remove committed `console.log` / debug dumps from application source (both development paths that ship and production builds).
- Prefer structured server logging without secrets.
- Delete temporary debug log files from the repo.
- ESLint `no-console` (error or warn) is recommended for app code; allow-list server logger wrappers if needed.

---

## 12) Master Checklist (PR / Launch)

Tag legend: `[Firewall]` `[Next]` `[Vite]` `[AI-proxy]` `[Deps]` `[Auth]` `[Logs]` `[Both]`

- [ ] `[Firewall]` Bot Protection = **Challenge**
- [ ] `[Firewall]` AI Bots = **Deny**
- [ ] `[Firewall]` Attack Mode OFF unless under active attack
- [ ] `[Both]` `engines.node` = `24.x` + `.nvmrc` = `24`
- [ ] `[Both]` Security headers present
- [ ] `[Next]` Headers in `next.config` + mirrored `vercel.json`
- [ ] `[Vite]` Headers in `vercel.json`
- [ ] `[Next]` `/_next/static` immutable cache
- [ ] `[Vite]` `/assets` immutable cache
- [ ] `[Both]` Single robots source; `/api/` disallowed
- [ ] `[Next]` `data-scroll-behavior` on `<html>` if App Router
- [ ] `[Next]` ISR/revalidate reviewed where SSR
- [ ] `[Next]` `next/image` sizes/priority/transforms reviewed
- [ ] `[AI-proxy]` No private keys in `VITE_*` / `NEXT_PUBLIC_*`
- [ ] `[AI-proxy]` LLM calls only via server `/api/chat` (or equivalent)
- [ ] `[AI-proxy]` Zod + rate limit on chat / expensive writes
- [ ] `[Deps]` `npm audit` = 0; lint + build pass on Node 24
- [ ] `[Auth]` Skip if anonymous; else HttpOnly Secure cookies + KDF passwords + clear on logout/delete/expiry
- [ ] `[Logs]` No debug `console.log` left in shipped app code
- [ ] `[Both]` Expensive routes fetch only required data; payloads minimized
- [ ] `[Both]` T+15m and T+1h observability checks after deploy
- [ ] `[Next]` Build hygiene: `NEXT_TELEMETRY_DISABLED=1`; Sentry `silent` + `telemetry: false` if used

---

## 13) Deploy Build Log Hygiene (Vercel / CI)

Firewall and security headers are **runtime** guardrails. This section is **build-time** noise control.

### [Next] build script

```json
{
  "scripts": {
    "build": "NEXT_TELEMETRY_DISABLED=1 next build"
  }
}
```

### [Next] Sentry webpack plugin

```typescript
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  tunnelRoute: "/api/monitoring",
  silent: true,
  telemetry: false,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
```

| Setting | Safe? | Effect |
|---------|-------|--------|
| `silent: true` | Yes | Hides per-file upload spam; upload still runs with token |
| `telemetry: false` | Yes | Disables plugin telemetry message |
| `deleteSourcemapsAfterUpload: true` | Yes | Maps go to Sentry, not public artifacts |

**Avoid** `silent: !process.env.CI` on Vercel — `CI=1` makes builds noisier.

Optional companion: `docs/Redis_Sentry_PostHog_INTEGRATION_GUIDE.md` (adapt for Vite if not Next).

### npm install noise (npm 11+)

Optional `allowScripts` whitelist, `.npmrc` with `fund=false`, quiet Browserslist updates — only if needed.

### Expected warnings (keep)

| Warning | Action |
|---------|--------|
| Custom Cache-Control on `/_next/static` or `/assets` | **Keep** — intentional |
| Edge runtime deprecation notices | Informational; prefer Node/Fluid for Prisma/LLM |

---

## 14) This Repo Appendix — `multi-ai-chatbot` (Vite CSR)

| Item | Status |
|------|--------|
| Stack | React 18 + Vite 7 CSR + Vercel `api/*` + Prisma 6 |
| Node | `engines.node` = `24.x`, `.nvmrc` = `24` |
| AI proxy | `POST /api/chat`, `GET /api/chat-providers`, `shared/ai/*` — **no browser AI keys** |
| Analytics | Zod + soft IP rate limits + Prisma singleton; Insights remain public for demo |
| Guardrails code | `vercel.json` security + `/assets` immutable; `public/robots.txt` |
| Auth | **None** (anonymous demo) — Section 9 skipped |
| Human-Action remaining | Vercel Firewall Bot Protection = Challenge, AI Bots = Deny; set server env keys (`GEMINI_API_KEY`, etc.); remove any old `VITE_*` AI keys from Vercel |

Local chat/analytics: use **`vercel dev`** (or deploy). Plain `vite` does not serve `/api/*`.
