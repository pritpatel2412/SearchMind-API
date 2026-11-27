from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, HttpUrl

class SessionCookie(BaseModel):
    name: str = Field(..., description="Cookie name")
    value: str = Field(..., description="Cookie value")
    domain: Optional[str] = Field(None, description="Cookie domain")
    path: str = Field(default="/", description="Cookie path")
    expires: Optional[float] = Field(None, description="UNIX timestamp expiration")
    http_only: bool = Field(default=False, description="Whether cookie is HttpOnly")
    secure: bool = Field(default=False, description="Whether cookie requires HTTPS")
    same_site: Optional[str] = Field(default="Lax", description="'Strict', 'Lax', or 'None'")

class CreateSessionRequest(BaseModel):
    initial_url: Optional[str] = Field(None, description="Optional starting URL to navigate to immediately")
    cookies: Optional[List[SessionCookie]] = Field(default=None, description="Initial authentication cookies to inject into browser vault")
    user_agent: Optional[str] = Field(None, description="Custom User-Agent header")
    viewport: Optional[Dict[str, int]] = Field(default=None, description="Screen dimensions, e.g. {'width': 1280, 'height': 800}")
    ttl_seconds: int = Field(default=1800, ge=60, le=86400, description="Session idle time-to-live in seconds (default 30m, max 24h)")

class InjectCookiesRequest(BaseModel):
    cookies: List[SessionCookie] = Field(..., description="Cookies to inject into active session browser context")

class SessionResponse(BaseModel):
    session_id: str
    status: str = Field(default="active", description="'active', 'idle', or 'closed'")
    created_at: str
    expires_at: str
    current_url: Optional[str] = None
    cookies_count: int = 0
    active: bool = True

class SessionDetailResponse(SessionResponse):
    cookies: List[SessionCookie] = []
    history: List[str] = []
    user_agent: Optional[str] = None
    viewport: Optional[Dict[str, int]] = None
