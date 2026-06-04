import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import SessionLocal
from app.models.cached_results import CachedResult
from app.redis_client import get_redis

logger = logging.getLogger("searchmind.cache")


def endpoint_from_cache_key(cache_key: str) -> str:
    """Derive endpoint label from cache key prefix (search:, extract:, etc.)."""
    if ":" in cache_key:
        return cache_key.split(":", 1)[0]
    return "generic"


async def get_cached(
    cache_key: str,
    db: Optional[AsyncSession] = None,
) -> Optional[Dict[str, Any]]:
    """
    Two-tier cache lookup: Redis (hot) → PostgreSQL cached_results (warm).
    PostgreSQL uses an isolated session so request transactions are not committed early.
    """
    del db  # reserved for future request-scoped optimization

    try:
        redis = await get_redis()
        data = await redis.get(cache_key)
        if data:
            return json.loads(data)
    except Exception as e:
        logger.warning("Redis cache read failed for %s: %s", cache_key, e)

    try:
        now = datetime.now(timezone.utc)
        async with SessionLocal() as session:
            result = await session.execute(
                select(CachedResult).where(
                    CachedResult.cache_key == cache_key,
                    CachedResult.expires_at > now,
                )
            )
            row = result.scalar_one_or_none()
            if not row:
                return None

            row.hit_count = (row.hit_count or 0) + 1
            payload = row.response_json
            expires_at = row.expires_at
            await session.commit()

        if isinstance(payload, dict):
            try:
                redis = await get_redis()
                ttl = max(int((expires_at - now).total_seconds()), 1)
                await redis.setex(cache_key, ttl, json.dumps(payload))
            except Exception as e:
                logger.debug("Could not warm Redis for %s: %s", cache_key, e)
            return payload
    except Exception as e:
        logger.error("PostgreSQL cache read failed for %s: %s", cache_key, e)

    return None


async def set_cached(
    cache_key: str,
    response_data: Dict[str, Any],
    ttl: int,
    db: Optional[AsyncSession] = None,
) -> None:
    """Write to Redis and persist to PostgreSQL cached_results."""
    del db

    endpoint = endpoint_from_cache_key(cache_key)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=ttl)

    try:
        redis = await get_redis()
        await redis.setex(cache_key, ttl, json.dumps(response_data))
    except Exception as e:
        logger.warning("Redis cache write failed for %s: %s", cache_key, e)

    try:
        async with SessionLocal() as session:
            stmt = (
                insert(CachedResult)
                .values(
                    cache_key=cache_key,
                    endpoint=endpoint,
                    response_json=response_data,
                    hit_count=0,
                    expires_at=expires_at,
                )
                .on_conflict_do_update(
                    index_elements=["cache_key"],
                    set_={
                        "endpoint": endpoint,
                        "response_json": response_data,
                        "expires_at": expires_at,
                    },
                )
            )
            await session.execute(stmt)
            await session.commit()
    except Exception as e:
        logger.error("PostgreSQL cache write failed for %s: %s", cache_key, e)


async def purge_expired_cached_results(db: AsyncSession) -> int:
    """Delete expired rows from cached_results. Returns rows removed."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        delete(CachedResult).where(CachedResult.expires_at < now)
    )
    await db.commit()
    return result.rowcount or 0
