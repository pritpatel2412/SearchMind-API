# SearchMind Python SDK

Official Python client for the SearchMind API Platform -- a developer-first, AI-native web search API built for LLM agent pipelines, LangChain, LangGraph, and Retrieval-Augmented Generation (RAG) workflows.

The SDK provides synchronous and asynchronous interfaces for all SearchMind endpoints, with built-in LangGraph and LangChain tool adapters for direct agent integration.

---

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Async Usage](#async-usage)
- [Agent Integrations](#agent-integrations)
- [Error Handling](#error-handling)
- [Configuration](#configuration)
- [Development](#development)

---

## Installation

Install the SDK from the local package:

```bash
cd sdk
pip install -e .
```

To install with LangChain support:

```bash
pip install -e ".[langchain]"
```

To install with development tools:

```bash
pip install -e ".[dev]"
```

### Requirements

- Python 3.9 or higher
- httpx >= 0.23.0
- pydantic >= 2.0.0

---

## Quick Start

### Basic Search

```python
from searchmind import SearchMindClient

# Initialize client
# Defaults to http://localhost:8000/v1 if SEARCHMIND_BASE_URL is not set
client = SearchMindClient(api_key="sm_live_...")

# Perform a basic search (snippets only, fast)
response = client.search(
    query="FastAPI async best practices",
    num_results=5,
    search_depth="basic",
    include_answer=True
)

print("Answer:", response.answer)
for result in response.results:
    print(f"  {result.title} ({result.url})")
    print(f"  Score: {result.score:.2f}")
```

### Advanced Search (Full Content Extraction)

```python
# Advanced search fetches and extracts full page content
response = client.search(
    query="LangGraph state machine patterns",
    num_results=3,
    search_depth="advanced",
    topic="technology",
    include_answer=True
)

# Results contain full extracted content, not just snippets
for result in response.results:
    print(f"Title: {result.title}")
    print(f"Content length: {len(result.content)} chars")
    print(f"Author: {result.author}")
```

### Domain Filtering

```python
# Include only specific domains
response = client.search(
    query="machine learning tutorials",
    include_domains=["arxiv.org", "huggingface.co"],
    num_results=5
)

# Exclude specific domains
response = client.search(
    query="Python web frameworks",
    exclude_domains=["w3schools.com", "geeksforgeeks.org"],
    num_results=5
)
```

### Content Extraction (Pro Plan Required)

```python
# Extract clean text and metadata from one or more URLs
extracted = client.extract(
    urls=[
        "https://example.com/article-1",
        "https://example.com/article-2"
    ],
    use_js_rendering=False,
    max_content_length=5000
)

print(f"Extracted: {extracted.extracted_count}, Failed: {extracted.failed_count}")
for page in extracted.results:
    if page.success:
        print(f"  {page.title}: {page.word_count} words")
```

### Deep Research (Enterprise Plan Required)

```python
# Deep research generates sub-queries, searches in parallel,
# extracts content from top sources, and synthesizes a summary
research = client.research(
    query="Comparison of vector databases for production RAG systems in 2026",
    max_sources=10,
    include_summary=True
)

print("Summary:", research.summary)
print(f"Sources analyzed: {research.source_count}")
for source in research.sources:
    print(f"  [{source.score:.2f}] {source.title} -- {source.url}")
```

### Usage Statistics

```python
# Get current billing period usage
usage = client.get_usage()

print(f"Period: {usage.period}")
print(f"Search: {usage.search_count}")
print(f"Extract: {usage.extract_count}")
print(f"Crawl: {usage.crawl_count}")
print(f"Research: {usage.research_count}")
print(f"Total: {usage.total_requests} / {usage.monthly_limit}")
print(f"Remaining: {usage.remaining_requests}")
print(f"Usage: {usage.percentage_used}%")
```

---

## API Reference

### SearchMindClient

```python
SearchMindClient(
    api_key: str = None,       # API key (or set SEARCHMIND_API_KEY env var)
    base_url: str = None,      # Base URL (or set SEARCHMIND_BASE_URL env var)
    timeout: float = 60.0      # Request timeout in seconds
)
```

### Methods

| Method | Description | Plan Required |
|--------|-------------|---------------|
| `search(query, ...)` | Web search with optional AI answer | All |
| `extract(urls, ...)` | Clean content extraction from URLs | Pro+ |
| `research(query, ...)` | Deep multi-source research | Enterprise |
| `get_usage()` | Current period usage statistics | All |
| `async_search(query, ...)` | Async version of search | All |
| `async_extract(urls, ...)` | Async version of extract | Pro+ |
| `async_research(query, ...)` | Async version of research | Enterprise |
| `async_get_usage()` | Async version of get_usage | All |
| `close()` | Close synchronous HTTP client | -- |
| `aclose()` | Close asynchronous HTTP client | -- |

### search() Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | str | required | The search query |
| `num_results` | int | 5 | Number of results to return |
| `search_depth` | str | "basic" | "basic" (snippets) or "advanced" (full content) |
| `include_answer` | bool | True | Generate an AI-synthesized answer |
| `topic` | str | "general" | Topic hint for relevance tuning |
| `include_domains` | list | None | Only include results from these domains |
| `exclude_domains` | list | None | Exclude results from these domains |
| `time_range` | str | None | Filter by recency |
| `max_content_length` | int | 2000 | Maximum content length per result |

### extract() Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `urls` | list | required | URLs to extract (max 10 per request) |
| `use_js_rendering` | bool | False | Enable Playwright headless browser for JS-rendered pages |
| `max_content_length` | int | 5000 | Maximum extracted content length per URL |

### research() Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | str | required | The research topic |
| `max_sources` | int | 10 | Maximum number of sources to analyze |
| `include_summary` | bool | True | Generate an LLM synthesis summary |

---

## Async Usage

All methods have async counterparts prefixed with `async_`:

```python
import asyncio
from searchmind import SearchMindClient

async def main():
    client = SearchMindClient(api_key="sm_live_...")

    # Async search
    result = await client.async_search("What is new in Python 3.13?")
    print(result.answer)

    # Async extract
    extracted = await client.async_extract(["https://example.com"])
    print(extracted.results[0].content[:200])

    # Async usage
    usage = await client.async_get_usage()
    print(f"Used: {usage.total_requests}/{usage.monthly_limit}")

    await client.aclose()

asyncio.run(main())
```

The client supports context managers for automatic cleanup:

```python
with SearchMindClient(api_key="sm_live_...") as client:
    result = client.search("query")
    print(result.answer)
# Client is automatically closed
```

---

## Agent Integrations

### LangGraph

The SDK provides `create_searchmind_tools()` which generates strongly-typed `StructuredTool` objects with Pydantic schemas, compatible with LangGraph's tool calling requirements.

```python
import os
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from searchmind import SearchMindClient
from searchmind.langgraph_tool import create_searchmind_tools

client = SearchMindClient(api_key=os.environ["SEARCHMIND_API_KEY"])
tools = create_searchmind_tools(client)

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
agent = create_react_agent(llm, tools)

# The agent will autonomously decide when to use SearchMind
result = agent.invoke({
    "messages": [("user", "Compare modern vector databases for production use")]
})
```

### LangChain

The SDK provides `SearchMindSearchTool` which implements the LangChain `BaseTool` interface.

```python
from searchmind import SearchMindClient
from searchmind.langchain_tool import SearchMindSearchTool

client = SearchMindClient(api_key="sm_live_...")
tool = SearchMindSearchTool(client=client)

# Use as a standalone tool
result = tool.invoke("latest FastAPI best practices")

# Or include in a LangChain agent's tool list
from langchain.agents import initialize_agent, AgentType
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini")
agent = initialize_agent(
    tools=[tool],
    llm=llm,
    agent=AgentType.STRUCTURED_CHAT_ZERO_SHOT_REACT_DESCRIPTION
)
```

---

## Error Handling

The SDK raises specific exceptions for different failure modes:

```python
from searchmind import SearchMindClient
from searchmind.exceptions import (
    SearchMindError,     # Base exception for all API errors
    AuthError,           # 401: Invalid or expired API key
    RateLimitError,      # 429: Per-minute rate limit exceeded
    QuotaExceededError   # 429: Monthly quota exhausted
)

client = SearchMindClient(api_key="sm_live_...")

try:
    result = client.search("test query")
except AuthError:
    print("API key is invalid or expired. Check your credentials.")
except RateLimitError:
    print("Rate limit hit. Wait before retrying.")
except QuotaExceededError:
    print("Monthly quota exceeded. Upgrade your plan.")
except SearchMindError as e:
    print(f"API error {e.status_code}: {e.message}")
```

---

## Configuration

The client can be configured via constructor arguments or environment variables:

| Constructor Arg | Environment Variable | Default | Description |
|----------------|---------------------|---------|-------------|
| `api_key` | `SEARCHMIND_API_KEY` | None (required) | Your API key |
| `base_url` | `SEARCHMIND_BASE_URL` | `http://localhost:8000/v1` | API base URL |
| `timeout` | -- | 60.0 | Request timeout (seconds) |

Environment variables are used as fallbacks when constructor arguments are not provided.

---

## Development

### Running Tests

```bash
pip install -e ".[dev]"
pytest
```

### Code Formatting

```bash
black searchmind/
```

---

## License

Proprietary -- All rights reserved. Refer to the repository owner for licensing terms and distribution rights.
