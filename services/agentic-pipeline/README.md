# Agentic 7-stage pipeline (Phase 5 / Wave B)

Separate Python FastAPI service for experimental multi-stage extraction → answer assembly. **Does not replace** the Next.js Upstash RAG chat path.

Stages: Extractor → Analyzer → Preprocessor → Optimizer → Synthesizer → Validator → Assembler.

## Local run

```bash
cd services/agentic-pipeline
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set AGENTIC_API_TOKEN + optional LLM keys
uvicorn app.main:app --reload --port 8080
```

Health: `GET /health`

Run pipeline:

```bash
curl -s -X POST http://localhost:8080/v1/pipeline \
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

Exposes tools: `pipeline_run`, `stage_list`, plus per-stage `stage_*` helpers.

## Coolify

Deploy with the included `Dockerfile` (or `docker-compose.yml`). Point DNS e.g. `agents.example.com`. Set `AGENTIC_API_TOKEN` in Coolify secrets. Do not commit real host IPs or passwords.

Optional env for extractors: `CRAWL4AI_BASE_URL` / `CRAWL4AI_API_TOKEN`, or `FIRECRAWL_API_KEY`. LLM chain mirrors the Next app free-tier order (Gemini → Groq → OpenRouter `:free` → optional Ollama).

## Notebooks

See `notebooks/01_pipeline_experiment.ipynb` for offline experiments.
