import asyncio
import logging
from typing import Optional
from duckduckgo_search import DDGS

logger = logging.getLogger("searchmind.ddg")

async def ddg_search(
    query: str,
    num_results: int = 10,
    time_range: Optional[str] = None
) -> list[dict]:
    """
    Query DuckDuckGo for search results (no API key required).
    Runs the blocking duckduckgo_search calls in a separate thread.
    
    Time range options:
    - pd: day -> 'd'
    - pw: week -> 'w'
    - pm: month -> 'm'
    - py: year -> 'y'
    """
    timelimit = None
    if time_range:
        mapping = {"pd": "d", "pw": "w", "pm": "m", "py": "y"}
        timelimit = mapping.get(time_range, time_range)

    def blocking_search():
        try:
            with DDGS() as ddgs:
                ddg_results = ddgs.text(
                    keywords=query,
                    max_results=num_results,
                    timelimit=timelimit
                )
                return list(ddg_results)
        except Exception as e:
            logger.error(f"Error executing DuckDuckGo search: {e}")
            return []

    results = []
    try:
        raw_results = await asyncio.to_thread(blocking_search)
        for item in raw_results:
            results.append({
                "title": item.get("title", ""),
                "url": item.get("href", ""),
                "snippet": item.get("body", ""),
                "published_date": None,
                "language": None,
                "family_friendly": True,
                "source": "duckduckgo"
            })
    except Exception as e:
        logger.error(f"Failed to fetch DuckDuckGo results: {e}")
        
    return results
