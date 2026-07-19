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
