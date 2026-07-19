import json
import time
import redis
from app.config import settings

class SyncProgressEmitter:
    """Sync counterpart to ProgressEmitter, for use inside Celery tasks
    (which run in a plain sync context, not asyncio)."""

    def __init__(self, run_id: str, redis_channel: str):
        self.run_id = run_id
        self.redis_channel = redis_channel
        self._redis = redis.from_url(settings.REDIS_URL)

    def emit(self, event: str, data: dict):
        payload = {"run_id": self.run_id, "ts": time.time(), **data}
        self._redis.publish(self.redis_channel, json.dumps({"event": event, "data": payload}))
