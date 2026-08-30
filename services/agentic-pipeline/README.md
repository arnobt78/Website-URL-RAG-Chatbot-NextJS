# Agentic pipeline (Phase 5 + GATE-0015)

Separate Python FastAPI service for experimental multi-stage extraction → answer assembly and **multi-agent debate**. **Does not replace** the Next.js Upstash RAG chat path.

## Modes

| Endpoint | Behavior |
|----------|----------|
| `POST /v1/pipeline` | Classic 7-stage: Extractor → Analyzer → Preprocessor → Optimizer → Synthesizer → Validator → Assembler |
| `POST /v1/debate` | `crawl_qa` → dual drafts (A/B) → **boss validator** loop until accept / reject / `MAX_DEBATE_ROUNDS` |

Debate agents: `crawl_qa`, `draft_a`, `draft_b`, `boss_validator`.

## Local env

```bash
# from repo root — writes gitignored .env files (tokens not printed)
./scripts/gen-local-service-env.sh
```

Or copy `.env.example` manually. Never commit `.env`.

## Local run

```bash
cd services/agentic-pipeline
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080
```

Health: `GET /health`

```bash
curl -s -X POST http://localhost:8080/v1/debate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","question":"What is this site about?"}'
```

## Tests

```bash
pytest -q
```

## MCP

```bash
python -m app.mcp_server
```

Tools: `pipeline_run`, `debate_run`, `crawl_qa_run`, `stage_list`, `stage_extractor`, `stage_validator_check`.

## Coolify

Deploy with the included `Dockerfile` (or `docker-compose.yml`). Point DNS e.g. `agents.example.com`. Set `AGENTIC_API_TOKEN` in Coolify secrets. Do not commit real host IPs or passwords.

Optional: `CRAWL4AI_*`, `FIRECRAWL_API_KEY`, LLM keys, `MAX_DEBATE_ROUNDS` (default 3).

## Notebooks

See `notebooks/01_pipeline_experiment.ipynb` for offline experiments.
