import asyncio
import time
import logging
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.schemas.research import ResearchRequest, ResearchSource, ResearchResponse
from app.services.search_provider import web_search
from app.services.fetch_service import fetch_url_content
from app.services.extract_service import extract_content
from app.services.rank_service import rank_results
from app.services.ai_service import synthesize_answer, call_llm
import json
from app.auth.api_key_auth import get_current_api_key
from app.middleware.rate_limiter import enforce_rate_limits
from app.middleware.usage_tracker import track_usage
from app.database import get_db
from app.models.api_key import APIKey
from app.models.search_log import SearchLog

logger = logging.getLogger("searchmind.research")
router = APIRouter()

@router.post("/research", response_model=ResearchResponse, tags=["Research"])
async def research(
    request: ResearchRequest,
    http_request: Request,
    api_key: APIKey = Depends(get_current_api_key),
    db: AsyncSession = Depends(get_db)
):
    """
    Perform a deep, parallelized research loop across multiple web sources.
    Searches, crawls top results, extracts content, synthesizes a final answer, and provides citations.
    """
    if getattr(api_key.user, "plan", "free") != "enterprise":
        raise HTTPException(status_code=403, detail="Deep research endpoint is reserved for Enterprise customers.")

    # 1. Rate limiter check
    await enforce_rate_limits(http_request, api_key, db)

    start_time = time.time()

    # 2. Generate sub-queries to query multiple angles
    sub_queries = await generate_sub_queries(request.query)

    # 3. Parallel search queries (Brave → SerpAPI → DuckDuckGo per query)
    search_tasks = [web_search(q, num_results=5) for q in sub_queries]

    search_results_list = await asyncio.gather(*search_tasks, return_exceptions=True)

    # Deduplicate results by URL
    all_results = []
    seen_urls = set()
    for res in search_results_list:
        if isinstance(res, Exception):
            logger.error(f"Parallel search sub-task failed: {res}")
            continue
        for r in res:
            url_norm = r["url"].strip().lower()
            if url_norm not in seen_urls:
                seen_urls.add(url_norm)
                all_results.append(r)

    # 4. Parallel fetch and content extraction for top sources
    extract_tasks = [extract_for_research(r) for r in all_results[:request.max_sources]]
    enriched = await asyncio.gather(*extract_tasks, return_exceptions=True)

    valid_enriched = []
    for r in enriched:
        if isinstance(r, Exception):
            logger.error(f"Parallel content extraction failed: {r}")
            continue
        valid_enriched.append(r)

    # 5. Rank extracted results
    ranked = rank_results(valid_enriched, request.query)[:request.max_sources]

    # 6. Summarize ensembled sources using LLM (await synthesis)
    summary = None
    if request.include_summary and ranked:
        try:
            summary = await synthesize_answer(request.query, ranked, max_tokens=800)
        except Exception as e:
            logger.error(f"Deep Research LLM synthesis failed: {e}")

    # 7. Format sources list
    sources = [
        ResearchSource(
            title=r.get("title", ""),
            url=r.get("url", ""),
            content=r.get("content", "")[:3000],
            score=r.get("score", 0.5),
            source_type=r.get("source_type", "webpage"),
            published_date=r.get("published_date")
        )
        for r in ranked
    ]

    # 8. Track usage stats
    await track_usage(db, api_key, "research", result_count=len(sources))

    # 9. Log research request in DB
    latency = int((time.time() - start_time) * 1000)
    log_entry = SearchLog(
        api_key_id=api_key.id,
        user_id=api_key.user_id,
        endpoint="research",
        query=request.query,
        results_count=len(sources),
        cached=False,
        latency_ms=latency,
        ip_address=http_request.client.host if http_request.client else None,
        user_agent=http_request.headers.get("user-agent"),
        status_code=200
    )
    db.add(log_entry)
    await db.commit()

    return ResearchResponse(
        query=request.query,
        summary=summary,
        sources=sources,
        source_count=len(sources)
    )


async def extract_for_research(result: dict) -> dict:
    """Download and extract clean body content from search result URL."""
    try:
        html = await fetch_url_content(result["url"])
        if html:
            extracted = extract_content(html, result["url"])
            result["content"] = extracted.get("content", "")
            result["author"] = extracted.get("author")
            result["published_date"] = result.get("published_date") or extracted.get("published_date")
    except Exception as e:
        logger.debug(f"Deep research enrichment failed for {result.get('url')}: {e}")
        result["content"] = result.get("snippet", "")
    return result


async def generate_sub_queries(query: str) -> list[str]:
    """Generates expanded queries to research multiple angles of a topic dynamically using LLM."""
    prompt = f"""You are an advanced search agent. Generate exactly 2 semantically diverse and optimized search sub-queries to deeply research the topic: "{query}".
Respond ONLY with a JSON array of strings containing the sub-queries. No explanations, no markdown formatting blocks, just the JSON array.
Example: ["sub-query 1", "sub-query 2"]"""
    
    res = await call_llm(prompt, max_tokens=100)
    if res:
        try:
            # Clean markdown wrappers if any
            clean_res = res.strip()
            if clean_res.startswith("```json"):
                clean_res = clean_res[7:]
            elif clean_res.startswith("```"):
                clean_res = clean_res[3:]
            if clean_res.endswith("```"):
                clean_res = clean_res[:-3]
            clean_res = clean_res.strip()
            
            sub_queries = json.loads(clean_res)
            if isinstance(sub_queries, list) and len(sub_queries) > 0:
                # prepend the original query
                return [query] + [str(q) for q in sub_queries[:2]]
        except Exception as e:
            logger.warning(f"Failed to parse dynamic sub-queries: {e}. Falling back to static expansion.")
    
    # Fallback to static
    return [
        query,
        f"{query} tutorial guide",
        f"{query} examples best practices",
    ]
