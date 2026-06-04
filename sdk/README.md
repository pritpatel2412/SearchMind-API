# SearchMind Python SDK

Official Python client and agent tools for the **SearchMind API Platform** — a developer-first Tavily alternative providing clean, structured, LLM-optimized web search results.

## Installation

Install in editable mode for local development:

```bash
pip install -e .
```

To include LangChain/LangGraph dependencies:

```bash
pip install -e .[langchain]
```

## Quick Start

### Basic Search

```python
from searchmind import SearchMindClient

# Initialize client (defaults to http://localhost:8000/v1)
client = SearchMindClient(api_key="sm_live_...")

# Perform basic search
response = client.search(
    query="FastAPI async best practices",
    num_results=3,
    search_depth="basic"
)

print("Synthesized Answer:", response.answer)
for result in response.results:
    print(f"- {result.title} ({result.url})")
    print(f"  Score: {result.score:.2f}")
```

### Deep Research

```python
# Deep research expands queries and crawls multiple sources in parallel
research_info = client.research("Generative AI agents frameworks comparison 2025")
print("Research Summary:", research_info.summary)
```

### Async Usage

```python
import asyncio
from searchmind import SearchMindClient

async def main():
    client = SearchMindClient(api_key="sm_live_...")
    response = await client.async_search("What is new in Python 3.13?")
    print(response.answer)
    await client.close()

asyncio.run(main())
```

## Agent Integrations

### LangGraph react agent

```python
import os
from langgraph.prebuilt import create_react_agent
from langchain_anthropic import ChatAnthropic
from searchmind import SearchMindClient
from searchmind.langgraph_tool import create_searchmind_tools

client = SearchMindClient(api_key=os.environ["SEARCHMIND_API_KEY"])
tools = create_searchmind_tools(client)

llm = ChatAnthropic(model="claude-3-5-sonnet-20241022")
agent = create_react_agent(llm, tools)

response = agent.invoke({"messages": [("human", "Find recent LangGraph release notes.")]})
```
