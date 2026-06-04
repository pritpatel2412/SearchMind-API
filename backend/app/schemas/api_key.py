from pydantic import BaseModel
from typing import Optional

class CreateAPIKeyRequest(BaseModel):
    name: str
    monthly_limit: Optional[int] = None
    rate_limit_per_min: Optional[int] = None

class APIKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    monthly_limit: int
    rate_limit_per_min: int
    is_active: bool
    created_at: str
    last_used_at: Optional[str] = None
    full_key: Optional[str] = None  # Only on creation
    total_requests: int = 0
