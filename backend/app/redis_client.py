try:
    import redis.asyncio as redis
except ImportError:
    redis = None

from typing import Optional
from app.config import settings

_redis_client = None

async def get_redis():
    """Get or create a global async Redis client instance with decoding enabled."""
    global _redis_client
    if redis is None:
        return None
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
            socket_timeout=1.0,
            socket_connect_timeout=1.0,
            retry_on_timeout=False
        )
    return _redis_client

async def close_redis() -> None:
    """Close the global async Redis client."""
    global _redis_client
    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None
