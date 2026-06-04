import logging
from typing import Optional

from app.config import settings
from app.services.brave_service import brave_search
from app.services.serpapi_service import serpapi_search
from app.services.ddg_service import ddg_search

logger = logging.getLogger("searchmind.search_provider")


async def web_search(
    query: str,
    num_results: int = 10,
    freshness: Optional[str] = None,
) -> list[dict]:
    """
    Search the web using provider fallback chain: Brave → SerpAPI → DuckDuckGo.
    Returns the first non-empty result set, or an empty list if all providers fail.
    """
    raw_results: list[dict] = []

    if settings.BRAVE_API_KEY:
        try:
            raw_results = await brave_search(
                query=query,
                num_results=num_results,
                freshness=freshness,
            )
            if raw_results:
                logger.debug("Search served by Brave (%d results)", len(raw_results))
                return raw_results
        except Exception as e:
            logger.error("Brave search failed: %s", e)

    if settings.SERPAPI_KEY:
        try:
            raw_results = await serpapi_search(query=query, num_results=num_results)
            if raw_results:
                logger.debug("Search served by SerpAPI (%d results)", len(raw_results))
                return raw_results
        except Exception as e:
            logger.error("SerpAPI search failed: %s", e)

    try:
        raw_results = await ddg_search(
            query=query,
            num_results=num_results,
            time_range=freshness,
        )
        if raw_results:
            logger.debug("Search served by DuckDuckGo (%d results)", len(raw_results))
        else:
            logger.warning("All search providers returned no results for query: %s", query)
    except Exception as e:
        logger.error("DuckDuckGo search failed: %s", e)

    return raw_results
