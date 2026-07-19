import httpx
import logging
import base64
from typing import Optional
from playwright.async_api import async_playwright
from app.config import settings

from app.http_client import get_http_client

logger = logging.getLogger("searchmind.fetch")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SearchMindBot/1.0; +https://searchmind.dev/bot)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

async def fetch_url_content(url: str, use_js: bool = False, emitter=None) -> Optional[str]:
    """Fetch raw HTML from URL. Falls back to Playwright for JS-heavy pages or failures."""
    if not use_js:
        try:
            client = get_http_client()
            response = await client.get(
                url,
                timeout=12.0,
                follow_redirects=True,
                headers=HEADERS
            )
            if response.status_code == 200:
                content_type = response.headers.get("content-type", "").lower()
                if "text/html" in content_type or "text/plain" in content_type:
                    if emitter:
                        await emitter.emit("progress", {"stage": "fetch", "url": url, "status": "done", "method": "httpx"})
                    return response.text
        except Exception as e:
            logger.debug(f"HTTPX fetch failed for {url}: {e}. Retrying with Playwright...")

    # Fallback to Playwright for JS rendering
    return await fetch_with_playwright(url, emitter=emitter)


async def fetch_with_playwright(url: str, emitter=None) -> Optional[str]:
    """Uses headless Playwright Chromium browser to render and fetch URL contents."""
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
            )
            page = await browser.new_page()
            await page.set_extra_http_headers(HEADERS)
            try:
                await page.goto(url, timeout=settings.PLAYWRIGHT_TIMEOUT_MS, wait_until="domcontentloaded")
                await page.wait_for_timeout(1500)  # Allow JS rendering to settle
                
                if emitter:
                    screenshot_bytes = await page.screenshot(type="jpeg", quality=40)
                    await emitter.emit("screenshot", {"url": url, "image_b64": base64.b64encode(screenshot_bytes).decode()})

                html = await page.content()
                if emitter:
                    await emitter.emit("progress", {"stage": "fetch", "url": url, "status": "done", "method": "playwright"})
                return html
            finally:
                await browser.close()
    except Exception as e:
        logger.error(f"Playwright fetch failed for {url}: {e}")
        if emitter:
            await emitter.emit("error", {"stage": "fetch", "url": url, "message": str(e)})
        return None
