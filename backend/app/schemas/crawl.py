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


class MapLinkMetadata(BaseModel):
    url: str
    lastmod: Optional[str] = None
    changefreq: Optional[str] = None
    priority: Optional[float] = None


class MapRequest(BaseModel):
    url: str = Field(..., description="Target domain or base URL to map (e.g. 'https://docs.stripe.com')")
    search: Optional[str] = Field(default=None, description="Optional regex or keyword filter to select only matching URLs")
    ignore_sitemap: bool = Field(default=False, description="Whether to bypass sitemap discovery and crawl topological link graph directly")
    include_subdomains: bool = Field(default=False, description="Whether to include links pointing to sibling subdomains")
    limit: int = Field(default=5000, ge=1, le=25000, description="Maximum links to extract and return")


class MapResponse(BaseModel):
    success: bool = True
    links: List[str] = Field(..., description="List of resolved distinct URLs in site topology")
    links_metadata: Optional[List[MapLinkMetadata]] = Field(default=None, description="Detailed sitemap metadata (lastmod, changefreq, priority)")
    total_links: int
    sitemap_found: bool
    execution_time_ms: int
    cached: bool = False
