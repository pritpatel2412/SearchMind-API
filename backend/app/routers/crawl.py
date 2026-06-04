import time
from typing import Any, Optional

from celery.result import AsyncResult
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.crawl import (
    CrawlRequest,
    CrawlResponse,
    CrawlPageResult,
    CrawlTaskStatusResponse,
)
from app.auth.api_key_auth import get_current_api_key
from app.middleware.rate_limiter import enforce_rate_limits
from app.middleware.usage_tracker import track_usage
from app.database import get_db
from app.models.api_key import APIKey
from app.models.search_log import SearchLog
from app.workers.tasks import crawl_url_task
from app.workers.celery_app import celery_app
from app.redis_client import get_redis

router = APIRouter()

CRAWL_TASK_KEY_PREFIX = "crawl:task:"
CRAWL_TASK_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days


def _build_crawl_status(task_id: str, async_result: AsyncResult) -> CrawlTaskStatusResponse:
    """Map a Celery AsyncResult to the public crawl status schema."""
    state = async_result.state
    ready = async_result.ready()
    successful: Optional[bool] = async_result.successful() if ready else None
    error: Optional[str] = None
    seed_url: Optional[str] = None
    pages_crawled: Optional[int] = None
    results: Optional[list[CrawlPageResult]] = None
    raw_result: Optional[Any] = None

    if ready:
        if async_result.failed():
            try:
                error = str(async_result.result)
            except Exception:
                error = "Crawl task failed"
        elif async_result.successful():
            payload = async_result.result
            raw_result = payload
            if isinstance(payload, dict):
                seed_url = payload.get("seed_url")
                pages_crawled = payload.get("pages_crawled")
                page_rows = payload.get("results") or []
                results = [
                    CrawlPageResult(
                        url=p.get("url", ""),
                        title=p.get("title"),
                        word_count=p.get("word_count"),
                        success=bool(p.get("success")),
                        error=p.get("error"),
                    )
                    for p in page_rows
                ]
    elif state == "PENDING":
        error = None

    return CrawlTaskStatusResponse(
        task_id=task_id,
        status=state,
        ready=ready,
        successful=successful,
        seed_url=seed_url,
        pages_crawled=pages_crawled,
        results=results,
        error=error,
        result=raw_result,
    )


@router.post("/crawl", response_model=CrawlResponse, tags=["Crawl"])
async def crawl(
    request: CrawlRequest,
    http_request: Request,
    api_key: APIKey = Depends(get_current_api_key),
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger a background crawler job for a specific URL domain.
    Poll status and results with ``GET /v1/crawl/{task_id}``.
    """
    await enforce_rate_limits(http_request, api_key, db)

    start_time = time.time()

    task = crawl_url_task.delay(
        url=request.url,
        max_depth=request.max_depth,
        max_pages=request.max_pages,
    )

    try:
        redis = await get_redis()
        await redis.setex(f"{CRAWL_TASK_KEY_PREFIX}{task.id}", CRAWL_TASK_TTL_SECONDS, "1")
    except Exception:
        pass

    await track_usage(db, api_key, "crawl")

    latency = int((time.time() - start_time) * 1000)
    log_entry = SearchLog(
        api_key_id=api_key.id,
        user_id=api_key.user_id,
        endpoint="crawl",
        query=f"Crawl seed URL: {request.url} (max pages: {request.max_pages})",
        results_count=1,
        cached=False,
        latency_ms=latency,
        ip_address=http_request.client.host if http_request.client else None,
        user_agent=http_request.headers.get("user-agent"),
        status_code=202,
    )
    db.add(log_entry)
    await db.commit()

    return CrawlResponse(
        task_id=task.id,
        status="PENDING",
        message="Crawling job enqueued. Poll GET /v1/crawl/{task_id} for status and results.",
    )


@router.get("/crawl/{task_id}", response_model=CrawlTaskStatusResponse, tags=["Crawl"])
async def get_crawl_status(
    task_id: str,
    api_key: APIKey = Depends(get_current_api_key),
):
    """
    Get the status and results of a background crawl task.

    - **PENDING** / **STARTED**: still running
    - **SUCCESS**: includes ``results`` with per-page crawl summary
    - **FAILURE**: includes ``error`` message
    """
    try:
        redis = await get_redis()
        known = await redis.exists(f"{CRAWL_TASK_KEY_PREFIX}{task_id}")
    except Exception:
        known = True

    if not known:
        raise HTTPException(status_code=404, detail="Crawl task not found")

    async_result = AsyncResult(task_id, app=celery_app)
    return _build_crawl_status(task_id, async_result)
