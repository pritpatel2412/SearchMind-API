from pydantic import BaseModel
from typing import Optional, List

class ResearchRequest(BaseModel):
    query: str
    max_sources: int = 10
    search_depth: str = "advanced"
    include_summary: bool = True

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
