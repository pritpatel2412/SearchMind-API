# SearchMind API Platform

SearchMind is an AI-native web search API platform engineered specifically for LLM agent pipelines, LangChain, LangGraph, and advanced Retrieval-Augmented Generation (RAG) workflows. It provides production-grade endpoints for querying the web, deep HTML extraction, and parallelized multi-query research.

The platform abstracts the complexities of search provider fallbacks, headless JavaScript rendering, asynchronous domain crawling, and dual-tier caching, delivering sanitized, LLM-ready context with high throughput and low latency.

---

## Core Capabilities

- **Intelligent Search Engine** (`/v1/search`): Executes web queries utilizing a robust fallback chain (Brave -> SerpAPI -> DuckDuckGo). Supports `basic` (snippets) and `advanced` (full page DOM extraction) depth, integrating automated LLM synthesis and citation indexing.
- **Clean Content Extraction** (`/v1/extract`): Parses and sanitizes raw HTML from URLs. Employs Trafilatura and Readability for fast heuristic extraction, with an automated Playwright headless chromium fallback for dynamically rendered client-side applications.
- **Deep Research Pipelines** (`/v1/research`): Orchestrates parallel search queries, evaluates multiple sources via concurrent fetches, and synthesizes comprehensive research reports utilizing models such as Llama-3.3-70b or Claude.
- **SearchMind Python SDK**: A native, highly optimized Python client featuring built-in LangGraph and LangChain tool adapters for seamless agent integration.
- **Developer Portal & Admin Console**: React-based dashboards for API key lifecycle management, usage quota monitoring, and query playground testing. Includes a root administrative interface for system health and tenant management.

---

## System Architecture

SearchMind is designed for high availability and low latency, utilizing a modern asynchronous microservices stack.

- **Backend API**: Python 3.12, FastAPI, SQLAlchemy (Async), Celery for background tasks.
- **Databases**: PostgreSQL (Neon Serverless) for durable storage, API key hashing (SHA-256), and tenant usage records.
- **Caching Layer**: Dual-tier architecture. 
  - Tier 1: Redis (In-memory, sub-10ms reads)
  - Tier 2: PostgreSQL `cached_results` (Durable, queryable)
  - Cache misses automatically hydrate both tiers.
- **Rate Limiting**: Enforced via a sliding window algorithm in Redis (requests/min) and durable monthly quotas verified against PostgreSQL `usage_records`.
- **Frontend UIs**: React, Vite, Tailwind CSS, utilizing a custom Resend-inspired design system.

---

## Quick Start (Docker)

The fastest method to deploy the complete SearchMind platform (API, Redis, Celery workers, and Frontends) is via Docker Compose.

1. **Clone & Configure**
```bash
git clone https://github.com/pritpatel2412/SearchMind-API.git
cd SearchMind-API
cp backend/.env.example backend/.env
```

2. **Environment Variables**
Configure `backend/.env` with your PostgreSQL connection string and required secrets.
```env
DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.region.aws.neon.tech/neondb?ssl=require
SECRET_KEY=your-secure-jwt-secret
BRAVE_API_KEY=your-brave-search-key  # Recommended primary provider
```

3. **Deploy Services**
```bash
docker compose up --build
```
*Note: Alembic database migrations are executed automatically on container startup.*

### Local Endpoints
- **API Server**: `http://localhost:8000`
- **OpenAPI Docs**: `http://localhost:8000/docs`
- **Developer Portal**: `http://localhost:5173`
- **Admin Console**: `http://localhost:3001`

---

## Python SDK & LangGraph Integration

SearchMind is engineered for autonomous agents. The included Python SDK provides native bindings that map directly to LangGraph and LangChain architectures.

### Installation (Local SDK)
```bash
cd sdk
pip install -e .
```

### LangGraph Agent Implementation
The SDK exposes `create_searchmind_tools()`, which generates strongly-typed `StructuredTool` objects configured with Pydantic schemas, matching LangGraph's exact requirements for tool calling.

```python
import os
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from searchmind import SearchMindClient
from searchmind.langgraph_tool import create_searchmind_tools

# 1. Initialize custom API client
client = SearchMindClient(api_key=os.environ.get("SEARCHMIND_API_KEY"))

# 2. Generate LangGraph-compatible tools automatically
tools = create_searchmind_tools(client)

# 3. Inject tools into the LangGraph Agent
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
agent = create_react_agent(llm, tools)

# Execute autonomous research task
inputs = {"messages": [("user", "Compare modern vector databases in 2026")]}
for chunk in agent.stream(inputs, stream_mode="values"):
    print(chunk["messages"][-1].content)
```

---

## Authentication & Security

SearchMind is a multi-tenant platform. All protected API endpoints require an API key generated from the Developer Portal.

```http
X-API-Key: sm_live_...
```

- **Credential Security**: API keys are hashed via SHA-256 before database insertion. The plaintext secret is only accessible once during generation.
- **Session Security**: Frontend portals utilize short-lived JWT tokens signed with RS256/HS256 for session management.

---

## Local Development (Without Docker)

To run the services natively for development:

**1. API & Celery Workers**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium

uvicorn app.main:app --reload
celery -A app.workers.celery_app worker --loglevel=info
```

**2. Developer Portal**
```bash
cd frontend/developer-portal
npm install
npm run dev
```

**3. Admin Console**
```bash
cd frontend/admin
npm install
npm run dev
```

---

## License

Proprietary — All rights reserved. Refer to the repository owner for licensing terms and distribution rights.
