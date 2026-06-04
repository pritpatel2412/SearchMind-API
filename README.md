# SearchMind API Platform

SearchMind is an AI-native web search API platform built specifically for LLM agent pipelines, LangChain, LangGraph, and advanced RAG workflows. It provides production-grade endpoints for searching the web, deep extraction, and multi-query research, supported by a full Developer Portal and Admin Console.

SearchMind handles the heavy lifting of provider fallbacks, headless JS rendering, async crawling, and dual-tier caching, so your autonomous agents get clean, LLM-ready intelligence instantly.

---

## ⚡ Core Capabilities

- **Intelligent Search Engine** (`/v1/search`): Queries the web using a robust fallback chain (Brave → SerpAPI → DuckDuckGo). Supports `basic` (snippets) and `advanced` (full page scraping) depth, with built-in LLM synthesis and citations.
- **Clean Content Extraction** (`/v1/extract`): Strips ads, boilerplate, and navigation from URLs. Powered by Trafilatura and Readability, with optional Playwright headless fallback for JS-heavy domains.
- **Deep Research Pipelines** (`/v1/research`): Orchestrates parallel search queries, evaluates multiple sources, and synthesizes a comprehensive research report using models like Claude 3.5 Sonnet or Llama 3.
- **SearchMind Python SDK**: A native, highly optimized Python client with built-in LangGraph and LangChain tool adapters.
- **Developer Portal & Admin Console**: Beautiful React-based dashboards for users to manage API keys, monitor quotas, and test queries in the Playground, plus a root admin interface for system health and user management.

---

## 🛠️ Tech Stack & Architecture

- **Backend API**: Python 3.12, FastAPI, SQLAlchemy (Async), Celery
- **Databases**: PostgreSQL (Neon Serverless) + Redis (In-memory caching and message broker)
- **Frontend UIs**: React, Vite, Tailwind CSS, Lucide Icons (Resend-inspired editorial design)
- **Caching Layer**: Dual-tier architecture. Sub-10ms Redis reads falling back to durable PostgreSQL records.
- **SDK**: `httpx`, Pydantic, native `langchain-core` bindings

---

## 🚀 Quick Start (Docker)

The fastest way to run the entire SearchMind platform (API, Redis, Celery, and Frontends) is via Docker Compose.

1. **Clone & Configure**
```bash
git clone https://github.com/pritpatel2412/SearchMind-API.git
cd SearchMind-API
cp backend/.env.example backend/.env
```

2. **Edit `backend/.env`**
You must provide a PostgreSQL connection URL (e.g., from Neon.tech).
```env
DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.region.aws.neon.tech/neondb?ssl=require
SECRET_KEY=your-secure-jwt-secret
BRAVE_API_KEY=your-brave-search-key  # Highly recommended
```

3. **Launch the Platform**
```bash
docker compose up --build
```
*Note: The platform handles database migrations automatically on startup.*

### Platform Access
- **API Server**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs`
- **Developer Portal**: `http://localhost:5173` (Create your account and generate an API key here)
- **Admin Console**: `http://localhost:3001`

---

## 🐍 Python SDK & LangGraph Integration

SearchMind was built to empower autonomous agents. The included Python SDK makes it trivial to drop SearchMind into a LangGraph or LangChain project.

### Installation (Local SDK)
```bash
cd sdk
pip install -e .
```

### LangGraph Agent Example
The SDK includes pre-configured `StructuredTool` objects that map directly to LangGraph.

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

# 3. Pass tools directly to the LangGraph Agent
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
agent = create_react_agent(llm, tools)

# Run autonomous research
inputs = {"messages": [("user", "Compare modern vector databases in 2026")]}
for chunk in agent.stream(inputs, stream_mode="values"):
    print(chunk["messages"][-1].content)
```

---

## 🔐 Authentication & Rate Limiting

SearchMind is multi-tenant and secure. All API endpoints require an API key generated from the Developer Portal.

```http
X-API-Key: sm_live_...
```

- **Security**: API keys are hashed via SHA-256 in the database. The secret is only shown once at creation time.
- **Quotas**: Rate limiting operates via a sliding window in Redis (requests/min) and durable monthly quotas enforced via Postgres `usage_records`.

---

## 💻 Manual Setup (Local Development)

If you prefer to run services natively without Docker:

**1. Start the API & Worker**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium

uvicorn app.main:app --reload
celery -A app.workers.celery_app worker --loglevel=info
```

**2. Start Developer Portal**
```bash
cd frontend/developer-portal
npm install
npm run dev
```

**3. Start Admin Console**
```bash
cd frontend/admin
npm install
npm run dev
```

---

## 📄 License & Rights

Proprietary — All rights reserved. See repository owner for terms of use and distribution.
