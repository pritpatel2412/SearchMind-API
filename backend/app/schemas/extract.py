from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
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

class SchemaExtractRequest(BaseModel):
    url: Optional[str] = Field(default=None, description="URL of target web page to scrape and extract from")
    html: Optional[str] = Field(default=None, description="Raw HTML string if already fetched")
    schema_definition: Dict[str, Any] = Field(..., alias="schema", description="Target JSON Schema specification defining expected structure")
    system_prompt: Optional[str] = Field(default=None, description="Custom instruction guidance for the extraction model")
    use_js_rendering: bool = Field(default=False, description="Whether to execute client-side JavaScript via headless Chromium")
    temperature: float = Field(default=0.0, ge=0.0, le=1.0)
    max_tokens: int = Field(default=2000, ge=100, le=8000)

class SchemaExtractResponse(BaseModel):
    url: Optional[str] = None
    data: Dict[str, Any] = Field(..., description="Extracted structured JSON entity matching the requested schema")
    validation_status: str = Field(default="valid", description="'valid', 'validation_warning', or 'error'")
    validation_errors: Optional[List[str]] = None
    execution_time_ms: int
    tokens_used: int = 0
    cached: bool = False
