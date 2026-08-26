/** Shared user-facing copy for URL ingest (hero, loaders). */

/** Timing expectation — used in hero and loader footer only (not step subtitles/toasts). */
export const INGEST_TIMING_HINT =
  "First site crawl may take 30–90 seconds depending on page count.";

/** Scraper limitation note — combined with timing hint on hero and loader footer. */
export const INGEST_SCRAPER_NOTE =
  "Some sites block scrapers — static pages and blogs work best.";

/** Landing hero note (pre-submit). */
export const INGEST_HERO_NOTE = `${INGEST_TIMING_HINT} ${INGEST_SCRAPER_NOTE}`;

/** Loader/overlay footer during validate + index — sole place for timing + scraper hints. */
export const INGEST_INDEX_TIP = `${INGEST_TIMING_HINT} ${INGEST_SCRAPER_NOTE}`;
