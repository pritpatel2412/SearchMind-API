import asyncio
from celery import shared_task
from urllib.parse import urlparse, urljoin
import hashlib
from bs4 import BeautifulSoup

from app.workers.celery_app import celery_app
from app.services.fetch_service import fetch_url_content
from app.services.extract_service import extract_content
from app.services.cache_service import set_cached
from app.services.sync_progress_emitter import SyncProgressEmitter
from app.config import settings

@celery_app.task(name="tasks.crawl_url", bind=True)
def crawl_url_task(self, url: str, max_depth: int = 1, max_pages: int = 10) -> dict:
    """Synchronous Celery wrapper to execute the async crawl logic."""
    emitter = SyncProgressEmitter(run_id=self.request.id, redis_channel=f"crawl:stream:{self.request.id}")
    emitter.emit("started", {"url": url, "max_depth": max_depth, "max_pages": max_pages})
    
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    result = loop.run_until_complete(async_crawl(url, max_depth, max_pages, emitter))
    emitter.emit("complete", result)
    return result

async def async_crawl(start_url: str, max_depth: int, max_pages: int, emitter: SyncProgressEmitter) -> dict:
    """Async crawling logic restricted to the input domain."""
    parsed_start = urlparse(start_url)
    allowed_domain = parsed_start.netloc.lower().replace("www.", "")

    queue = [(start_url, 0)]
    visited = set()
    results = []

    while queue and len(visited) < max_pages:
        url, depth = queue.pop(0)
        
        # Normalize url
        parsed_url = urlparse(url)
        normalized_url = parsed_url._replace(fragment="").geturl()
        
        if normalized_url in visited:
            continue
        visited.add(normalized_url)

        try:
            emitter.emit("progress", {"stage": "fetch", "url": normalized_url, "status": "start"})
            html = await fetch_url_content(normalized_url)
            if not html:
                results.append({
                    "url": normalized_url,
                    "success": False,
                    "error": "Failed to retrieve page content"
                })
                emitter.emit("error", {"stage": "fetch", "url": normalized_url, "message": "Failed to retrieve page content"})
                continue

            emitter.emit("progress", {"stage": "extract", "url": normalized_url, "status": "start"})
            extracted = extract_content(html, normalized_url)
            content = extracted.get("content", "")
            title = extracted.get("title", "")

            page_result = {
                "url": normalized_url,
                "title": title,
                "word_count": len(content.split()),
                "success": True
            }
            results.append(page_result)
            emitter.emit("progress", {"stage": "extract", "url": normalized_url, "status": "done"})

            cache_key = "extract:" + hashlib.sha256(normalized_url.encode()).hexdigest()
            cache_payload = {
                "url": normalized_url,
                "title": title,
                "content": content[:settings.CRAWL_MAX_CONTENT_LENGTH],
                "author": extracted.get("author"),
                "published_date": extracted.get("published_date"),
                "language": extracted.get("language"),
                "word_count": len(content.split()),
                "extraction_method": extracted.get("extraction_method", "crawl"),
                "success": True,
            }
            await set_cached(
                cache_key=cache_key,
                response_data=cache_payload,
                ttl=settings.EXTRACT_CACHE_TTL,
            )

            # Parse and enqueue links if not yet at depth limit
            if depth < max_depth:
                soup = BeautifulSoup(html, "html.parser")
                for link in soup.find_all("a", href=True):
                    href = link["href"]
                    full_url = urljoin(normalized_url, href)
                    parsed_full = urlparse(full_url)
                    full_domain = parsed_full.netloc.lower().replace("www.", "")
                    
                    if full_domain == allowed_domain:
                        clean_url = parsed_full._replace(fragment="").geturl()
                        if clean_url not in visited and clean_url not in [q[0] for q in queue]:
                            queue.append((clean_url, depth + 1))

        except Exception as e:
            results.append({
                "url": normalized_url,
                "success": False,
                "error": str(e)
            })
            emitter.emit("error", {"stage": "pipeline", "url": normalized_url, "message": str(e)})

    return {
        "seed_url": start_url,
        "pages_crawled": len(visited),
        "results": results
    }
