import asyncio
import hashlib
import json
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.search_provider import web_search
from app.services.fetch_service import fetch_url_content
from app.services.extract_service import extract_content
from app.services.rank_service import rank_results
from app.services.ai_service import synthesize_answer
from app.services.cache_service import get_cached, set_cached
from app.services.safety_service import filter_safe_results
from app.schemas.search import SearchRequest, SearchResponse, SearchResult
from app.config import settings

logger = logging.getLogger("searchmind.search_service")

async def perform_search(req: SearchRequest, db: Optional[AsyncSession] = None) -> SearchResponse:
    """Core search pipeline: cache-lookup -> search -> enrich -> safety-filter -> rank -> synthesize."""
    
    # 1. Cache key generation
    cache_payload = {
        "query": req.query, 
        "num_results": req.num_results,
        "search_depth": req.search_depth, 
        "include_domains": req.include_domains,
        "exclude_domains": req.exclude_domains, 
        "topic": req.topic
    }
    cache_key = "search:" + hashlib.sha256(json.dumps(cache_payload, sort_keys=True).encode()).hexdigest()

    try:
        cached = await get_cached(cache_key, db=db)
        if cached:
            cached["cached"] = True
            return SearchResponse(**cached)
    except Exception as e:
        logger.error(f"Error checking cache: {e}")

    # 2. Get search results (Brave → SerpAPI → DuckDuckGo)
    raw_results = await web_search(
        query=req.query,
        num_results=req.num_results + 5,  # Fetch extra to allow filtering
        freshness=req.time_range,
    )

    # 3. Filter by include/exclude domains
    if req.include_domains:
        raw_results = [r for r in raw_results if any(d in r["url"] for d in req.include_domains)]
    if req.exclude_domains:
        raw_results = [r for r in raw_results if not any(d in r["url"] for d in req.exclude_domains)]

    # 4. Safety filtering
    raw_results = filter_safe_results(raw_results)

    # 5. Fetch + extract content (if advanced/deep search)
    if req.search_depth == "advanced":
        tasks = [enrich_result(r) for r in raw_results[:req.num_results]]
        raw_results = await asyncio.gather(*tasks)
    else:
        for r in raw_results:
            r["content"] = r.get("snippet", "")

    # 6. Rank results
    ranked = rank_results(raw_results, req.query)[:req.num_results]

    # 7. AI answer synthesis (if requested and we have results)
    answer = None
    if req.include_answer and ranked:
        try:
            answer = await synthesize_answer(req.query, ranked)
        except Exception as e:
            logger.error(f"AI Synthesis failed: {e}")

    # 8. Build citations
    citations = build_citations(ranked) if req.include_raw_content else []

    # 9. Assemble response model
    search_results = [
        SearchResult(
            title=r.get("title", ""),
            url=r.get("url", ""),
            content=r.get("content", ""),
            score=r.get("score", 0.5),
            published_date=r.get("published_date"),
            source_type=r.get("source_type", "webpage"),
            author=r.get("author")
        )
        for r in ranked
    ]

    response = SearchResponse(
        query=req.query,
        answer=answer,
        results=search_results,
        citations=citations,
        cached=False,
        result_count=len(search_results),
        search_depth=req.search_depth.value
    )

    # 10. Cache the response
    try:
        await set_cached(
            cache_key, response.model_dump(), ttl=settings.SEARCH_CACHE_TTL, db=db
        )
    except Exception as e:
        logger.error(f"Error storing in cache: {e}")

    return response


async def enrich_result(result: dict) -> dict:
    """Fetch and extract content for a single result."""
    try:
        html = await fetch_url_content(result["url"])
        if html:
            extracted = extract_content(html, result["url"])
            result.update({
                "content": extracted.get("content", result.get("snippet", "")),
                "author": extracted.get("author"),
                "published_date": result.get("published_date") or extracted.get("published_date"),
                "extraction_method": extracted.get("extraction_method")
            })
    except Exception as e:
        logger.debug(f"Failed to enrich result for {result.get('url')}: {e}")
        result["content"] = result.get("snippet", "")
    return result


def build_citations(results: list) -> list:
    """Creates index citation references for search results."""
    return [
        {"index": i + 1, "title": r.get("title", ""), "url": r.get("url", ""), "score": r.get("score", 0.5)}
        for i, r in enumerate(results)
    ]
