from celery import Celery
from app.config import settings

# Initialize Celery app with Redis broker and backend
celery_app = Celery(
    "searchmind_workers",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.tasks"]
)

# Configuration overrides
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour max time limit for deep crawl tasks
)
