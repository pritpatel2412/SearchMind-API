import pytest
import os
import sys

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.highlight_service import extract_dynamic_highlights
from app.schemas.search import SearchRequest, SearchResult, PassageHighlight
from app.schemas.extract import ExtractRequest, ExtractedPage

SAMPLE_DOC = """# Distributed Computing and In-Memory Caching Architecture

### Overview
Modern distributed architectures require multi-layer caching topologies to sustain millions of queries per second.
Without effective caching, backend database instances become saturated by repetitive read traffic.

### In-Memory Redis Tier
The Tier-1 caching layer employs a high-throughput Redis cluster operating in-memory with sub-10ms response latencies.
By keeping hot query results in volatile memory, the system slashes downstream database read overhead by up to 98%.
Automatic expiration thresholds ensure cached records remain fresh without manual invalidation passes.

### Persistent Relational Storage
When an in-memory cache miss occurs, the system falls back to a PostgreSQL relational database.
While relational lookups introduce higher latencies (typically 25-45ms), they provide durable data persistence across server restarts.
Read replicas and connection pooling via PgBouncer ensure sustained transaction throughput under peak burst workloads.

### Autonomous Agent Integration
Autonomous agents querying the infrastructure benefit from token-efficient passage extraction.
Instead of ingesting 10,000 words of background documentation, dynamic highlights extract the exact relevant sentences.
"""

def test_extract_dynamic_highlights_basic():
    query = "Redis in-memory caching cluster latency"
    highlights, savings = extract_dynamic_highlights(
        content=SAMPLE_DOC,
        query=query,
        max_highlights=2,
        strategy="dynamic"
    )
    
    assert len(highlights) > 0
    assert len(highlights) <= 2
    top_highlight = highlights[0]
    assert "redis" in top_highlight.text.lower()
    assert top_highlight.relevance_score > 0.1
    assert top_highlight.char_start is not None
    assert top_highlight.char_end is not None
    assert savings > 50.0  # Should save more than 50% tokens compared to full document

def test_dynamic_highlights_with_headers():
    query = "PostgreSQL relational database persistence"
    highlights, savings = extract_dynamic_highlights(
        content=SAMPLE_DOC,
        query=query,
        max_highlights=1
    )
    
    assert len(highlights) == 1
    assert "postgresql" in highlights[0].text.lower()
    assert highlights[0].section_header == "Persistent Relational Storage"

def test_dynamic_highlights_empty_and_fallback():
    # Empty query
    h_empty, s_empty = extract_dynamic_highlights(content=SAMPLE_DOC, query="")
    assert h_empty == []
    assert s_empty == 0.0

    # Empty content
    h_none, s_none = extract_dynamic_highlights(content="", query="redis")
    assert h_none == []
    assert s_none == 0.0

    # Completely unrelated query
    h_unrelated, _ = extract_dynamic_highlights(content=SAMPLE_DOC, query="quantum entanglement in supercolliders")
    assert len(h_unrelated) == 0

def test_search_request_and_result_schema():
    req = SearchRequest(
        query="Redis cluster caching",
        highlights=True,
        highlight_strategy="dynamic",
        max_highlights=3
    )
    assert req.highlights is True
    assert req.highlight_strategy == "dynamic"
    assert req.max_highlights == 3

    highlight = PassageHighlight(
        text="Redis in-memory cluster latency is sub-10ms.",
        relevance_score=0.92,
        section_header="In-Memory Redis Tier"
    )
    result = SearchResult(
        title="Cache Architecture",
        url="https://example.com/cache",
        content="Full text here...",
        score=0.95,
        highlights=[highlight],
        token_savings_percentage=91.4
    )
    assert result.highlights[0].relevance_score == 0.92
    assert result.token_savings_percentage == 91.4

def test_extract_request_and_page_schema():
    req = ExtractRequest(
        urls=["https://example.com/pricing"],
        query="enterprise pricing",
        highlights=True,
        max_highlights=2
    )
    assert req.query == "enterprise pricing"
    assert req.highlights is True
    assert req.max_highlights == 2

    page = ExtractedPage(
        url="https://example.com/pricing",
        content="Full pricing documentation...",
        word_count=500,
        extraction_method="trafilatura",
        success=True,
        highlights=[
            PassageHighlight(text="Enterprise tier is $499/mo.", relevance_score=0.88)
        ],
        token_savings_percentage=92.5
    )
    assert len(page.highlights) == 1
    assert page.token_savings_percentage == 92.5

if __name__ == "__main__":
    print("Running dynamic highlights tests directly...")
    test_extract_dynamic_highlights_basic()
    print("PASS: test_extract_dynamic_highlights_basic")
    test_dynamic_highlights_with_headers()
    print("PASS: test_dynamic_highlights_with_headers")
    test_dynamic_highlights_empty_and_fallback()
    print("PASS: test_dynamic_highlights_empty_and_fallback")
    test_search_request_and_result_schema()
    print("PASS: test_search_request_and_result_schema")
    test_extract_request_and_page_schema()
    print("PASS: test_extract_request_and_page_schema")
    print("ALL 5 TESTS PASSED SUCCESSFULLY!")
