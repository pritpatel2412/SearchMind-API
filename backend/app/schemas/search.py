from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

class SearchDepth(str, Enum):
    basic = "basic"
    advanced = "advanced"

class SearchTopic(str, Enum):
    general = "general"
    news = "news"
    finance = "finance"
    science = "science"
    technology = "technology"

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=400, description="Search query")
    num_results: int = Field(default=5, ge=1, le=20, description="Number of results to return")
    search_depth: SearchDepth = Field(default=SearchDepth.basic)
    topic: SearchTopic = Field(default=SearchTopic.general)
    include_answer: bool = Field(default=True)
    include_raw_content: bool = Field(default=False)
    include_domains: Optional[List[str]] = Field(default=None)
    exclude_domains: Optional[List[str]] = Field(default=None)
    time_range: Optional[str] = Field(default=None, description="pd=day, pw=week, pm=month, py=year")
    max_content_length: int = Field(default=2000, ge=100, le=10000)
    vectorize: bool = Field(default=False, description="If true, returns semantic chunks and embeddings")
    extract_images: bool = Field(default=False, description="If true, uses Vision models to transcribe images into text")
    highlights: bool = Field(default=False, description="If true, extracts query-relevant dynamic passage highlights")
    highlight_strategy: str = Field(default="dynamic", description="Highlight strategy: 'dynamic' or 'fixed'")
    max_highlights: int = Field(default=3, ge=1, le=10, description="Maximum number of passage highlights per document")

class PassageHighlight(BaseModel):
    text: str
    relevance_score: float
    section_header: Optional[str] = None
    char_start: Optional[int] = None
    char_end: Optional[int] = None

class SearchResult(BaseModel):
    title: str
    url: str
    content: str
    score: float
    published_date: Optional[str] = None
    source_type: str = "webpage"
    author: Optional[str] = None
    extraction_status: str = "ok"
    vectors: Optional[List[dict]] = None
    highlights: Optional[List[PassageHighlight]] = None
    token_savings_percentage: Optional[float] = None

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
