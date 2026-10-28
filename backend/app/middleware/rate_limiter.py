import time
import logging

from fastapi import HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.api_key import APIKey
from app.redis_client import get_redis
from app.services.quota_service import check_monthly_quota

logger = logging.getLogger("searchmind.rate_limiter")

# In-memory per-minute sliding window fallback when Redis is absent/down
_in_memory_rate_cache: dict[str, tuple[int, int]] = {}


def _check_in_memory_rate(key_id: str) -> int:
    current_minute = int(time.time() // 60)
    if len(_in_memory_rate_cache) > 1000:
        expired = [k for k, (wm, _) in _in_memory_rate_cache.items() if wm < current_minute]
        for k in expired:
            _in_memory_rate_cache.pop(k, None)

    window_minute, count = _in_memory_rate_cache.get(key_id, (current_minute, 0))
    if window_minute != current_minute:
        count = 0
        window_minute = current_minute
    count += 1
    _in_memory_rate_cache[key_id] = (window_minute, count)
    return count


async def _check_per_minute_rate(api_key: APIKey) -> None:
    """
    Per-minute rate limit via Redis sliding window, with robust in-memory fallback
    when Redis is offline or not provisioned in the deployment environment.
    """
    key_id = str(api_key.id)
    limit = api_key.rate_limit_per_min
    window_key = f"rate:{key_id}:{int(time.time() // 60)}"

    try:
        redis = await get_redis()
        count = await redis.incr(window_key)
        if count == 1:
            await redis.expire(window_key, 60)
    except Exception as e:
        logger.warning("Redis rate limit check failed (%s); using in-memory limiter", e)
        count = _check_in_memory_rate(key_id)

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


async def enforce_rate_limits(
    request: Request,
    api_key: APIKey,
    db: AsyncSession,
) -> None:
    """
    Enforce API limits before handling a metered request:
    - Per-minute: Redis sliding window with in-memory fallback
    - Monthly quota: PostgreSQL usage_records (single source of truth)
    """
    await _check_per_minute_rate(api_key)
    await check_monthly_quota(db, api_key)


# Backward-compatible alias
rate_limit_middleware = enforce_rate_limits
