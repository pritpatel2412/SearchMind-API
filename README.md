# SearchMind API Platform

SearchMind is an enterprise-grade, AI-native web search and browser execution platform engineered for autonomous agent pipelines, LangGraph, LangChain, and Retrieval-Augmented Generation (RAG) architectures. It provides structured, deterministic, LLM-ready context through multi-provider web search, schema-driven content extraction, zero-crawl topological site mapping, stateful persistent browser sessions, and natural language web action synthesis.

The platform eliminates the operational complexity of upstream search provider outages, headless browser lifecycle management, accessibility tree grounding, dual-tier caching, rate limiting, and metered plan governance—delivering sanitized, structured outputs with high concurrency and sub-second latency.

---

## Deployment and Public Interfaces

- Developer Portal: [https://searchmind-api.vercel.app/](https://searchmind-api.vercel.app/)
- Production API Gateway: [https://searchmind-api.onrender.com](https://searchmind-api.onrender.com)
- Interactive OpenAPI Documentation: [https://searchmind-api.onrender.com/docs](https://searchmind-api.onrender.com/docs)
- Alternative API Specification (ReDoc): [https://searchmind-api.onrender.com/redoc](https://searchmind-api.onrender.com/redoc)

---

## Platform Capabilities

### 1. Intelligent Multi-Provider Web Search
- Route queries dynamically through an upstream fallback chain (Brave Search, SerpAPI, and DuckDuckGo).
- Supports snippet-only retrieval (`basic`) and comprehensive page content extraction (`advanced`).
- Dynamic LLM-synthesized answers with precise citation attribution and source credibility scoring.

### 2. Semantic Passage Highlighting
- Automatically isolates and highlights the most relevant sub-segments of web pages matching a user query.
- Leverages BM25 scoring and semantic chunk extraction to minimize downstream context window bloat and token consumption.

### 3. Schema-Driven Structured Extraction
- Extracts type-safe, validated JSON entities directly from web pages conforming to any client-provided JSON Schema.
- Features self-repair logic to correct structural formatting anomalies without requiring external LLM post-processing.

### 4. Zero-Crawl Topological Site Mapping
- Discovers the complete architectural route hierarchy of target domains without executing heavy recursive crawlers.
- Parses hierarchical XML sitemap indexes, adheres to `robots.txt` compliance policies, and applies semantic path filtering.

### 5. Persistent Stateful Browser Sessions and Cookie Vault
- Maintains isolated, long-lived browser contexts across multi-step agent interactions.
- Provides a centralized Cookie Vault for programmatic injection and extraction of authenticated session credentials.
- Includes automatic resource reaping and lease renewal mechanisms.

### 6. Natural Language ARIA-Grounded Actions
- Executes autonomous browser actions directed by plain-English user instructions.
- Compresses DOM state into deterministic Accessibility (ARIA) trees for robust target grounding.
- Incorporates dynamic self-healing selectors that gracefully recover from front-end layout mutations.

### 7. Human-in-the-Loop (HITL) Interventions
- Securely pauses automated browser flows when encountering anti-bot challenges or multi-factor authentication (2FA).
- Dispatches webhook notifications to external operators and provides a resume endpoint to continue execution.

### 8. Parallelized Deep Research Synthesis
- Recursively decomposes complex topics into focused sub-queries, executes concurrent searches across independent domains, extracts core findings, and compiles a comprehensive research brief.

### 9. Dense Vector Embeddings and Multi-Modal Vision
- Generates vector embeddings for extracted web content directly within the pipeline for immediate vector store ingestion.
- Automatically processes and summarizes embedded page images for multi-modal comprehension.

---

## Enterprise Security and Hardening

The platform adheres to OWASP Top 10 recommendations and enforces strict zero-trust boundaries:

- **Server-Side Request Forgery (SSRF) Defense**: All incoming target URLs undergo DNS resolution and address validation. Access to loopback addresses (`127.0.0.0/8`, `::1`), private RFC 1918 subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local metadata interfaces (`169.254.169.254`), and internal cloud hostnames is strictly blocked at the gateway.
- **HTTP Security Headers**: Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`, `Referrer-Policy: strict-origin-when-cross-origin`, and strict `Content-Security-Policy` directives. Server identification headers are masked.
- **Sliding-Window IP Rate Limiting**: Authentication and administrative login endpoints are shielded by an IP-based sliding window limiter backed by Redis with in-memory fallbacks, mitigating brute force and credential-stuffing attacks.
- **Timing-Attack Resistance**: Administrative authentication evaluates sensitive credentials using constant-time byte comparisons via `hmac.compare_digest`.
- **Exception Masking**: Production environments return generic error payloads (`{"detail": "Internal Server Error"}`), suppressing internal stack traces and database schema specifics.

---

## System Architecture

SearchMind is constructed as a decoupled asynchronous architecture engineered for horizontal scalability:

```
Developer Portal (React 18 / Vite)  ----+
                                         |
Administrative Console (React 18)   ----+----> FastAPI Gateway (Python 3.11+)
                                         |         |
Python SDK / LangGraph Adapters     ----+         +---> Neon PostgreSQL (7 tables)
                                                   +---> Redis (L1 cache + sliding rate limits)
                                                   +---> Brave Search / SerpAPI / DuckDuckGo
                                                   +---> Groq / OpenAI LLM Inference Engine
                                                   +---> Headless Playwright Chromium Pool
                                                   +---> Celery Worker Cluster (async crawling)
```

### Technology Matrix

| Layer | Component | Description |
|---|---|---|
| Gateway & API | FastAPI (Python 3.11+) | Asynchronous HTTP engine with Pydantic v2 data validation |
| Persistence | PostgreSQL (Neon Serverless) | Relational store for users, API keys, usage, audit logs, and durable cache |
| In-Memory Cache | Redis 7+ | L1 sub-10ms response caching and sliding window rate limiting |
| Browser Automation | Playwright (Chromium) | Headless browser execution for SPA rendering and ARIA grounding |
| Task Queue | Celery with Redis broker | Asynchronous domain crawling and distributed worker execution |
| Language Model | Groq / OpenAI API | High-throughput synthesis, research planning, and schema repair |
| Front-End Applications | React 18, Vite, Tailwind CSS | Responsive interfaces for developer self-service and platform administration |

### Dual-Tier Caching Pipeline

1. **Tier 1 (Redis)**: High-speed, in-memory cache for hot queries, rate limit windows, and ephemeral task state.
2. **Tier 2 (PostgreSQL)**: Durable `cached_results` storage providing cross-restart resilience for frequent search and extraction payloads. Expired records are pruned systematically.

---

## API Reference

All application endpoints are versioned under the `/v1` namespace.

### Authentication Endpoints

| Method | Path | Description | Access |
|---|---|---|---|
| POST | `/v1/auth/register` | Register a new user account; returns JWT and default API key | Public (IP Rate Limited) |
| POST | `/v1/auth/login` | Authenticate with credentials; returns JWT session token | Public (IP Rate Limited) |

### Core Search and Intelligence

| Method | Path | Description | Access | Plan Requirement |
|---|---|---|---|---|
| POST | `/v1/search` | AI-optimized web search with dynamic passage highlighting | API Key | Free+ |
| POST | `/v1/extract` | Clean HTML content extraction, multi-modal vision, and embeddings | API Key | Pro+ |
| POST | `/v1/extract/schema` | Type-safe structured extraction conforming to a target JSON Schema | API Key | Pro+ |
| POST | `/v1/crawl` | Initiate asynchronous recursive domain crawler task | API Key | Pro+ |
| GET | `/v1/crawl/{task_id}` | Poll asynchronous crawl task status and retrieve indexed pages | API Key | Pro+ |
| POST | `/v1/map` | Zero-crawl topological site route discovery and sitemap parsing | API Key | Free+ |
| POST | `/v1/research` | Multi-query research synthesis and comprehensive topic brief | API Key | Enterprise |

### Autonomous Agent Primitives

| Method | Path | Description | Access | Plan Requirement |
|---|---|---|---|---|
| POST | `/v1/sessions` | Provision a persistent stateful browser session | API Key | Pro+ |
| GET | `/v1/sessions` | List active persistent browser sessions for current user | API Key | Pro+ |
| GET | `/v1/sessions/{id}` | Inspect browser state, active URL, and history for a session | API Key | Pro+ |
| DELETE | `/v1/sessions/{id}` | Terminate an active browser session and release resources | API Key | Pro+ |
| POST | `/v1/sessions/{id}/cookies` | Inject authentication cookies into the session Cookie Vault | API Key | Pro+ |
| GET | `/v1/sessions/{id}/cookies` | Export all active cookies from the session Cookie Vault | API Key | Pro+ |
| POST | `/v1/action` | Execute deterministic interactive browser actions (click, type, wait) | API Key | Enterprise |
| POST | `/v1/action/instruct` | Natural language browser actions with ARIA grounding and self-healing | API Key | Enterprise |
| POST | `/v1/action/resume/{id}` | Resume an action paused by Human-in-the-Loop intervention | API Key | Enterprise |

### Automated Webhooks and Tasks

| Method | Path | Description | Access | Plan Requirement |
|---|---|---|---|---|
| POST | `/v1/watch` | Create a recurring scheduled web monitoring task with webhook dispatch | API Key | Pro+ |
| GET | `/v1/watch` | List all scheduled monitoring jobs for current user | API Key | Pro+ |
| DELETE | `/v1/watch/{job_id}` | Cancel and delete an active scheduled monitoring task | API Key | Pro+ |

### Key Management and Telemetry

| Method | Path | Description | Access |
|---|---|---|---|
| POST | `/v1/api-keys` | Provision a new API key with custom name and rate limits | JWT |
| GET | `/v1/api-keys` | List all provisioned keys with associated utilization stats | JWT |
| DELETE | `/v1/api-keys/{id}` | Revoke an existing API key | JWT |
| GET | `/v1/usage` | Retrieve current billing cycle consumption metrics | JWT / API Key |
| GET | `/v1/logs` | Fetch real-time API execution audit logs | JWT / API Key |

### Promotional Engine

| Method | Path | Description | Access |
|---|---|---|---|
| POST | `/v1/coupons/redeem` | Apply a promotional code to upgrade user plan limits | JWT |
| GET | `/v1/coupons/active` | Inspect status and expiration of currently applied coupon | JWT |

### Platform Administration

| Method | Path | Description | Access |
|---|---|---|---|
| POST | `/v1/admin/login` | Authenticate administrative user with brute-force defense | Public (Rate Limited) |
| GET | `/v1/admin/users` | List platform users with geo-telemetry and cumulative usage | Root Admin JWT |
| PUT | `/v1/admin/users/{id}/plan` | Manually adjust a user's subscription tier | Root Admin JWT |
| PUT | `/v1/admin/users/{id}/status` | Activate or suspend a user account | Root Admin JWT |
| GET | `/v1/admin/analytics` | Aggregate platform latency, error rates, and provider distributions | Root Admin JWT |
| GET | `/v1/admin/health` | Comprehensive system health check across database, cache, and agents | Root Admin JWT |
| GET | `/v1/admin/sessions` | Monitor all active stateful browser sessions across all tenants | Root Admin JWT |
| DELETE | `/v1/admin/sessions/{id}` | Forcefully terminate a browser session from the oversight console | Root Admin JWT |
| POST | `/v1/admin/sessions/clean` | Trigger bulk garbage collection of expired browser sessions | Root Admin JWT |
| GET | `/v1/admin/coupons` | List all promotional coupon campaigns | Root Admin JWT |
| POST | `/v1/admin/coupons` | Create a new promotional coupon campaign | Root Admin JWT |
| DELETE | `/v1/admin/coupons/{id}` | Deactivate and delete a coupon campaign | Root Admin JWT |

---

## Monetization and Plan Tiers

The platform enforces quota boundaries and requests-per-minute rate limits at the middleware layer:

| Plan | Monthly Quota | Rate Limit | Available Capabilities |
|---|---|---|---|
| Free | 500 requests | 5 req/min | Web Search, Topological Site Mapping |
| Starter | 10,000 requests | 30 req/min | Web Search, Topological Site Mapping |
| Pro | 100,000 requests | 100 req/min | Search, Extract, Schema Extraction, Crawl, Sessions, Watch Tasks |
| Enterprise | 10,000,000 requests | 1,000 req/min | Full Platform Access, Deep Research, Autonomous Actions, HITL |

---

## User Interfaces

### Developer Portal
The Developer Portal (`frontend/developer-portal`) is a production single-page application built with React 18, Vite, and Tailwind CSS. It provides self-service management:
- **Interactive Playground**: Real-time parameter configuration and execution for `/search`, `/extract`, `/crawl`, and `/research` with formatted card views and raw JSON payload inspection.
- **Key Lifecycle Management**: Self-service API key provisioning, naming, and revocation.
- **Consumption Analytics**: Real-time progress indicators detailing quota consumption, endpoint breakdowns, and request latency sparklines.
- **Interactive Documentation**: Comprehensive parameter tables, cURL command generators, and Python SDK integration snippets.
- **Roadmap & Changelog**: Chronological release timeline tracking architectural phases.

### Administrative Console
The Administrative Console (`frontend/admin`) is a restricted operational portal offering deep system oversight:
- **Tenant Management**: User directory with search, subscription controls, account suspension toggles, and detailed geo-telemetry inspection (IP, city, country, browser, OS, and client metadata).
- **Session Oversight Dashboard**: Live table tracking all active browser sessions, user IDs, active cookie counts, creation timestamps, remaining lease countdowns, and instant termination controls.
- **System Health Diagnostics**: Real-time monitoring cards reporting status for core infrastructure (PostgreSQL, Redis, API Gateway) alongside autonomous agent primitives (Highlighter, Schema Extractor, Topological Mapper, Session Pool, and Action Synthesis Engine).
- **Promotional Campaign Manager**: Coupon creation, redemption limits, validity date enforcement, and real-time usage metrics.

---

## Model Context Protocol (MCP) Server

SearchMind incorporates a native [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server built on FastMCP. This enables IDEs such as Cursor and AI desktop clients (e.g., Claude Desktop) to invoke SearchMind tools directly:

### Exposed Tools
- `search_web`: Fast AI-optimized web queries with structured snippet attribution.
- `deep_research`: Parallelized multi-query research synthesis across diverse domains.
- `extract_page`: Clean Markdown and metadata extraction from complex web pages.
- `crawl_domain`: Background domain crawler invocation.

### Client Configuration Example
Add the following block to your client configuration (e.g., `cursor.json` or `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "searchmind": {
      "command": "python",
      "args": ["/path/to/SearchMind-API/mcp-server/server.py"],
      "env": {
        "SEARCHMIND_API_KEY": "sm_live_your_api_key_here"
      }
    }
  }
}
```

---

## Python SDK and Agent Integration

The platform includes an official Python SDK with native asynchronous support, standard error handling, and dedicated tool wrappers for LangGraph and LangChain.

### Installation

```bash
cd sdk
pip install -e .
```

To install with LangChain and LangGraph adapters:

```bash
pip install -e ".[langchain]"
```

### Basic Invocation

```python
from searchmind import SearchMindClient

client = SearchMindClient(api_key="sm_live_...")

# Perform web search with passage highlighting
response = client.search("FastAPI production deployment best practices", num_results=5)
print(response.answer)
for item in response.results:
    print(f"[{item.score:.2f}] {item.title}: {item.url}")

# Extract structured content from target URL
extract_result = client.extract(["https://example.com/article"])
print(extract_result.results[0].content)

# Deep multi-source research synthesis
research = client.research("State of autonomous web agents in 2026")
print(research.summary)
```

### LangGraph ReAct Agent Integration

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

result = agent.invoke({"messages": [("user", "What are the latest developments in quantum computing?")]})
```

---

## Deployment and Setup

### Option 1: Docker Compose (Recommended)

1. Clone the repository and prepare the configuration:
   ```bash
   git clone https://github.com/pritpatel2412/SearchMind-API.git
   cd SearchMind-API
   cp backend/.env.example backend/.env
   ```

2. Configure environment variables in `backend/.env`.

3. Launch all services:
   ```bash
   docker compose up --build
   ```
   Alembic database migrations execute automatically on startup.

### Option 2: Native Local Development

#### Backend Gateway and Celery Workers
```bash
cd backend
python -m venv .venv

# Activate virtual environment
# Linux/macOS:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

pip install -r requirements.txt
playwright install chromium

# Launch the API server
uvicorn app.main:app --reload --port 8000

# Launch Celery worker (in a separate terminal)
celery -A app.workers.celery_app worker --loglevel=info
```

#### Developer Portal
```bash
cd frontend/developer-portal
npm install
npm run dev
```

#### Administrative Console
```bash
cd frontend/admin
npm install
npm run dev
```

---

## Project Structure

```
SearchMind-API/
|-- backend/
|   |-- app/
|   |   |-- auth/               # JWT token and hashed API key validation
|   |   |-- middleware/         # Security headers, CORS, rate limiting, and usage tracking
|   |   |-- models/             # SQLAlchemy ORM database models
|   |   |-- routers/            # Versioned API routes (/search, /extract, /crawl, /sessions, etc.)
|   |   |-- schemas/            # Pydantic validation schemas
|   |   |-- services/           # Core business logic and external provider integrations
|   |   |-- utils/              # SSRF URL validation, HTML sanitization, and seeders
|   |   |-- workers/            # Distributed Celery task definitions
|   |   |-- config.py           # Application settings and environment definitions
|   |   |-- database.py         # Asynchronous SQLAlchemy database engine
|   |   |-- main.py             # Application factory and lifecycle orchestration
|   |-- alembic/                # Relational schema migration scripts
|   |-- tests/                  # Automated integration and unit test suite
|   |-- requirements.txt
|   |-- Dockerfile
|   |-- .env.example
|-- frontend/
|   |-- developer-portal/       # Developer-facing React SPA (Playground, Docs, Keys)
|   |-- admin/                  # Administrative React SPA (Users, Sessions, Health)
|-- sdk/                        # Official Python SDK with LangGraph tool wrappers
|-- mcp-server/                 # Model Context Protocol server for AI clients
|-- docker-compose.yml
```

---

## Configuration Reference

Key configuration settings managed through environment variables:

| Variable | Requirement | Description |
|---|---|---|
| `DATABASE_URL` | Required | PostgreSQL connection string (`postgresql+asyncpg://...`) |
| `SECRET_KEY` | Required | Cryptographic secret for signing JWT tokens |
| `REDIS_URL` | Required | Redis connection string for caching and rate limiting |
| `BRAVE_API_KEY` | Recommended | Primary search provider API key |
| `SERPAPI_KEY` | Optional | Secondary search provider fallback key |
| `LLM_PROVIDER` | Optional | LLM provider selection (`groq`, `openai`, `nvidia`) |
| `LLM_API_KEY` | Optional | API key for selected LLM provider |
| `LLM_MODEL` | Optional | Model identifier (default: `openai/gpt-oss-120b`) |
| `ADMIN_EMAIL` | Optional | Administrative login identity |
| `ADMIN_PASSWORD` | Optional | Administrative login secret |
| `ALLOWED_ORIGINS` | Optional | Comma-delimited list of permitted CORS origins |
| `ALLOW_INTERNAL_NETWORKS`| Optional | Boolean override to permit private IP access during testing |
| `RUN_MIGRATIONS_ON_STARTUP` | Optional | Automatically apply Alembic migrations on startup (default: `true`) |

---

## Verification and Testing

Execute the test suites to ensure operational readiness:

```bash
# Execute security verification (SSRF, Security Headers, IP Rate Limiting)
python backend/tests/test_owasp_security.py

# Execute administrative sessions test
python backend/tests/test_admin_sessions.py

# Execute core agent primitive tests
python backend/tests/test_dynamic_highlights.py
python backend/tests/test_schema_extraction.py
python backend/tests/test_topological_map.py
python backend/tests/test_browser_sessions.py
python backend/tests/test_instruct_action.py
```

---

## Contributing and Branch Governance

SearchMind enforces strict repository governance:

- **No Direct Pushes to `main`**: All direct pushes to `main` or production release branches are blocked.
- **Pull Request Requirement**: All additions, fixes, and refactors must be submitted via Pull Requests from isolated topic branches (`feat/*`, `fix/*`, `security/*`, `docs/*`).
- **Automated Verification**: Every Pull Request must pass the GitHub Actions CI pipeline, including OWASP security validations, unit test suites, and front-end production builds.
- **Sole Merge Authority**: Only the repository owner and Lead Maintainer (`pritpatel2412`) has authorization to review and merge Pull Requests into `main`.

For complete contribution procedures, conventional commit standards, and local pre-push hook setup, please refer to [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

Proprietary. All rights reserved. Refer to the organization repository administrator for licensing terms, commercial redistribution rights, and custom deployment inquiries.
