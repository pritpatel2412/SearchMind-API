import httpx
import json
import logging
from typing import List, Dict, Optional
from app.config import settings

from app.http_client import get_http_client

logger = logging.getLogger("searchmind.ai")

async def call_llm(prompt: str, max_tokens: int = 500) -> Optional[str]:
    """Helper to query the configured OpenAI-compatible LLM endpoint (Groq/NIM/OpenAI)."""
    if not settings.LLM_API_KEY:
        logger.warning("LLM API Key not configured. Returning empty response.")
        return None

    headers = {
        "Authorization": f"Bearer {settings.LLM_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": settings.LLM_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": 0.1
    }

    try:
        url = f"{settings.LLM_BASE_URL.rstrip('/')}/chat/completions"
        client = get_http_client()
        response = await client.post(url, headers=headers, json=payload, timeout=30.0)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    except httpx.HTTPStatusError as e:
        logger.error(f"LLM chat completions request failed: {e}. Response body: {e.response.text}")
        return None
    except Exception as e:
        logger.error(f"LLM chat completions request failed: {e}")
        return None


async def synthesize_answer(query: str, results: List[Dict], max_tokens: int = 500) -> Optional[str]:
    """Synthesize a concise answer using context extracted from search results."""
    if not results:
        return None

    context_parts = []
    for i, r in enumerate(results[:5], 1):
        content = r.get("content") or r.get("snippet") or ""
        context_parts.append(
            f"[Source {i}]: {r.get('title', '')}\nURL: {r.get('url', '')}\n{content[:1500]}"
        )

    context = "\n\n---\n\n".join(context_parts)

    prompt = f"""You are a precise research assistant. Based ONLY on the provided sources, write a concise, factual answer to the query.

Query: {query}

Sources:
{context}

Rules:
- Answer in 2-4 sentences maximum
- Only use information from the sources above
- If sources don't contain enough information, say so clearly
- Do not hallucinate facts not in the sources
- Be direct and informative

Answer:"""

    return await call_llm(prompt, max_tokens)


async def score_relevance_batch(query: str, snippets: List[str]) -> List[float]:
    """Score the relevance of multiple snippets to the query (0.0 to 1.0)."""
    if not snippets:
        return []

    items = "\n".join([f"{i+1}. {s[:300]}" for i, s in enumerate(snippets)])

    prompt = f"""Rate the relevance of each snippet to the query on a scale of 0.0 to 1.0.

Query: {query}

Snippets:
{items}

Respond ONLY with a JSON array of floats, one per snippet, in order. Example: [0.9, 0.3, 0.7]
No explanation, just the JSON array."""

    res = await call_llm(prompt, max_tokens=200)
    if not res:
        return [0.5] * len(snippets)

    try:
        clean_res = res.strip()
        # Clean any markdown block wrappers if present
        if clean_res.startswith("```json"):
            clean_res = clean_res[7:]
        elif clean_res.startswith("```"):
            clean_res = clean_res[3:]
        if clean_res.endswith("```"):
            clean_res = clean_res[:-3]
        clean_res = clean_res.strip()

        scores = json.loads(clean_res)
        return [float(s) for s in scores]
    except Exception as e:
        logger.error(f"Failed to parse LLM relevance scores array: {e}. Output was: {res}")
        return [0.5] * len(snippets)
