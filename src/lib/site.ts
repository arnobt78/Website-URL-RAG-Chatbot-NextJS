/** Shared branding + SEO strings (layout metadata, landing UI). */
export const SITE_URL = "https://scraper-rag-chatbot.vercel.app";

/** Human-readable product name for UI and meta titles. */
export const SITE_NAME = "Website URL RAG Chatbot";

/** Hyphenated slug variant (portfolio lists); README H1 uses human-readable SITE_NAME. */
export const SITE_REPO_SLUG = "Website-URL-RAG-Chatbot";

export const SITE_STACK_SUFFIX =
  "Next.js, TypeScript, TailwindCSS, Multi-Provider LLM, Upstash Vector, QStash, Redis Full-Stack Project";

export const SITE_FULL_TITLE = `${SITE_REPO_SLUG} – ${SITE_STACK_SUFFIX}`;

export const SITE_TITLE = `${SITE_NAME} | Chat with Any Website`;

export const SITE_DESCRIPTION =
  "Paste any public website URL, ingest its content into Upstash Vector, and chat with grounded RAG answers. Built with Next.js 16, React 19, multi-provider LLM fallback, Redis session history, and live token streaming.";

export const SITE_KEYWORDS = [
  "website URL RAG chatbot",
  "URL to chat",
  "RAG chatbot",
  "Retrieval Augmented Generation",
  "web page ingestion",
  "website ingestion",
  "Upstash Vector",
  "Upstash Redis",
  "semantic search",
  "vector database",
  "Next.js 16",
  "React 19",
  "multi-provider LLM",
  "streaming AI",
  "context-aware AI",
  "Gemini API",
  "Groq",
  "OpenRouter",
  "Hugging Face",
  "Arnob Mahmud",
  "full-stack chatbot",
] as const;
