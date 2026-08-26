import type { FirecrawlAction } from "@/lib/crawl/firecrawl-client";

/** One scrape job: base URL plus optional browser actions and human label. */
export type CrawlTarget = {
  url: string;
  /** Dedup key — pathname + hash + label slug. */
  variantKey: string;
  label?: string;
  actions?: FirecrawlAction[];
  /** Prefer interact fallback when deterministic scrape is thin. */
  preferInteract?: boolean;
};

export function targetVariantKey(url: string, label?: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname || "/";
    const hash = parsed.hash || "";
    const labelPart = label ? `:${label.toLowerCase().replace(/\s+/g, "-")}` : "";
    return `${path}${hash}${labelPart}`;
  } catch {
    return `${url}${label ? `:${label}` : ""}`;
  }
}

export function dedupeTargets(targets: CrawlTarget[]): CrawlTarget[] {
  const seen = new Set<string>();
  const out: CrawlTarget[] = [];
  for (const t of targets) {
    if (seen.has(t.variantKey)) continue;
    seen.add(t.variantKey);
    out.push(t);
  }
  return out;
}
