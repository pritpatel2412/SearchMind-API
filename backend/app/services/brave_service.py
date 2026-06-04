import httpx
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger("searchmind.brave")
BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search"

async def brave_search(
    query: str,
    num_results: int = 10,
    country: str = "US",
    search_lang: str = "en",
    freshness: Optional[str] = None,   # "pd" | "pw" | "pm" | "py"
    safe_search: str = "moderate"
) -> list[dict]:
    """Queries Brave Search API. Returns empty list if key is missing or request fails."""
    if not settings.BRAVE_API_KEY:
        logger.warning("Brave API Key not configured. Skipping Brave search.")
        return []

    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": settings.BRAVE_API_KEY
    }
    params = {
        "q": query,
        "count": min(num_results, 20),
        "country": country,
        "search_lang": search_lang,
        "safe_search": safe_search,
        "text_decorations": False,
        "spellcheck": True
    }
    if freshness:
        params["freshness"] = freshness

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(BRAVE_SEARCH_URL, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()

        results = []
        for item in data.get("web", {}).get("results", []):
            results.append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "snippet": item.get("description", ""),
                "published_date": item.get("page_age"),
                "language": item.get("language"),
                "family_friendly": item.get("family_friendly", True),
                "source": "brave"
            })
        return results
    except Exception as e:
        logger.error(f"Brave search request failed: {e}")
        return []
