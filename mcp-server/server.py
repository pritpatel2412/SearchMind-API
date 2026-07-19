import os
import httpx
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# Configure FastMCP server
mcp = FastMCP("SearchMind", description="SearchMind API MCP Server for AI Web Search, Deep Research, and Web Crawling")

# Configuration
API_KEY = os.getenv("SEARCHMIND_API_KEY", "")
BASE_URL = os.getenv("SEARCHMIND_API_URL", "http://localhost:8000/v1")

if not API_KEY:
    print("WARNING: SEARCHMIND_API_KEY environment variable is not set. MCP tools may fail if the API requires authentication.")

def _get_headers() -> dict:
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

async def _make_request(endpoint: str, payload: dict) -> dict:
    """Helper to make async requests to SearchMind API."""
    url = f"{BASE_URL}/{endpoint}"
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(url, headers=_get_headers(), json=payload)
        response.raise_for_status()
        return response.json()


@mcp.tool()
async def search_web(query: str, num_results: int = 5, search_depth: str = "basic") -> str:
    """
    Perform an AI-optimized web search. Returns synthesized answers and extracted results.
    
    Args:
        query: The search query to execute.
        num_results: Number of results to return (max 20).
        search_depth: 'basic' (fast) or 'advanced' (deep extraction & AI synthesis).
    """
    try:
        payload = {
            "query": query,
            "num_results": num_results,
            "search_depth": search_depth,
            "include_answer": True
        }
        data = await _make_request("search", payload)
        
        output = [f"--- Search Results for '{query}' ---"]
        if data.get("answer"):
            output.append(f"\nAI Synthesis:\n{data['answer']}\n")
            
        for idx, res in enumerate(data.get("results", [])):
            output.append(f"[{idx+1}] {res.get('title')} ({res.get('url')})")
            content = res.get("content") or res.get("snippet") or ""
            # Truncate content slightly for MCP if it's too huge
            output.append(f"Content:\n{content[:2000]}...\n")
            
        return "\n".join(output)
    except httpx.HTTPError as e:
        return f"Error executing search_web: {str(e)}"
    except Exception as e:
        return f"Unexpected error: {str(e)}"


@mcp.tool()
async def deep_research(query: str, max_sources: int = 5) -> str:
    """
    Perform a deep, parallelized research loop across multiple web sources. 
    Searches, crawls top results, extracts content, and synthesizes a final answer.
    
    Args:
        query: The deep research query to execute.
        max_sources: Max number of top sources to deeply analyze.
    """
    try:
        payload = {
            "query": query,
            "max_sources": max_sources,
            "include_summary": True
        }
        data = await _make_request("research", payload)
        
        output = [f"--- Deep Research Results for '{query}' ---"]
        if data.get("summary"):
            output.append(f"\nResearch Summary:\n{data['summary']}\n")
            
        for idx, src in enumerate(data.get("sources", [])):
            output.append(f"[{idx+1}] {src.get('title')} ({src.get('url')})")
            
        return "\n".join(output)
    except httpx.HTTPError as e:
        if e.response and e.response.status_code == 403:
            return "Error: Deep research endpoint is reserved for Enterprise customers (403 Forbidden)."
        return f"Error executing deep_research: {str(e)}"
    except Exception as e:
        return f"Unexpected error: {str(e)}"


@mcp.tool()
async def extract_page(url: str, bypass_cache: bool = False) -> str:
    """
    Download and extract clean body content from any URL, bypassing paywalls and JS-rendering.
    
    Args:
        url: The web page URL to extract.
        bypass_cache: If true, forces a fresh scrape instead of using cached results.
    """
    try:
        payload = {
            "url": url,
            "bypass_cache": bypass_cache
        }
        data = await _make_request("extract", payload)
        
        output = []
        if data.get("title"):
            output.append(f"# {data['title']}")
        if data.get("author"):
            output.append(f"Author: {data['author']}")
            
        output.append("\n" + data.get("content", "No content found."))
        return "\n".join(output)
    except httpx.HTTPError as e:
        return f"Error executing extract_page: {str(e)}"
    except Exception as e:
        return f"Unexpected error: {str(e)}"


@mcp.tool()
async def crawl_domain(url: str, max_depth: int = 1, max_pages: int = 50) -> str:
    """
    Kick off an asynchronous domain crawl. Returns the task ID for monitoring.
    
    Args:
        url: The root URL to start crawling from.
        max_depth: How deep to follow internal links (0 = only the seed page).
        max_pages: Maximum number of pages to crawl overall.
    """
    try:
        payload = {
            "url": url,
            "max_depth": max_depth,
            "max_pages": max_pages
        }
        data = await _make_request("crawl", payload)
        
        task_id = data.get("task_id")
        msg = data.get("message")
        return f"Crawl started successfully.\nTask ID: {task_id}\nMessage: {msg}\nYou can check status manually if needed via the SearchMind API."
    except httpx.HTTPError as e:
        return f"Error executing crawl_domain: {str(e)}"
    except Exception as e:
        return f"Unexpected error: {str(e)}"

if __name__ == "__main__":
    # Start the server (stdio by default)
    mcp.run()
