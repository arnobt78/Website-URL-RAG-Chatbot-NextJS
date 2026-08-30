# Self-host Crawl4AI (Phase 5)

Optional whole-site crawl backend using [Crawl4AI](https://github.com/unclecode/crawl4ai) on Docker. **Firecrawl remains the default** (`CRAWL_PROVIDER=firecrawl`). Switch only when you want a self-hosted scraper.

Related: separate agentic pipeline docs live under [`services/agentic-pipeline/README.md`](../services/agentic-pipeline/README.md).

## Prerequisites

- Docker + Docker Compose
- QStash / Upstash Workflow still required for `/api/crawl/workflow` (same as Firecrawl path)
- A strong random `CRAWL4AI_API_TOKEN` (Crawl4AI v0.9+ enables auth by default)

## Local Docker

```bash
cp docker/crawl4ai/.env.example docker/crawl4ai/.env
# edit CRAWL4AI_API_TOKEN
docker compose -f docker/crawl4ai/docker-compose.yml --env-file docker/crawl4ai/.env up -d
```

Health: `http://localhost:11235/health`

Smoke scrape (replace token):

```bash
curl -s -X POST http://localhost:11235/md \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","f":"fit"}'
```

## Next.js env

In `.env.local` (or Vercel):

```bash
CRAWL_PROVIDER=crawl4ai
CRAWL4AI_BASE_URL=http://localhost:11235
CRAWL4AI_API_TOKEN=same-token-as-docker
QSTASH_TOKEN=...
APP_BASE_URL=http://localhost:3000
```

Local tip: if you also run the agentic service on `:8080`, set `QSTASH_DEV_PORT=8082` (or move agents off 8080). QStash Dev defaults to 8080 and will fail with `address already in use` otherwise.

Omit `CRAWL_PROVIDER` or set `firecrawl` to keep the SaaS path. Jina single-page fallback (`jina-single`) is unchanged.

## Coolify / VPS operator checklist (you)

Public steps only — use your private gitignored Hetzner guide for IPs/passwords; **never commit the Hetzner guide** (or any real IPs/passwords).

1. Coolify app from [`docker/crawl4ai/docker-compose.yml`](../docker/crawl4ai/docker-compose.yml) (or image `unclecode/crawl4ai:latest`, `--shm-size=1g`).
2. DNS e.g. `crawl4ai.<your-domain>` → Coolify proxy; TLS on.
3. Set `CRAWL4AI_API_TOKEN` in Coolify secrets; rotate periodically.
4. Coolify app from [`services/agentic-pipeline/`](../services/agentic-pipeline/) (Dockerfile/compose); DNS e.g. `agents.<your-domain>`; set a strong `AGENTIC_API_TOKEN` (≥32 chars, not `change-me`) + optional LLM / Crawl4AI env. Do **not** set `AGENTIC_ALLOW_INSECURE_DEV` on public hosts.
5. Vercel: keep Firecrawl **or** set `CRAWL_PROVIDER=crawl4ai` + `CRAWL4AI_BASE_URL=https://crawl4ai.<your-domain>` + token — only if production should use self-host crawl.
6. Smoke: `GET https://crawl4ai…/health`, `POST /md` with bearer; `GET https://agents…/health`, `POST /v1/debate` with bearer.

Local tokens (gitignored): `./scripts/gen-local-service-env.sh`. Debate API: `POST /v1/debate` (see service README). Agentic HTTP auth is fail-closed; extractor URLs are SSRF-gated. This service does **not** replace Next.js chat. MCP stdio is local-only — do not bridge it to the network.

Do **not** commit real IPs, Coolify UUIDs, or passwords. Keep private VPS runbooks out of git (or gitignored).

## Expand harvest

When `CRAWL_PROVIDER=crawl4ai`, expand-harvest JavaScript is sent as Crawl4AI `js_code` on scrape. Firecrawl `/interact` is skipped for this provider.

## Switching back

```bash
CRAWL_PROVIDER=firecrawl
# unset CRAWL4AI_* or leave unused
FIRECRAWL_API_KEY=fc-...
```
