import time
import logging

from fastapi import HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.api_key import APIKey
from app.redis_client import get_redis
from app.services.quota_service import check_monthly_quota

logger = logging.getLogger("searchmind.rate_limiter")


async def _check_per_minute_rate(api_key: APIKey) -> None:
    """
    Per-minute rate limit via Redis sliding window.
    Fails closed when Redis is unavailable (503).
    """
    key_id = str(api_key.id)
    limit = api_key.rate_limit_per_min
    window_key = f"rate:{key_id}:{int(time.time() // 60)}"

    try:
        redis = await get_redis()
        count = await redis.incr(window_key)
        if count == 1:
            await redis.expire(window_key, 60)

        if count > limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded: {limit} requests/minute",
                headers={
                    "Retry-After": "60",
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                },
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Redis rate limit check failed: %s", e)
        if settings.REQUIRE_REDIS_FOR_RATE_LIMIT:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Rate limiting service unavailable. Try again shortly.",
            ) from e
        logger.warning("Rate limiting bypassed (REQUIRE_REDIS_FOR_RATE_LIMIT=false)")


async def enforce_rate_limits(
    request: Request,
    api_key: APIKey,
    db: AsyncSession,
) -> None:
    """
    Enforce API limits before handling a metered request:
    - Per-minute: Redis (fail closed by default)
    - Monthly quota: PostgreSQL usage_records (single source of truth)
    """
    await _check_per_minute_rate(api_key)
    await check_monthly_quota(db, api_key)


# Backward-compatible alias
rate_limit_middleware = enforce_rate_limits
