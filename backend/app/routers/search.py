import time
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.search import SearchRequest, SearchResponse
from app.services.search_service import perform_search
from app.auth.api_key_auth import get_current_api_key
from app.middleware.rate_limiter import enforce_rate_limits
from app.middleware.usage_tracker import track_usage
from app.database import get_db
from app.models.api_key import APIKey
from app.models.search_log import SearchLog

router = APIRouter()

@router.post("/search", response_model=SearchResponse, tags=["Search"])
async def search(
    request: SearchRequest,
    http_request: Request,
    api_key: APIKey = Depends(get_current_api_key),
    db: AsyncSession = Depends(get_db)
):
    """
    Perform an AI-optimized web search.

    - **basic** depth: Returns snippets only (fast, fewer tokens)
    - **advanced** depth: Fetches + extracts full page content (slower, richer)
    - **include_answer**: Uses Groq/NIM to synthesize a short answer from top results
    """
    # 1. Rate limit check
    await enforce_rate_limits(http_request, api_key, db)

    start_time = time.time()
    error_msg = None
    status_code = 200

    try:
        # 2. Perform search pipeline
        result = await perform_search(request, db=db)
        latency = int((time.time() - start_time) * 1000)
        result.response_time_ms = latency

        # 3. Track request usage
        await track_usage(db, api_key, "search", result_count=result.result_count)

        # 4. Save audit logs to DB
        log_entry = SearchLog(
            api_key_id=api_key.id,
            user_id=api_key.user_id,
            endpoint="search",
            query=request.query,
            results_count=result.result_count,
            cached=result.cached,
            latency_ms=latency,
            ip_address=http_request.client.host if http_request.client else None,
            user_agent=http_request.headers.get("user-agent"),
            status_code=status_code
        )
        db.add(log_entry)
        await db.commit()

        return result

    except Exception as e:
        status_code = 500
        error_msg = str(e)
        latency = int((time.time() - start_time) * 1000)
        
        # Log failure audit trail
        log_entry = SearchLog(
            api_key_id=api_key.id,
            user_id=api_key.user_id,
            endpoint="search",
            query=request.query,
            results_count=0,
            cached=False,
            latency_ms=latency,
            ip_address=http_request.client.host if http_request.client else None,
            user_agent=http_request.headers.get("user-agent"),
            status_code=status_code,
            error_message=error_msg
        )
        db.add(log_entry)
        await db.commit()
        raise e
