from pydantic import BaseModel, Field, HttpUrl
from typing import Optional
from datetime import datetime
from uuid import UUID

class WatchTaskCreate(BaseModel):
    query: str = Field(..., min_length=1, max_length=400)
    webhook_url: HttpUrl
    interval_minutes: int = Field(default=60, ge=1, le=10080)
    search_depth: str = "basic"
    topic: str = "general"

class WatchTaskResponse(BaseModel):
    id: UUID
    user_id: UUID
    query: str
    webhook_url: str
    interval_minutes: int
    is_active: bool
    last_run_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
