from pydantic import BaseModel, Field
from typing import List, Optional

# --- Search Models ---

class SearchResult(BaseModel):
    title: str
    url: str
    content: str
    score: float
    published_date: Optional[str] = None
    source_type: str = "webpage"
    author: Optional[str] = None


class Citation(BaseModel):
    index: int
    title: str
    url: str
    score: float


class SearchResponse(BaseModel):
    query: str
    answer: Optional[str] = None
    results: List[SearchResult]
    citations: List[Citation] = []
    result_count: int
    cached: bool = False
    search_depth: str = "basic"
    response_time_ms: Optional[int] = None


# --- Extract Models ---

class ExtractedPage(BaseModel):
    url: str
    title: Optional[str] = None
    content: str
    author: Optional[str] = None
    published_date: Optional[str] = None
    language: Optional[str] = None
    word_count: int
    extraction_method: str
    success: bool
    error: Optional[str] = None


class ExtractResponse(BaseModel):
    results: List[ExtractedPage]
    extracted_count: int
    failed_count: int


# --- Research Models ---

class ResearchSource(BaseModel):
    title: str
    url: str
    content: str
    score: float
    source_type: str
    published_date: Optional[str] = None


class ResearchResponse(BaseModel):
    query: str
    summary: Optional[str] = None
    sources: List[ResearchSource]
    source_count: int


# --- Usage Models ---

class UsageResponse(BaseModel):
    period: str
    search_count: int
    extract_count: int
    crawl_count: int
    research_count: int
    total_requests: int
    total_tokens: int
    monthly_limit: int
    remaining_requests: int
    percentage_used: float
