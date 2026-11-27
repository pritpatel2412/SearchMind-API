from pydantic import BaseModel, Field
from typing import List, Optional

# --- Shared Models ---

class PassageHighlight(BaseModel):
    text: str
    relevance_score: float
    section_header: Optional[str] = None
    char_start: Optional[int] = None
    char_end: Optional[int] = None

# --- Search Models ---

class SearchResult(BaseModel):
    title: str
    url: str
    content: str
    score: float
    published_date: Optional[str] = None
    source_type: str = "webpage"
    author: Optional[str] = None
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
    highlights: Optional[List[PassageHighlight]] = None
    token_savings_percentage: Optional[float] = None


class ExtractResponse(BaseModel):
    results: List[ExtractedPage]
    extracted_count: int
    failed_count: int


class SchemaExtractResponse(BaseModel):
    url: Optional[str] = None
    data: dict
    validation_status: str = "valid"
    validation_errors: Optional[List[str]] = None
    execution_time_ms: int
    tokens_used: int = 0
    cached: bool = False


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


# --- Map Models ---

class MapLinkMetadata(BaseModel):
    url: str
    lastmod: Optional[str] = None
    changefreq: Optional[str] = None
    priority: Optional[float] = None


class MapResponse(BaseModel):
    success: bool = True
    links: List[str]
    links_metadata: Optional[List[MapLinkMetadata]] = None
    total_links: int
    sitemap_found: bool
    execution_time_ms: int
    cached: bool = False


# --- Session & Action Models ---

class SessionCookie(BaseModel):
    name: str
    value: str
    domain: Optional[str] = None
    path: str = "/"
    expires: Optional[float] = None
    http_only: bool = False
    secure: bool = False
    same_site: Optional[str] = "Lax"


class SessionResponse(BaseModel):
    session_id: str
    status: str = "active"
    created_at: str
    expires_at: str
    current_url: Optional[str] = None
    cookies_count: int = 0
    active: bool = True


class SessionDetailResponse(SessionResponse):
    cookies: List[SessionCookie] = []
    history: List[str] = []
    user_agent: Optional[str] = None
    viewport: Optional[dict] = None


class ActionResponse(BaseModel):
    url: str
    final_html: str
    extracted_content: Optional[str] = None
    screenshot_base64: Optional[str] = None
    success: bool
    error: Optional[str] = None
    session_id: Optional[str] = None


class InstructActionResponse(BaseModel):
    url: str
    instruction: str
    action_type: str
    target_selector: Optional[str] = None
    target_description: Optional[str] = None
    final_html: str
    extracted_content: Optional[str] = None
    screenshot_base64: Optional[str] = None
    session_id: Optional[str] = None
    success: bool
    error: Optional[str] = None
    self_healed: bool = False


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
