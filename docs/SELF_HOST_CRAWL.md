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

Omit `CRAWL_PROVIDER` or set `firecrawl` to keep the SaaS path. Jina single-page fallback (`jina-single`) is unchanged.

## Coolify / VPS (placeholders only)

1. Create a Coolify application from `docker/crawl4ai/docker-compose.yml` (or the same image `unclecode/crawl4ai:latest` with `--shm-size=1g`).
2. Point DNS, e.g. `crawl4ai.example.com` → your Coolify proxy.
3. Set `CRAWL4AI_API_TOKEN` in Coolify secrets; rotate periodically.
4. On Vercel (only if production should use Crawl4AI):

   ```bash
   CRAWL_PROVIDER=crawl4ai
   CRAWL4AI_BASE_URL=https://crawl4ai.example.com
   CRAWL4AI_API_TOKEN=<same-secret>
   ```

### Agentic pipeline (separate service)

Deploy [`services/agentic-pipeline/`](../services/agentic-pipeline/) with its Dockerfile/compose to e.g. `agents.example.com`. Set `AGENTIC_API_TOKEN`. Optional: point extractors at Crawl4AI or Firecrawl via env. This service does **not** replace Next.js chat.

Local tokens (gitignored): `./scripts/gen-local-service-env.sh`

Debate API: `POST /v1/debate` runs crawl QA + dual drafts + boss validator (see service README).

Do **not** commit real IPs, Coolify UUIDs, or passwords. Keep private VPS runbooks out of git (or gitignored).

## Expand harvest

When `CRAWL_PROVIDER=crawl4ai`, expand-harvest JavaScript is sent as Crawl4AI `js_code` on scrape. Firecrawl `/interact` is skipped for this provider.

## Switching back

```bash
CRAWL_PROVIDER=firecrawl
# unset CRAWL4AI_* or leave unused
FIRECRAWL_API_KEY=fc-...
```
