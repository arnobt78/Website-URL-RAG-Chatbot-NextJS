"use client";

import { motion } from "framer-motion";
import { ArrowRight, Globe, Sparkles, Zap, Database, MessageSquare, Shield, Loader2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { HeroBackground } from "./HeroBackground";
import { ChatNavigationOverlay } from "./ChatNavigationOverlay";
import { useChatNavigation } from "@/hooks/use-chat-navigation";
import { urlToChatPath } from "@/lib/url-to-chat-path";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  revealVariants,
  staggerContainer,
  stairLineVariants,
  viewportOnce,
} from "@/lib/motion";

const FEATURES = [
  {
    icon: Globe,
    title: "Any Website",
    description: "Paste a URL and chat with that site's content instantly via RAG ingestion.",
    color: "sky",
  },
  {
    icon: Database,
    title: "Vector Search",
    description: "Upstash Vector stores semantic chunks for accurate, context-aware answers.",
    color: "emerald",
  },
  {
    icon: MessageSquare,
    title: "Streaming Chat",
    description: "Real-time token streaming with session memory powered by Upstash Redis.",
    color: "violet",
  },
  {
    icon: Zap,
    title: "Fast Inference",
    description: "Multi-provider LLM fallback (Gemini, Groq, OpenRouter, Hugging Face) for resilient streaming.",
    color: "amber",
  },
  {
    icon: Sparkles,
    title: "Smart Context",
    description: "Retrieval-Augmented Generation grounds every answer in indexed page content.",
    color: "blue",
  },
  {
    icon: Shield,
    title: "Production Ready",
    description: "Rate limits, bot protection, security headers, and audit-clean dependencies.",
    color: "rose",
  },
] as const;

const STEPS = [
  { step: "01", title: "Enter a URL", desc: "Paste any public website address on the landing page." },
  { step: "02", title: "Auto-Ingest", desc: "HTML is chunked and embedded into Upstash Vector automatically." },
  { step: "03", title: "Ask Anything", desc: "Stream answers grounded in the indexed page content." },
] as const;

const colorMap: Record<string, string> = {
  sky: "from-sky-500/20 to-sky-600/5 border-sky-500/30 text-sky-400",
  emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/30 text-emerald-400",
  violet: "from-violet-500/20 to-violet-600/5 border-violet-500/30 text-violet-400",
  amber: "from-amber-500/20 to-amber-600/5 border-amber-500/30 text-amber-400",
  blue: "from-blue-500/20 to-blue-600/5 border-blue-500/30 text-blue-400",
  rose: "from-rose-500/20 to-rose-600/5 border-rose-500/30 text-rose-400",
};

/**
 * Client landing page: hero rotation, stagger reveals, URL → /[...url] chat navigation.
 */
export function HomePage() {
  const { isNavigating, currentStep, startNavigation } = useChatNavigation();
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState("");
  const pathPreview = urlInput.trim() ? urlToChatPath(urlInput) : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      setError("Enter a valid public URL (e.g. www.wikipedia.org or https://example.com)");
      return;
    }
    setError("");
    const result = await startNavigation(urlInput);
    if (!result.ok) {
      setError(result.reason);
    }
  };

  const tryDemo = () => void startNavigation("https://www.wikipedia.org");

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <ChatNavigationOverlay visible={isNavigating} step={currentStep} />
      {/* Hero — full viewport, rotating backgrounds */}
      <header className="hero" data-hero id="home">
        <HeroBackground />
        <div className="hero__inner">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer(0.1, 0.1)}
            className="max-w-3xl mx-auto text-center px-4"
          >
            <motion.div variants={revealVariants(16)} className="mb-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-sm text-sky-300 backdrop-blur-sm">
                <Sparkles className="size-4" />
                {SITE_NAME}
              </span>
            </motion.div>

            {["Chat with", "Any Website"].map((line, i) => (
              <motion.h1
                key={line}
                custom={i}
                variants={stairLineVariants(i)}
                className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight"
              >
                {line}
              </motion.h1>
            ))}

            <motion.p
              variants={revealVariants(20)}
              className="mt-6 text-lg text-zinc-300 max-w-xl mx-auto"
            >
              Paste a URL, ingest its content into Upstash Vector, and get streaming
              RAG-powered answers — no setup required.
            </motion.p>

            <motion.form
              variants={revealVariants(24)}
              onSubmit={handleSubmit}
              className="mt-10 flex flex-col gap-3 max-w-xl mx-auto"
            >
              <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                id="url-input"
                value={urlInput}
                disabled={isNavigating}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setError("");
                }}
                placeholder="www.wikipedia.org or https://example.com"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder:text-zinc-500 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-sky-500/50 disabled:opacity-60"
                aria-label="Website URL to chat with"
                aria-describedby={pathPreview ? "url-path-preview" : undefined}
              />
              <button
                type="submit"
                disabled={isNavigating}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3.5 font-semibold text-white transition hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isNavigating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Checking…
                  </>
                ) : (
                  <>
                    Chat with site
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
              </div>
              {pathPreview && (
                <p id="url-path-preview" className="text-left text-sm text-zinc-500 font-mono">
                  Will open: {pathPreview}
                </p>
              )}
            </motion.form>

            {error && (
              <motion.p variants={revealVariants(8)} className="mt-3 text-sm text-rose-400">
                {error}
              </motion.p>
            )}

            <motion.button
              type="button"
              variants={revealVariants(28)}
              disabled={isNavigating}
              onClick={tryDemo}
              className="mt-4 text-sm text-zinc-400 underline-offset-4 hover:text-sky-400 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              Try demo: Wikipedia →
            </motion.button>
          </motion.div>
        </div>
      </header>

      {/* Features — stagger card wave */}
      <section className="py-24 px-4" id="features">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={revealVariants()}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold">Built for real-world RAG</h2>
            <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
              Production stack: Next.js 16, React 19, Upstash Redis, Vector, and multi-provider LLM fallback.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer(0.08, 0.1)}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map(({ icon: Icon, title, description, color }) => (
              <motion.article
                key={title}
                variants={revealVariants(32)}
                className={`rounded-2xl border bg-gradient-to-br p-6 backdrop-blur-sm ${colorMap[color]}`}
              >
                <Icon className="size-8 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-400">{description}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works — stair steps */}
      <section className="py-24 px-4 bg-zinc-900/50" id="how">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={revealVariants()}
            className="text-3xl sm:text-4xl font-bold text-center mb-16"
          >
            How it works
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer(0.15, 0.05)}
            className="space-y-8"
          >
            {STEPS.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                variants={stairLineVariants(i)}
                className="flex gap-6 items-start rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                <span className="text-3xl font-bold text-sky-500/80 shrink-0">{step}</span>
                <div>
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-zinc-400">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section className="py-24 px-4" id="about">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={revealVariants()}
          className="max-w-3xl mx-auto text-center rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 to-violet-500/10 p-10 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-4">About this project</h2>
          <p className="text-zinc-300 leading-relaxed">
            {SITE_NAME} demonstrates Retrieval-Augmented Generation with
            dynamic website ingestion, semantic vector search, and streaming chat — built
            by{" "}
            <a
              href="https://www.arnobmahmud.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:underline"
            >
              Arnob Mahmud
            </a>
            .
          </p>
          <a
            href={`${SITE_URL}/www.wikipedia.org`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sky-400 hover:underline"
          >
            View live demo <ArrowRight className="size-4" />
          </a>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 text-center text-sm text-zinc-500">
        <p>
          © {new Date().getFullYear()} Arnob Mahmud ·{" "}
          <a href="mailto:contact@arnobmahmud.com" className="hover:text-sky-400">
            contact@arnobmahmud.com
          </a>
        </p>
      </footer>
    </div>
  );
}
