from pydantic import BaseModel, Field
from typing import Any, List, Optional


class CrawlRequest(BaseModel):
    url: str = Field(..., description="The seed URL to start crawling from")
    max_depth: int = Field(default=1, ge=1, le=5, description="Maximum crawl depth (restricted to domain)")
    max_pages: int = Field(default=10, ge=1, le=100, description="Maximum pages to crawl")


class CrawlResponse(BaseModel):
    task_id: str
    status: str
    message: str


class CrawlPageResult(BaseModel):
    url: str
    title: Optional[str] = None
    word_count: Optional[int] = None
    success: bool
    error: Optional[str] = None


class CrawlTaskStatusResponse(BaseModel):
    task_id: str
    status: str = Field(..., description="PENDING | STARTED | SUCCESS | FAILURE | REVOKED")
    ready: bool = Field(..., description="True when the task has finished (success or failure)")
    successful: Optional[bool] = None
    seed_url: Optional[str] = None
    pages_crawled: Optional[int] = None
    results: Optional[List[CrawlPageResult]] = None
    error: Optional[str] = None
    result: Optional[Any] = Field(default=None, description="Raw Celery result payload when successful")
