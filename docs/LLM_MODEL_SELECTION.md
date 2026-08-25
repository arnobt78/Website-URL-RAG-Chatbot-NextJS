# Free-Tier AI & Dev-Infra Provider Reference + Multi-Provider Fallback Strategy

> **Last verified: 2026-08-25** (web-search-verified against provider docs and independent trackers on this date). Free tiers change frequently — providers add credit-card requirements, cut rate limits, or deprecate models with little notice. Treat every row below as "true as of last verification," not a permanent guarantee. Re-check a provider's own pricing/docs page before depending on it in production.
>
> This file is written to be **portable**: drop it into any project (any language, any framework) as a reference for (1) which AI/dev-infra providers currently offer a real free tier with no credit card required, and (2) how to build a multi-provider automatic-fallback chain so your app never depends on a single model or vendor.

---

## Purpose

Any system that calls an LLM (or other AI service) should **never depend on a single provider or model**. Free tiers get rate-limited, models get deprecated, providers have outages, and pricing changes without warning. If one model becomes unavailable, deprecated, rate-limited, overloaded, or fails unexpectedly, the system should silently move to the next suitable provider/model without interrupting the user.

### Goals

- Zero manual switching — the app decides, not the user.
- Automatic fallback across providers and, within a provider, across models.
- Fastest available model for the task, without sacrificing output quality.
- Minimal latency, minimal cost (free tiers first, paid only as last resort).
- Graceful degradation over hard failure.
- Future-proof against provider deprecations — swap a row in a table, not application logic.

---

## Table of contents

1. [LLM / chat providers (primary table)](#1-llm--chat-providers-primary-table)
2. [Groq deprecation watch](#groq-deprecation-watch-verified-2026-08-01-primary-source)
3. [Preferred coding-model priority (generic)](#preferred-coding-model-priority-generic)
4. [Embeddings & RAG](#2-embeddings--rag)
5. [Speech APIs (TTS / STT)](#3-speech-apis-tts--stt)
6. [Image generation](#4-image-generation)
7. [AI infrastructure (gateways, observability)](#5-ai-infrastructure-gateways-observability)
8. [Vector databases](#6-vector-databases)
9. [Free databases](#7-free-databases-bonus)
10. [Hosting](#8-hosting-bonus)
11. [Automation](#9-automation)
12. [Authentication](#10-authentication-bonus)
13. [Generic automatic fallback chain architecture](#generic-automatic-fallback-chain-architecture)
14. [Reference implementation in this repo](#reference-implementation-in-this-repo)
15. [How to adapt this to a new project](#how-to-adapt-this-to-a-new-project-checklist)
16. [Hardware-aware local model suggestions](#hardware-aware-local-model-suggestions)
17. [Coding behaviour & general principles](#coding-behaviour--general-principles)

Rows marked **🔑 have key** indicate this project (CodeBook) already has a working API key on file in `docs/personal-dev-info.txt` — useful if you're cloning this doc into a sibling project that shares that key file.

---

## 1. LLM / chat providers (primary table)

All providers below expose (or can be driven through) an **OpenAI-compatible `/chat/completions` endpoint**, which is what makes a single generic client viable (see [Generic automatic fallback chain architecture](#generic-automatic-fallback-chain-architecture)).

| Provider | Free, no card? | Current free-tier models (verified 2026-08-01) | Notes |
|---|---|---|---|
| **Google AI Studio (Gemini)** 🔑 | **Yes** — genuinely indefinite, no card, no expiration | `gemini-2.5-flash`, `gemini-2.5-flash-lite`, `gemini-2.0-flash` (Pro models tightened on free tier April 2026 — Flash-only for no-card keys) | OpenAI-compatible endpoint confirmed working: `https://generativelanguage.googleapis.com/v1beta/openai/`. Rate limits are project-specific — check `aistudio.google.com/rate-limit`. Free-tier prompts may be used to improve Google's products (paid tier / Vertex AI opts out of this). |
| **GroqCloud** 🔑 | **Yes** — no card | `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.6-27b` | Extremely fast inference (LPU hardware). See [deprecation watch](#groq-deprecation-watch-verified-2026-08-01-primary-source) below — several model IDs shut down in 2026, including one still referenced in this repo's own provider registry. ~14,400 req/day, 30 RPM typical on free tier (varies per model). |
| **OpenRouter** 🔑 | **Yes** — no card for `:free` models | Curated `:free` IDs (Aug 2026): `openai/gpt-oss-20b:free`, `nvidia/nemotron-nano-9b-v2:free`, `google/gemma-3-27b-it:free`. **Avoid** hardcoding delisted IDs like `meta-llama/llama-3.3-70b-instruct:free` — OpenRouter free catalog churns weekly. | Single API routes to many upstream providers. Free tier: 20 req/min, 50 req/day (raised to 1,000/day if you ever add $10 of credit — still optional). Re-check `https://openrouter.ai/models?max_price=0` before depending on a specific ID. |
| **GitHub Models** 🔑 (read-only key on file) | **Yes** — no card, tied to a GitHub account | 45+ models incl. OpenAI GPT-4.1/o-series, Meta Llama 4, Mistral, DeepSeek, Cohere | Rate limits scale with your GitHub Copilot tier (Free/Pro/Pro+/Business) — roughly 10–15 RPM / 50–150 RPD on a free GitHub account. 8K input / 4K output token caps — prototyping tool, not production-scale. |
| **Cloudflare Workers AI** 🔑 (key on file, **not wired in this repo** — needs an account ID not present in `docs/personal-dev-info.txt`; see REQ-1613 in `.agile-v/DECISION_LOG.md`) | **Yes** — no card, starts immediately on any free Cloudflare account | 50+ models incl. Llama, Mistral, Gemma, DeepSeek, Qwen, Whisper (speech), SDXL (image) | 10,000 free "Neurons" (Cloudflare's normalized compute unit) per day, resets daily at 00:00 UTC — an ongoing daily allowance, not a one-time credit. Requires both an API token *and* your Cloudflare account ID in the request URL. |
| **Cerebras Cloud** 🔑 | **Yes** — no card, no waitlist | `gpt-oss-120b`, `llama3.3-70b`, `qwen-3-32b`/`qwen-3-235b` family (verify current names — Cerebras mirrors much of the Groq-style OSS lineup) | One of the most generous free tiers found: ~1,000,000 tokens/day, 14,400 req/day, 30 RPM, 60K TPM. Context window capped at 8K on free tier. Extremely fast (wafer-scale hardware). |
| **NVIDIA NIM** (build.nvidia.com) 🔑 | **Yes** — no card, just an email | 100+ hosted models incl. Llama, Qwen, Mistral, DeepSeek, NVIDIA's own Nemotron | OpenAI-compatible endpoint. ~40 RPM; exact quota varies per model and current platform load ("trial" credits, not a hard token cap). Good breadth of models for a single free signup. |
| **Hugging Face (Inference Providers / router)** 🔑 | **Yes** — no card for the free tier | Access to 15+ upstream providers (Groq, Together, Fireworks, Cerebras, Nebius, SambaNova, Novita, Featherless, and more) through one router endpoint `https://router.huggingface.co/v1` | Free tier ≈ 100K monthly "Inference Provider credits" (very small in dollar terms — reports put actual free spend around $0.10/month equivalent). Useful as a long list of fallback models rather than a primary provider — many individual models return 404/410 as hosts rotate, so iterate a model list and expect some misses. |
| **Mistral AI (La Plateforme)** 🔑 | **Yes** — no card, "Experiment" tier | `mistral-small-latest`, `open-mistral-nemo`, Codestral, Pixtral (multimodal) | Explicitly built for evaluation, not production — 1 req/sec-class limits (~2 RPM reported), ~1B tokens/month cap. Fine as a fallback rung, not a primary high-volume provider. |
| **Cohere** 🔑 | **Yes** — no card, trial key issued instantly | `command-r7b-12-2024`, `command-r-08-2024`, Command A, Aya Expanse, Embed v4 | ~1,000 API calls/month, 20 RPM chat / 5 RPM embed. Explicitly for testing/prototyping, not commercial production traffic. |
| **Zhipu AI (BigModel / GLM)** | **Yes** in most regions — reports vary; some flows require phone verification, not necessarily a card | GLM-4.5-Flash / GLM-4.7-Flash class, up to a 20M-token starter grant on signup | Chinese-market originated; docs and dashboard are partly Chinese-language. Confirm current signup flow before relying on it — one source in our search reported a card + phone-verification requirement, contradicting others. **(unverified — check provider docs before relying on this)**. |

### Secondary / limited free tiers (signup-credit model, not an evergreen free tier)

These are useful extra fallback rungs but are **not** a permanent no-cost tier — they hand out a one-time credit on signup and then require a card or stop working:

| Provider | Free, no card? | Notes |
|---|---|---|
| **DeepInfra** | Limited — ~$1 signup credit, no card | 50+ open models at low per-token pricing after credit runs out. Some sources report no ongoing free tier at all — confirm before relying on it. |
| **Fireworks AI** | Limited — $1 signup credit, no card | Card required to lift the default 10 req/min cap. Good for a one-time evaluation, not a standing free fallback. |
| **Together AI** | Limited — signup trial credit, no card | Fast open-model inference; exact current credit amount changes often. |
| **Novita AI** | Limited — small one-time voucher (~$0.50), no card | Unusual among this group: also publishes a handful of genuinely `$0`/token open-source models that remain free after the voucher is spent — worth checking their current model list. |

---

### Groq deprecation watch (verified 2026-08-01, primary source)

Fetched directly from `https://console.groq.com/docs/deprecations` on the verification date above:

| Deprecated model | Shutdown date | Recommended replacement |
|---|---|---|
| `llama-3.1-8b-instant` | 2026-08-16 | `openai/gpt-oss-20b` |
| `llama-3.3-70b-versatile` | 2026-08-16 | `openai/gpt-oss-120b` or `qwen/qwen3.6-27b` |
| `qwen/qwen3-32b` | **2026-07-17 (already past)** | `openai/gpt-oss-120b` |
| `meta-llama/llama-4-scout-17b-16e-instruct` | 2026-07-17 (already past) | `openai/gpt-oss-120b` or `qwen/qwen3.6-27b` |
| `moonshotai/kimi-k2-instruct-0905` | 2026-04-15 (already past) | `openai/gpt-oss-120b` |
| `meta-llama/llama-4-maverick-17b-128e-instruct` | 2026-03-09 (already past) | `openai/gpt-oss-120b` |
| `meta-llama/llama-guard-4-12b` | 2026-03-05 (already past) | `openai/gpt-oss-safeguard-20b` |

**Important finding (Aug 2026):** Upstash `upstash()` hosted models are discontinued. This project's live registry is `src/lib/ai/providers.ts` (Groq chain uses `qwen/qwen3.6-27b`, not deprecated `qwen/qwen3-32b`).

Never hardcode a Groq model without checking `console.groq.com/docs/deprecations` (or `GET https://api.groq.com/openai/v1/models`) periodically — Groq deprecates models more aggressively than most providers on this list.

### Preferred coding-model priority (generic)

For agentic coding workflows specifically (not just chat), in order of preference across the free-tier models above:

1. **`openai/gpt-oss-120b`** (Groq / Cerebras / NVIDIA NIM / OpenRouter `:free`) — difficult debugging, architecture, large repositories, refactoring, planning, agent workflows, complex reasoning.
2. **`qwen/qwen3.6-27b`** (Groq) — everyday coding: repository edits, frontend, backend, TypeScript, React, Next.js, Node, Python. Treat as the default fast coding model.
3. **`openai/gpt-oss-20b`** (Groq / OpenRouter `:free`) — simple coding, autocomplete, quick fixes, documentation, tool calling, JSON generation. Replaces the deprecated `llama-3.1-8b-instant`.

Provider preference order for coding tasks specifically (fastest/most reliable free tiers first): **Groq → OpenRouter → Cerebras → NVIDIA NIM → local (Ollama/LM Studio)**. Choose whichever provider currently offers the highest-ranked model from the list above and is configured (has a key).

---

## 2. Embeddings & RAG

| Provider | Free, no card? | Notes |
|---|---|---|
| **Voyage AI** | Yes, reported no-card signup | 200M free tokens on the `voyage-4` generation (~400K documents) — one of the largest embedding free tiers found. |
| **Jina AI** 🔑 | Yes | Embeddings v4: ~1M tokens/month free via API; also has a non-commercial free license track. Includes reranking endpoints. |
| **Cohere** 🔑 | Yes (same trial key as chat) | `embed-v4` included in the ~1,000 calls/month trial tier, 5 RPM on the embed endpoint specifically. |
| **Hugging Face Inference** 🔑 | Yes | Sentence-transformer and other embedding models available through the same router/credit pool as chat — good for a self-hosted-adjacent fallback, not a primary high-throughput source. |
| Also viable | — | Google's Gemini embedding endpoint (~1,500 req/day, no card) is a solid no-card fallback if you already hold a Gemini key. |

## 3. Speech APIs (TTS / STT)

| Provider | Free, no card? | Notes |
|---|---|---|
| **Deepgram** | Yes — $200 signup credit, no card | Most generous evaluation budget of this group; pay-as-you-go afterward at ~$0.03/1,000 characters equivalent. STT-focused (also offers TTS). |
| **ElevenLabs** 🔑 | Yes | ~10,000 credits/month free ≈ 10 min Multilingual TTS or ~20 min "Flash" model. Good voice quality, tightest free quota on this list. |
| **Cartesia** | Partial — free tier exists but effectively gated by a $5 minimum to unlock full evaluation in some flows | 10,000 credits on the nominal free tier; check current signup flow before assuming zero friction. **(unverified — confirm current no-card status before relying on this)**. |
| **AssemblyAI** | Not independently confirmed in this pass | Commonly cited elsewhere as offering a no-card free async-transcription tier; verify directly on assemblyai.com before relying on the claim. **(unverified — check provider docs)**. |
| Also on file | — | `REPLICATE_API_KEY` 🔑 also hosts speech models (XTTS, Bark) — see Image generation table below for Replicate's general free-tier caveats, which apply here too. |

## 4. Image generation

| Provider | Free, no card? | Notes |
|---|---|---|
| **Hugging Face Spaces** 🔑 | Yes | Community Spaces running Stable Diffusion/Flux on "ZeroGPU" (dynamic H200 access, ~3.5 min/day quota on the free HF account) — genuinely free but low-throughput and queue times vary. |
| **Fal AI** 🔑 | Limited — one-time signup credit, no card to start | No standing free tier for ongoing use after the trial credit is spent; converts to pay-per-output (~$0.02+/image) afterward. Good OpenAI-compatible-style API. |
| **Replicate** 🔑 | Limited — no permanent free tier | New accounts can run a capped number of free models from a "Try for Free" collection; no disclosed ongoing free quota. Referral credits ($10) exist but are promotional, not a standing tier. |
| **Stability AI** | Limited — starting credit balance, terms vary | Similar shape to Fal/Replicate: evaluate with a signup credit, pay afterward. **(unverified — confirm current credit amount before relying on this)**. |
| Also viable, no card | — | Gemini 2.5 Flash Image via Google AI Studio (~500 req/day reported) rides on the same no-card Gemini key already in this project's key file — often the easiest no-card image option if you already integrated Gemini for chat. |

## 5. AI infrastructure (gateways, observability)

| Provider | Free, no card? | Notes |
|---|---|---|
| **Cloudflare AI Gateway** | Yes | Core routing/caching/rate-limiting/logging features are free on any Cloudflare account; free tier caps at 100,000 logged AI Gateway requests/month. No per-call gateway fee — you still pay the underlying model provider for actual inference. |
| **Cloudflare Vectorize** | Yes (prototyping tier) | Free to prototype/experiment on the Workers Free plan; billed per read/write/storage beyond that. See [vector databases](#6-vector-databases) below. |
| **Vercel AI SDK** 🔑 | Yes — it's an open-source SDK, not a paid service | No "free tier" concept applies — it's a client library (`ai` package) that talks to whatever provider you configure (including every free-tier provider in this doc via its OpenAI-compatible provider). The `VERCEL_AI_SDK_API_KEY` on file is for Vercel's AI Gateway product specifically, if used. |
| **LangSmith** 🔑 | Yes | Free "Developer" plan: tracing, evals, Prompt Hub, annotation queues, ~5,000 traces/month before paid tiers kick in ($2.50/1K traces on Plus). |
| **Langfuse** 🔑 | Yes | Fully open-source (MIT) — self-host for zero cost, or use Langfuse Cloud's free tier (~50,000 observability "units"/month). Project already has secret + public + base URL keys on file. |
| **Helicone** | Not yet provisioned (per key file: "tell me to generate one for this project") | Free tier reported at ~10,000 requests/month; paid plans start around $79/month beyond that. |

## 6. Vector databases

| Provider | Free, no card? | Notes |
|---|---|---|
| **Pinecone** 🔑 | Yes — permanent free tier | ~2GB storage free "forever" on the serverless tier; production-scale needs the $50/month Standard plan. |
| **Qdrant Cloud** 🔑 | Yes — permanent free tier | ~1GB free forever; also fully open-source and self-hostable at zero cost if you have infrastructure. |
| **Weaviate Cloud** 🔑 | Limited — free trial only | Reports indicate payment is required after roughly a two-week trial, unlike Pinecone/Qdrant's standing free tiers. Also open-source/self-hostable for a permanent no-cost option. |
| **Cloudflare Vectorize** | Yes (prototyping tier) | Same Workers Free plan as AI Gateway above — free to prototype, billed beyond that. Needs a Cloudflare account ID, same caveat as Workers AI. |

## 7. Free databases (bonus)

| Provider | Free, no card? | Notes |
|---|---|---|
| **Neon** (Postgres) | Yes — no card required | ~0.5GB storage, ~100 compute hours/month, scales to zero. Reported as the cleanest "real free tier, no card" Postgres option. |
| **Supabase** | Yes — no card for the free project tier | ~500MB Postgres + built-in auth + storage + realtime; free projects pause after 7 days of inactivity (auto-resumes on next request in most cases). |
| **Turso** (libSQL/SQLite edge) | Yes | ~9GB storage across up to 500 databases; strong option for edge-deployed SQLite. |
| **Upstash Redis** 🔑 | Yes | ~500K commands/month, 256MB data, true pay-per-request beyond that — no idle cost. Project already has both a personal and a university-library Upstash instance on file. |
| **MongoDB Atlas** | Yes (Flex tier) | Usage-based free/cheap tier capped around $30/month equivalent before you'd need to upgrade; the older fixed "M0 free forever" tier has been largely superseded by Flex — confirm current tier naming on signup. |

## 8. Hosting (bonus)

| Provider | Free, no card? | Notes |
|---|---|---|
| **Cloudflare Pages** | Yes — most generous for static/Jamstack | Unlimited bandwidth, ~500 builds/month, ~100 sites free. No egress fees. |
| **Render** | Yes — no card required | Free web services (512MB RAM), free static sites, free Postgres, custom domains. Free web services spin down on idle and cold-start on next request. |
| **Vercel** | Yes for hobby/static; usage-based beyond that | Generous free tier for frontend/Jamstack + serverless functions; scales to credit-based billing for heavier full-stack usage. |
| **Netlify** | Yes, but moved to credit-based free tier | ~300 "credits"/month on the free plan as of recent pricing changes — no longer unlimited-build-minutes framing. |
| **Railway** | Limited | Reports now describe a small one-time trial credit (~$5) rather than an ongoing free tier — confirm current terms before depending on it for anything long-running. |

## 9. Automation

| Provider | Free, no card? | Notes |
|---|---|---|
| **n8n** | Yes (self-hosted) / trial (cloud) | Self-hosted Community Edition is free forever, unlimited workflows/executions (you run the infrastructure). n8n Cloud offers a 14-day free trial, no card. Project's own n8n Cloud account is noted as expired in the key file. |
| **Pipedream** | Yes | Free tier: ~300 credits/month, 3 workflows, 3 connected accounts, plus a small AI-token allowance. |
| **Make** | Yes | Free plan: ~1,000 operations/month, 1MB data store, scheduling and error handling included. |
| **Zapier** | Yes, but thin | Free plan: 5 single-step Zaps, 100 tasks/month — the most limited of this group for real automation volume. |

## 10. Authentication (bonus)

| Provider | Free, no card? | Notes |
|---|---|---|
| **Supabase Auth** | Yes — most generous MAU allowance found | ~50,000 MAU free, then ~$0.00325/MAU. Bundled with Supabase's Postgres + storage if you're already using it. |
| **Clerk** 🔑 | Yes | Reports vary by metric definition — roughly 10,000 MAU (billed) free, with a separate "50K monthly retained users" figure also cited; confirm current definition on Clerk's pricing page before budgeting around a specific number. |
| **Better Auth** | Yes — it's self-hosted, open-source, framework-agnostic (not a hosted metered service) | No MAU limit because there's no hosted backend to meter — you own the database and infrastructure. Zero cost beyond whatever you already pay for hosting/DB. |

---

## Generic automatic fallback chain architecture

This pattern is deliberately framework-agnostic — the same shape works in TypeScript/Express, Python/FastAPI, Next.js API routes, a Cloudflare Worker, or a CLI tool. It has three layers:

### Layer 1 — Provider registry (data, not code)

A flat, ordered list of provider configs: `{ id, label, envKey, baseUrl, models[], extraHeaders? }`. Order encodes fallback **priority**. Because most free-tier LLM providers (see the table above) speak the same OpenAI-compatible `/chat/completions` JSON shape, this registry is pure data — no per-provider client code needed.

Priority ordering strategy (a reasonable default, adjust to your own latency/quality/quota needs):

1. Your fastest, most reliable free-tier provider with the best-quality free model (e.g. Groq or Gemini).
2. A broad-coverage aggregator as a second opinion (e.g. OpenRouter's `:free` models).
3. Remaining configured providers, roughly ordered by observed reliability and free-tier generosity.
4. A large-catalog, lower-reliability fallback last (e.g. Hugging Face's router — most model breadth, least consistent uptime per model).

### Layer 2 — One generic client

A single function that takes `(providerConfig, apiKey, model, messages, options)`, POSTs to `${baseUrl}/chat/completions`, and returns a **discriminated result type** rather than throwing:

```
type ChatResult =
  | { ok: true; text: string; provider: string; model: string }
  | { ok: false; kind: "not_configured" | "billing" | "rate_limit" | "upstream"; provider?: string; status?: number; message?: string }
```

Never throwing on a provider failure is what makes silent fallback possible — the caller just checks `ok` and moves on.

### Layer 3 — Retriable-failure classification + orchestration

Two nested loops:

- **Inner loop** (within one provider): try each model in that provider's chain in order; only advance to the next model on a *retriable* failure.
- **Outer loop** (across providers): try each *configured* provider in priority order; skip unconfigured ones (no API key present) without counting them as a failure; only advance to the next provider on a retriable failure from every model in the current provider's chain.

**Retriable failure classification** (advance to next model/provider):

- HTTP 408 (timeout), 429 (rate limited), 500/502/503/504 (server/upstream error)
- Request timeout / network error / connection reset
- Empty or malformed response body
- Model marked unavailable or deprecated by the provider
- Context-length overflow (then optionally retry the *same* provider with a shorter/chunked context before moving on)

**Non-retriable** (stop immediately, surface the error): malformed request on your side (4xx other than 408/429), and — importantly — **402 Payment Required / billing errors should be classified separately** (`kind: "billing"`) so you can alert on "this free tier ran out" distinctly from a transient failure, rather than silently retrying forever against an exhausted quota.

Never stop after the first failure. If every provider fails, return the *last* failure (for logging/alerting) rather than throwing — let the caller decide whether to show a user-facing error, degrade to a canned response, or queue a retry.

### Fast-skip on rate limit

When a provider returns 429, don't waste time trying its remaining models in the same request — a rate limit on one model from a given key usually means the whole provider is throttled for that window. Skip straight to the next *provider*.

---

## Reference implementation in this repo

This **ai-rag-chatbot** project ships a working implementation at `src/lib/ai/`:

- **`types.ts`** — shared result / error types (Layer 2 contract).
- **`providers.ts`** — provider registry (Layer 1): Gemini, Groq, OpenRouter (`:free` IDs), Hugging Face router, optional OpenAI.
- **`errors.ts`** — retriable failure classification + user-facing titles.
- **`fallback-rag-chat.ts`** — orchestration (Layer 3) wired into `@upstash/rag-chat` for URL scrape + Vector RAG unchanged.

### Upstash hosted LLM shutdown (Oct 2025)

Upstash **stopped hosting LLM models** via `upstash()` + QStash (`404 Cannot POST /llm/v1/chat/completions`). See [rag-chat issue #106](https://github.com/upstash/rag-chat/issues/106). Vector + Redis + QStash storage still work; only the generation step requires an external provider key from the table above.

---

## Reference implementation (CodeBook e-commerce — prior project)

The CodeBook e-commerce project also ships this pattern at `backend/src/lib/ai/`:

- **`types.ts`** — the shared `ChatMessage` / `ChatCompletionResult` discriminated-union types (Layer 2's contract).
- **`providers.ts`** — the provider registry (Layer 1): 9 free-tier providers (Gemini, Groq, OpenRouter, Cerebras, NVIDIA NIM, Mistral, Cohere, GitHub Models, Hugging Face), each just a `{ envKey, baseUrl, models[] }` entry.
- **`client.ts`** — the one generic OpenAI-compatible client (Layer 2) plus the retriable-status set and per-provider model-chain loop.
- **`index.ts`** — the outer orchestration loop (Layer 3): walks `AI_PROVIDERS` in order, skips unconfigured providers, returns the first success or the last failure.

It intentionally does **not** wire in Cloudflare Workers AI (needs an account ID not present in the project's key file) or any non-text-chat key (speech/image/embeddings were out of scope for that feature) — see `.agile-v/DECISION_LOG.md` (search "REQ-1613") for the full reasoning trail, and `.agile-v/REQUIREMENTS.md` REQ-1613 for the requirement itself. Treat this directory as a working Express/TypeScript example of the architecture above, not a copy-paste template — the shape (registry + generic client + orchestrator) is what's meant to be reusable, not the specific 9 providers chosen for this project.

---

## How to adapt this to a new project (checklist)

1. **Inventory your free keys.** List every provider you already have a working, no-card API key for. Start there — don't sign up for new providers until the ones you already have are wired in and insufficient.
2. **Check which providers share the OpenAI-compatible `/chat/completions` shape.** Most do (see the primary LLM table above). If so, build **one generic client**, not N provider-specific files — this is the single highest-leverage simplification in this whole pattern.
3. **Order providers by priority**, not just alphabetically: fastest + most reliable + best free-tier quota first, thin/limited-credit providers last.
4. **Classify failures as retriable vs. not** before writing the orchestration loop (see the list above) — this is the part that's easy to get wrong (e.g. accidentally retrying a 401 forever, or not retrying a 429 at all).
5. **Never hardcode a single model ID as the only option.** Every provider entry should be a *chain* of models, tried in order, so a single deprecation (see the Groq watch above) doesn't take down the whole provider.
6. **Return a result type, don't throw** from the low-level request function — this is what makes "silently skip to the next provider" simple instead of a tangle of try/catch.
7. **Re-verify this doc's tables periodically.** Free tiers are the least stable part of any AI stack — set a calendar reminder or re-run the verification searches every few months, especially before a launch.

---

## Hardware-aware local model suggestions

If local inference is available (Ollama, LM Studio, etc.), choose models based on detected VRAM as a final, always-available fallback rung below every cloud provider:

**8 GB VRAM** — Preferred: Qwen 3.6 3B, Gemma 3 4B, Llama 3.2 3B, Phi-4 Mini. Fallback: Qwen 2.5 3B, Gemma 2 2B.

**16 GB VRAM** — Preferred: GPT-OSS-20B (quantized if supported), Qwen3.6-27B Q4, Gemma 3 12B, Mistral Small. Fallback: Qwen2.5-14B, DeepSeek-R1 Distill 14B.

**24 GB VRAM** — Preferred: Qwen3.6-27B Q6/Q8, GPT-OSS-20B, DeepSeek-R1 Distill 32B (quantized). Fallback: Gemma 3 27B, Mistral Large (quantized).

**32 GB VRAM+** — Preferred: GPT-OSS-120B (remote is usually still faster/cheaper than local at this size), Qwen3.6-27B full precision, best available local coding model. Prefer highest-quality model before fastest model at this tier — you have headroom.

---

## Coding behaviour & general principles

Context handling: prefer a repository map, changed files, current file, and direct imports/dependencies over sending an entire repository. Chunk large contexts rather than truncating silently.

When an AI agent edits code: always preserve formatting, comments, types, tests, lint rules, accessibility, and translations. Never rewrite unrelated files. Prefer search/grep/repository-indexing/AST-based edits over blind regex replacement.

Prefer deterministic outputs, structured edits, complete implementations, and compile-ready/production-ready code. Avoid placeholders, TODO comments, fake implementations, and pseudocode in shipped output.

This document intentionally avoids hardcoding a single "best" model or provider. Whenever a better model becomes available, update only the relevant table row or model-chain array — the fallback *architecture* should never need to change alongside it.
