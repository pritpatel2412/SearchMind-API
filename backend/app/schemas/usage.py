from pydantic import BaseModel

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
