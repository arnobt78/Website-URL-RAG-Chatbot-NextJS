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
  "Paste any public website URL, crawl the site with Firecrawl (or Jina fallback), index into Upstash Vector, and chat with grounded RAG answers via multi-provider LLM streaming on Next.js 16.";

export const SITE_AUTHOR = "Arnob Mahmud";
export const SITE_AUTHOR_URL = "https://www.arnobmahmud.com";
export const SITE_AUTHOR_EMAIL = "contact@arnobmahmud.com";

export const SITE_OG_IMAGE_ALT = `${SITE_NAME} — Paste a URL, crawl with RAG, chat with AI`;

/** Stable path for the App Router opengraph-image file convention. */
export const SITE_OG_IMAGE_PATH = "/opengraph-image";

export const SITE_KEYWORDS = [
  "website URL RAG chatbot",
  "URL to chat",
  "RAG chatbot",
  "Retrieval Augmented Generation",
  "web page ingestion",
  "website ingestion",
  "website crawl",
  "Firecrawl",
  "QStash",
  "Upstash Workflow",
  "Upstash Vector",
  "Upstash Redis",
  "semantic search",
  "vector database",
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Tailwind CSS",
  "multi-provider LLM",
  "streaming AI",
  "streaming chat",
  "context-aware AI",
  "Gemini API",
  "Groq",
  "OpenRouter",
  "Hugging Face",
  "Vercel",
  "Arnob Mahmud",
  "full-stack chatbot",
  "educational project",
] as const;
