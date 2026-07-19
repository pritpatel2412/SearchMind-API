from pydantic import BaseModel
from typing import Optional, List

class ExtractRequest(BaseModel):
    urls: List[str]
    use_js_rendering: bool = False
    max_content_length: int = 5000
    vectorize: bool = False

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

class ExtractResponse(BaseModel):
    results: List[ExtractedPage]
    extracted_count: int
    failed_count: int
