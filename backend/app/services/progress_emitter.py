import asyncio
import json
import time
import uuid
from typing import Optional
from app.redis_client import get_redis


class ProgressEmitter:
    """
    Emits pipeline progress events to one of two transports:
      - in-process asyncio.Queue: for search/extract/research, which run
        inside the same FastAPI request/response process.
      - Redis pub/sub channel: for crawl, which runs inside a separate
        Celery worker process and must cross the process boundary.
    Exactly one of `queue` / `redis_channel` should be set.
    """

    def __init__(
        self,
        run_id: Optional[str] = None,
        queue: Optional[asyncio.Queue] = None,
        redis_channel: Optional[str] = None,
    ):
        self.run_id = run_id or str(uuid.uuid4())
        self.queue = queue
        self.redis_channel = redis_channel

    async def emit(self, event: str, data: dict):
        payload = {"run_id": self.run_id, "ts": time.time(), **data}
        if self.queue is not None:
            await self.queue.put((event, payload))
        elif self.redis_channel is not None:
            redis = await get_redis()
            await redis.publish(
                self.redis_channel,
                json.dumps({"event": event, "data": payload}),
            )

    async def close(self):
        if self.queue is not None:
            await self.queue.put(None)  # sentinel: stop the SSE generator
