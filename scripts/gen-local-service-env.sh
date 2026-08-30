#!/usr/bin/env bash
# Generate gitignored local .env files for Crawl4AI + agentic-pipeline.
# Never commit the resulting .env files. Does not print secret values.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRAWL_DIR="$ROOT/docker/crawl4ai"
AGENT_DIR="$ROOT/services/agentic-pipeline"

token() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex 32
  else
    # fallback
    head -c 32 /dev/urandom | base64 | tr -d '\n='
  fi
}

mkdir -p "$CRAWL_DIR" "$AGENT_DIR"

CRAWL_TOKEN="$(token)"
AGENT_TOKEN="$(token)"

cat >"$CRAWL_DIR/.env" <<EOF
CRAWL4AI_API_TOKEN=${CRAWL_TOKEN}
CRAWL4AI_HOST_PORT=11235
EOF

# Start agentic .env from example keys; copy LLM keys from root .env if present (no echo)
{
  echo "AGENTIC_API_TOKEN=${AGENT_TOKEN}"
  echo "PORT=8080"
  echo "CRAWL4AI_BASE_URL=http://localhost:11235"
  echo "CRAWL4AI_API_TOKEN=${CRAWL_TOKEN}"
  echo "MAX_DEBATE_ROUNDS=3"
} >"$AGENT_DIR/.env"

if [[ -f "$ROOT/.env" ]]; then
  while IFS= read -r line; do
    case "$line" in
      FIRECRAWL_API_KEY=*|GEMINI_API_KEY=*|GROQ_API_KEY=*|OPENROUTER_API_KEY=*|OLLAMA_BASE_URL=*|OLLAMA_MODEL=*)
        echo "$line" >>"$AGENT_DIR/.env"
        ;;
    esac
  done <"$ROOT/.env"
fi

echo "Wrote docker/crawl4ai/.env and services/agentic-pipeline/.env (gitignored)."
echo "Tokens generated; values not printed."
