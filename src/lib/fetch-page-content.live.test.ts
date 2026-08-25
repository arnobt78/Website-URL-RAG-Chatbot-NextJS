import { describe, expect, it } from "vitest";
import {
  fetchPageContentAsText,
  MIN_USABLE_TEXT_CHARS,
} from "./fetch-page-content";

describe.skipIf(!process.env.RUN_LIVE_INGEST_SMOKE)(
  "fetchPageContentAsText (live Jina smoke)",
  () => {
    it(
      "fetches readable text from a stable public page via Jina Reader",
      async () => {
        const result = await fetchPageContentAsText("https://example.com");

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.text.length).toBeGreaterThanOrEqual(MIN_USABLE_TEXT_CHARS);
        }
      },
      60_000
    );
  }
);
