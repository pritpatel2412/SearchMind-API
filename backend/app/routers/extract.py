import asyncio
import hashlib
import json
import time
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.schemas.extract import (
    ExtractRequest, ExtractedPage, ExtractResponse,
    SchemaExtractRequest, SchemaExtractResponse
)
from app.services.fetch_service import fetch_url_content
from app.services.extract_service import extract_content
from app.services.schema_extract_service import extract_with_schema
from app.auth.api_key_auth import get_current_api_key
from app.services.progress_emitter import ProgressEmitter
from app.services.embedding_service import embedding_service
from app.utils.sse import queue_to_sse
from fastapi.responses import StreamingResponse
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
    db: AsyncSession,
    vectorize: bool = False,
    extract_images: bool = False,
    query: Optional[str] = None,
    highlights: bool = False,
    max_highlights: int = 3,
    highlight_strategy: str = "dynamic",
    emitter: Optional[ProgressEmitter] = None
) -> ExtractedPage:
    cache_payload = {
        "url": url,
        "query": query,
        "highlights": highlights,
        "max_highlights": max_highlights,
        "highlight_strategy": highlight_strategy
    }
    cache_key = "extract:" + hashlib.sha256(json.dumps(cache_payload, sort_keys=True).encode()).hexdigest()
    try:
        cached = await get_cached(cache_key, db=db)
        if cached:
            return ExtractedPage(**cached)
    except Exception:
        pass

    try:
        if emitter:
            await emitter.emit("progress", {"stage": "fetch", "url": url, "status": "start"})
        html = await fetch_url_content(url, use_js=use_js, extract_images=extract_images, emitter=emitter)
        if not html:
            return ExtractedPage(
                url=url, title=None, content="", author=None,
                published_date=None, language=None, word_count=0,
                extraction_method="failed", success=False, error="Failed to fetch URL content"
            )

        if emitter:
            await emitter.emit("progress", {"stage": "extract", "url": url, "status": "start"})
        extracted = extract_content(
            html, url, 
            query=query, 
            highlights=highlights, 
            max_highlights=max_highlights, 
            highlight_strategy=highlight_strategy
        )
        content = extracted["content"][:max_content_length]
        vectors = None
        if vectorize and content:
            if emitter:
                await emitter.emit("progress", {"stage": "vectorize", "url": url, "status": "start"})
            vectors = await embedding_service.vectorize_text(content)
            if emitter:
                await emitter.emit("progress", {"stage": "vectorize", "url": url, "status": "done"})

        page = ExtractedPage(
            url=url,
            title=extracted.get("title", ""),
            content=content,
            author=extracted.get("author"),
            published_date=extracted.get("published_date"),
            language=extracted.get("language"),
            word_count=len(content.split()),
            extraction_method=extracted.get("extraction_method", "unknown"),
            success=True,
            vectors=vectors,
            highlights=extracted.get("highlights"),
            token_savings_percentage=extracted.get("token_savings_percentage")
        )
        
        if emitter:
            await emitter.emit("progress", {"stage": "extract", "url": url, "status": "done", "word_count": page.word_count})

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
    if getattr(api_key.user, "plan", "free") == "free":
        raise HTTPException(status_code=403, detail="Extract endpoint requires a Pro or Enterprise plan.")

    # 1. Rate limiter check
    await enforce_rate_limits(http_request, api_key, db)

    start_time = time.time()

    # Process all URLs concurrently (limited to 10 URLs per batch request)
    tasks = [
        process_single_url(
            url, 
            request.use_js_rendering, 
            request.max_content_length, 
            db, 
            request.vectorize, 
            request.extract_images,
            query=request.query,
            highlights=request.highlights,
            max_highlights=request.max_highlights,
            highlight_strategy=request.highlight_strategy
        )
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

@router.post("/extract/stream", tags=["Extract"])
async def extract_stream(
    request: ExtractRequest,
    http_request: Request,
    api_key: APIKey = Depends(get_current_api_key),
    db: AsyncSession = Depends(get_db)
):
    await enforce_rate_limits(http_request, api_key, db)
    if getattr(api_key.user, "plan", "free") == "free":
        raise HTTPException(status_code=403, detail="Extract endpoint requires a Pro or Enterprise plan.")

    queue: asyncio.Queue = asyncio.Queue()
    emitter = ProgressEmitter(queue=queue)

    async def run_pipeline():
        await emitter.emit("started", {"endpoint": "extract", "urls": request.urls[:10]})
        try:
            start_time = time.time()
            tasks = [
                process_single_url(
                    url, 
                    request.use_js_rendering, 
                    request.max_content_length, 
                    db, 
                    request.vectorize, 
                    request.extract_images,
                    query=request.query,
                    highlights=request.highlights,
                    max_highlights=request.max_highlights,
                    highlight_strategy=request.highlight_strategy,
                    emitter=emitter
                )
                for url in request.urls[:10]
            ]
            results = await asyncio.gather(*tasks)
            extracted_count = sum(1 for r in results if r.success)
            failed_count = sum(1 for r in results if not r.success)

            await track_usage(db, api_key, "extract", result_count=extracted_count)
            latency = int((time.time() - start_time) * 1000)

            # DB Log
            log_entry = SearchLog(
                api_key_id=api_key.id, user_id=api_key.user_id, endpoint="extract",
                query=f"URLs count: {len(request.urls)}", results_count=extracted_count,
                cached=False, latency_ms=latency,
                ip_address=http_request.client.host if http_request.client else None,
                user_agent=http_request.headers.get("user-agent"), status_code=200
            )
            db.add(log_entry)
            await db.commit()

            response = ExtractResponse(
                results=results, extracted_count=extracted_count, failed_count=failed_count
            )
            await emitter.emit("complete", response.model_dump())
        except asyncio.CancelledError:
            raise
        except Exception as e:
            await emitter.emit("error", {"stage": "pipeline", "message": str(e)})
        finally:
            await emitter.close()

    task = asyncio.create_task(run_pipeline())

    async def event_stream():
        try:
            async for frame in queue_to_sse(queue):
                if await http_request.is_disconnected():
                    task.cancel()
                    break
                yield frame
        finally:
            if not task.done():
                task.cancel()

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@router.post("/extract/schema", response_model=SchemaExtractResponse, tags=["Extract"])
async def extract_schema_endpoint(
    request: SchemaExtractRequest,
    http_request: Request,
    api_key: APIKey = Depends(get_current_api_key),
    db: AsyncSession = Depends(get_db)
):
    """
    Extract type-safe structured JSON entities from a URL or raw HTML directly conforming
    to a client-provided JSON Schema specification. Eliminates downstream LLM token costs.
    """
    if getattr(api_key.user, "plan", "free") == "free":
        raise HTTPException(status_code=403, detail="Schema extraction requires a Pro or Enterprise plan.")

    await enforce_rate_limits(http_request, api_key, db)
    
    if not request.url and not request.html:
        raise HTTPException(status_code=400, detail="Either 'url' or 'html' must be provided for schema extraction.")

    response = await extract_with_schema(request, db=db)
    
    # Usage tracking and logging
    await track_usage(db, api_key, "extract_schema", result_count=1)
    log_entry = SearchLog(
        api_key_id=api_key.id,
        user_id=api_key.user_id,
        endpoint="extract/schema",
        query=request.url or "raw_html",
        results_count=1,
        cached=response.cached,
        latency_ms=response.execution_time_ms,
        ip_address=http_request.client.host if http_request.client else None,
        user_agent=http_request.headers.get("user-agent"),
        status_code=200
    )
    db.add(log_entry)
    await db.commit()

    return response

