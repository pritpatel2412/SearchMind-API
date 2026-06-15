import httpx
from typing import Optional

_http_client: Optional[httpx.AsyncClient] = None

def get_http_client() -> httpx.AsyncClient:
    """Get or initialize the global async HTTP client."""
    global _http_client
    if _http_client is None:
        limits = httpx.Limits(max_keepalive_connections=20, max_connections=100)
        _http_client = httpx.AsyncClient(limits=limits, timeout=30.0)
    return _http_client

async def close_http_client() -> None:
    """Close the global async HTTP client."""
    global _http_client
    if _http_client is not None:
        await _http_client.aclose()
        _http_client = None
