from __future__ import annotations

import httpx

from app.models import PageDoc, PipelineState
from app.settings import get_settings


async def run_extractor(state: PipelineState) -> PipelineState:
    settings = get_settings()
    pages: list[PageDoc] = []

    if settings.crawl4ai_base_url and settings.crawl4ai_api_token:
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(
                f"{settings.crawl4ai_base_url.rstrip('/')}/md",
                headers={
                    "Authorization": f"Bearer {settings.crawl4ai_api_token}",
                    "Content-Type": "application/json",
                },
                json={"url": state.url, "f": "fit"},
            )
            if res.is_success:
                data = res.json()
                md = (data.get("markdown") or "").strip()
                if md:
                    pages.append(PageDoc(url=state.url, markdown=md))

    if not pages and settings.firecrawl_api_key:
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(
                "https://api.firecrawl.dev/v1/scrape",
                headers={
                    "Authorization": f"Bearer {settings.firecrawl_api_key}",
                    "Content-Type": "application/json",
                },
                json={"url": state.url, "formats": ["markdown"], "onlyMainContent": True},
            )
            if res.is_success:
                data = res.json()
                md = ((data.get("data") or {}).get("markdown") or "").strip()
                title = ((data.get("data") or {}).get("metadata") or {}).get("title")
                if md:
                    pages.append(PageDoc(url=state.url, markdown=md, title=title))

    if not pages:
        # Lightweight public fetch fallback (no JS) for demos/tests
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            res = await client.get(
                state.url,
                headers={"User-Agent": "agentic-pipeline/1.0"},
            )
            text = res.text if res.is_success else ""
            # Crude strip of tags for offline demos
            import re

            md = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.I)
            md = re.sub(r"<style[\s\S]*?</style>", " ", md, flags=re.I)
            md = re.sub(r"<[^>]+>", " ", md)
            md = re.sub(r"\s+", " ", md).strip()
            if md:
                pages.append(PageDoc(url=state.url, markdown=md[:20_000]))

    state.pages = pages
    state.sources = [p.url for p in pages]
    state.log("extractor", {"pages": len(pages), "chars": sum(len(p.markdown) for p in pages)})
    return state
