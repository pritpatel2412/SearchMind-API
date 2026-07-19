import asyncio
import os
import sys
from unittest.mock import patch

# Ensure environment variables are set for testing
os.environ["SEARCHMIND_API_KEY"] = "test-api-key"
os.environ["SEARCHMIND_API_URL"] = "http://localhost:8000/v1"

# Import tools
try:
    import server
except ImportError:
    print("Failed to import MCP server tools. Make sure you are in the mcp-server directory.")
    sys.exit(1)

async def mock_make_request(endpoint: str, payload: dict) -> dict:
    if endpoint == "search":
        return {
            "answer": "This is a mock answer.",
            "results": [
                {"title": "Result 1", "url": "http://example.com/1", "content": "Content 1"}
            ]
        }
    elif endpoint == "research":
        return {
            "summary": "This is a mock research summary.",
            "sources": [
                {"title": "Source 1", "url": "http://example.com/s1"}
            ]
        }
    elif endpoint == "extract":
        return {
            "title": "Extracted Title",
            "author": "Mock Author",
            "content": "This is the extracted markdown content."
        }
    elif endpoint == "crawl":
        return {
            "task_id": "mock-task-123",
            "message": "Crawl queued successfully"
        }
    return {}

async def test_all():
    print("=== Testing Search Web ===")
    res1 = await server.search_web("What is MCP?", num_results=2, search_depth="basic")
    print(res1)
    
    print("\n=== Testing Deep Research ===")
    res2 = await server.deep_research("How does MCP work?", max_sources=2)
    print(res2)

    print("\n=== Testing Extract Page ===")
    res3 = await server.extract_page("https://example.com")
    print(res3)
    
    print("\n=== Testing Crawl Domain ===")
    res4 = await server.crawl_domain("https://example.com", max_depth=0)
    print(res4)
    
if __name__ == "__main__":
    # Monkeypatch the internal request function
    server._make_request = mock_make_request
    asyncio.run(test_all())
