import asyncio
from celery import shared_task
from urllib.parse import urlparse, urljoin
import hashlib
from bs4 import BeautifulSoup

from app.workers.celery_app import celery_app
from app.services.fetch_service import fetch_url_content
from app.services.extract_service import extract_content
from app.services.cache_service import set_cached
from app.config import settings

@celery_app.task(name="tasks.crawl_url")
def crawl_url_task(url: str, max_depth: int = 1, max_pages: int = 10) -> dict:
    """Synchronous Celery wrapper to execute the async crawl logic."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(async_crawl(url, max_depth, max_pages))

async def async_crawl(start_url: str, max_depth: int, max_pages: int) -> dict:
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
            html = await fetch_url_content(normalized_url)
            if not html:
                results.append({
                    "url": normalized_url,
                    "success": False,
                    "error": "Failed to retrieve page content"
                })
                continue

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

    return {
        "seed_url": start_url,
        "pages_crawled": len(visited),
        "results": results
    }
