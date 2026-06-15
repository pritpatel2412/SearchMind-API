import asyncio
import hashlib
import time
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.schemas.extract import ExtractRequest, ExtractedPage, ExtractResponse
from app.services.fetch_service import fetch_url_content
from app.services.extract_service import extract_content
from app.auth.api_key_auth import get_current_api_key
from app.middleware.rate_limiter import enforce_rate_limits
from app.middleware.usage_tracker import track_usage
from app.services.cache_service import get_cached, set_cached
from app.database import get_db
from app.config import settings
from app.models.api_key import APIKey
from app.models.search_log import SearchLog

router = APIRouter()

async def process_single_url(
    url: str,
    use_js: bool,
    max_content_length: int,
    db: AsyncSession
) -> ExtractedPage:
    cache_key = "extract:" + hashlib.sha256(url.encode()).hexdigest()
    try:
        cached = await get_cached(cache_key, db=db)
        if cached:
            return ExtractedPage(**cached)
    except Exception:
        pass

    try:
        html = await fetch_url_content(url, use_js=use_js)
        if not html:
            return ExtractedPage(
                url=url, title=None, content="", author=None,
                published_date=None, language=None, word_count=0,
                extraction_method="failed", success=False, error="Failed to fetch URL content"
            )

        extracted = extract_content(html, url)
        content = extracted["content"][:max_content_length]
        page = ExtractedPage(
            url=url,
            title=extracted.get("title", ""),
            content=content,
            author=extracted.get("author"),
            published_date=extracted.get("published_date"),
            language=extracted.get("language"),
            word_count=len(content.split()),
            extraction_method=extracted.get("extraction_method", "unknown"),
            success=True
        )
        
        # Cache successfully extracted page content
        try:
            await set_cached(
                cache_key, page.model_dump(), ttl=settings.EXTRACT_CACHE_TTL, db=db
            )
        except Exception:
            pass
            
        return page

    except Exception as e:
        return ExtractedPage(
            url=url, title=None, content="", author=None,
            published_date=None, language=None, word_count=0,
            extraction_method="error", success=False, error=str(e)
        )

@router.post("/extract", response_model=ExtractResponse, tags=["Extract"])
async def extract(
    request: ExtractRequest,
    http_request: Request,
    api_key: APIKey = Depends(get_current_api_key),
    db: AsyncSession = Depends(get_db)
):
    """
    Extract clean readable text and metadata from one or more URLs.
    Supports optional JS rendering via Playwright chromium browser.
    """
    # 1. Rate limiter check
    await enforce_rate_limits(http_request, api_key, db)

    start_time = time.time()

    # Process all URLs concurrently (limited to 10 URLs per batch request)
    tasks = [
        process_single_url(url, request.use_js_rendering, request.max_content_length, db)
        for url in request.urls[:10]
    ]
    results = await asyncio.gather(*tasks)

    extracted_count = sum(1 for r in results if r.success)
    failed_count = sum(1 for r in results if not r.success)
    
    # 2. Track usage stats
    await track_usage(db, api_key, "extract", result_count=extracted_count)

    # 3. Log request metrics in DB
    latency = int((time.time() - start_time) * 1000)
    log_entry = SearchLog(
        api_key_id=api_key.id,
        user_id=api_key.user_id,
        endpoint="extract",
        query=f"URLs count: {len(request.urls)}",
        results_count=extracted_count,
        cached=False,
        latency_ms=latency,
        ip_address=http_request.client.host if http_request.client else None,
        user_agent=http_request.headers.get("user-agent"),
        status_code=200
    )
    db.add(log_entry)
    await db.commit()

    return ExtractResponse(
        results=results,
        extracted_count=extracted_count,
        failed_count=failed_count
    )
