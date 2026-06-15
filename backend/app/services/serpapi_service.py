import httpx
import logging
from typing import Optional
from app.config import settings

from app.http_client import get_http_client

logger = logging.getLogger("searchmind.serpapi")
SERPAPI_URL = "https://serpapi.com/search"

async def serpapi_search(
    query: str,
    num_results: int = 10,
    engine: str = "google",
    gl: str = "us",
    hl: str = "en"
) -> list[dict]:
    """Queries SerpAPI organic results. Returns empty list if key is missing or request fails."""
    if not settings.SERPAPI_KEY:
        logger.warning("SerpAPI Key not configured. Skipping SerpAPI search.")
        return []

    params = {
        "q": query,
        "engine": engine,
        "api_key": settings.SERPAPI_KEY,
        "num": num_results,
        "gl": gl,
        "hl": hl
    }

    try:
        client = get_http_client()
        response = await client.get(SERPAPI_URL, params=params, timeout=10.0)
        response.raise_for_status()
        data = response.json()

        results = []
        for item in data.get("organic_results", []):
            results.append({
                "title": item.get("title", ""),
                "url": item.get("link", ""),
                "snippet": item.get("snippet", ""),
                "published_date": item.get("date"),
                "language": hl,
                "family_friendly": True,
                "source": f"serpapi_{engine}"
            })
        return results
    except Exception as e:
        logger.error(f"SerpAPI search request failed: {e}")
        return []
