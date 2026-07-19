import asyncio
import time
import logging
from typing import Any, Optional

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
from app.redis_client import get_redis

logger = logging.getLogger("searchmind.crawl")

router = APIRouter()

CRAWL_TASK_KEY_PREFIX = "crawl:task:"
CRAWL_TASK_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days

# In-memory store for async fallback crawl results (no Celery)
_in_memory_crawl_results: dict[str, dict] = {}


def _celery_available() -> bool:
    """Check if a Celery broker (Redis) is reachable."""
    try:
        from app.workers.celery_app import celery_app
        conn = celery_app.connection()
        conn.ensure_connection(max_retries=1, timeout=2)
        conn.close()
        return True
    except Exception:
        return False


async def _run_inline_crawl(task_id: str, url: str, max_depth: int, max_pages: int) -> None:
    """Run the crawl logic in-process (no Celery) and store results in memory."""
    try:
        from app.workers.tasks import async_crawl
        result = await async_crawl(url, max_depth, max_pages)
        _in_memory_crawl_results[task_id] = {
            "state": "SUCCESS",
            "ready": True,
            "successful": True,
            "result": result,
        }
    except Exception as e:
        logger.error("Inline crawl failed for %s: %s", url, e)
        _in_memory_crawl_results[task_id] = {
            "state": "FAILURE",
            "ready": True,
            "successful": False,
            "error": str(e),
        }


def _build_crawl_status_from_celery(task_id: str) -> CrawlTaskStatusResponse:
    """Map a Celery AsyncResult to the public crawl status schema."""
    from celery.result import AsyncResult
    from app.workers.celery_app import celery_app

    async_result = AsyncResult(task_id, app=celery_app)
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


def _build_crawl_status_from_memory(task_id: str) -> CrawlTaskStatusResponse:
    """Build status from the in-memory fallback store."""
    info = _in_memory_crawl_results.get(task_id)
    if info is None:
        # Still running
        return CrawlTaskStatusResponse(
            task_id=task_id,
            status="STARTED",
            ready=False,
            successful=None,
            seed_url=None,
            pages_crawled=None,
            results=None,
            error=None,
            result=None,
        )

    payload = info.get("result")
    seed_url = None
    pages_crawled = None
    results = None
    raw_result = None

    if info.get("successful") and isinstance(payload, dict):
        seed_url = payload.get("seed_url")
        pages_crawled = payload.get("pages_crawled")
        page_rows = payload.get("results") or []
        raw_result = payload
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

    return CrawlTaskStatusResponse(
        task_id=task_id,
        status=info.get("state", "UNKNOWN"),
        ready=info.get("ready", False),
        successful=info.get("successful"),
        seed_url=seed_url,
        pages_crawled=pages_crawled,
        results=results,
        error=info.get("error"),
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
    Uses Celery if a Redis broker is available, otherwise falls back
    to an in-process async task.
    Poll status and results with ``GET /v1/crawl/{task_id}``.
    """
    if getattr(api_key.user, "plan", "free") == "free":
        raise HTTPException(status_code=403, detail="Crawl endpoint requires a Pro or Enterprise plan.")

    await enforce_rate_limits(http_request, api_key, db)

    start_time = time.time()

    use_celery = _celery_available()

    if use_celery:
        from app.workers.tasks import crawl_url_task
        task = crawl_url_task.delay(
            url=request.url,
            max_depth=request.max_depth,
            max_pages=request.max_pages,
        )
        task_id = task.id
    else:
        # Generate a task ID and launch inline
        import uuid
        task_id = str(uuid.uuid4())
        _in_memory_crawl_results.pop(task_id, None)  # clear stale
        asyncio.create_task(
            _run_inline_crawl(task_id, request.url, request.max_depth, request.max_pages)
        )
        logger.info("Celery broker unavailable; running crawl in-process (task=%s)", task_id)

    try:
        redis = await get_redis()
        await redis.setex(f"{CRAWL_TASK_KEY_PREFIX}{task_id}", CRAWL_TASK_TTL_SECONDS, "1")
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
        task_id=task_id,
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
    # Check in-memory results first (inline fallback mode)
    if task_id in _in_memory_crawl_results or not _celery_available():
        return _build_crawl_status_from_memory(task_id)

    # Check Redis task registry
    try:
        redis = await get_redis()
        known = await redis.exists(f"{CRAWL_TASK_KEY_PREFIX}{task_id}")
    except Exception:
        known = True

    if not known:
        raise HTTPException(status_code=404, detail="Crawl task not found")

    return _build_crawl_status_from_celery(task_id)
