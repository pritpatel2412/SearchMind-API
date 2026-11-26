from pydantic import BaseModel, Field
from typing import Optional, List
from app.schemas.search import PassageHighlight

class ExtractRequest(BaseModel):
    urls: List[str]
    use_js_rendering: bool = False
    max_content_length: int = 5000
    vectorize: bool = False
    extract_images: bool = False
    query: Optional[str] = Field(default=None, description="Optional search query to isolate relevant highlights")
    highlights: bool = Field(default=False, description="Extract query-relevant dynamic passage highlights")
    highlight_strategy: str = Field(default="dynamic", description="Highlight strategy: 'dynamic' or 'fixed'")
    max_highlights: int = Field(default=3, ge=1, le=10, description="Max highlights to return per page")

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
    vectors: Optional[List[dict]] = None
    highlights: Optional[List[PassageHighlight]] = None
    token_savings_percentage: Optional[float] = None

class ExtractResponse(BaseModel):
    results: List[ExtractedPage]
    extracted_count: int
    failed_count: int
