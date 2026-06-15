# SearchMind API Platform

SearchMind is a production-grade, AI-native web search API platform engineered for LLM agent pipelines, LangChain, LangGraph, and Retrieval-Augmented Generation (RAG) workflows. It provides structured, LLM-ready context through multi-provider web search, clean HTML content extraction, background domain crawling, and parallelized deep research synthesis.

The platform abstracts the complexities of search provider fallbacks, headless JavaScript rendering, asynchronous domain crawling, dual-tier caching, rate limiting, and monetization plan enforcement -- delivering sanitized, ranked results with high throughput and low latency.

**Status:** Beta (under active development)

---

## Table of Contents

- [Core Capabilities](#core-capabilities)
- [System Architecture](#system-architecture)
- [API Endpoints](#api-endpoints)
- [Monetization and Plan Tiers](#monetization-and-plan-tiers)
- [Coupon and Promotional System](#coupon-and-promotional-system)
- [User Analytics and Session Telemetry](#user-analytics-and-session-telemetry)
- [Developer Portal](#developer-portal)
- [Admin Console](#admin-console)
- [Python SDK and Agent Integration](#python-sdk-and-agent-integration)
- [Quick Start (Docker)](#quick-start-docker)
- [Local Development (Without Docker)](#local-development-without-docker)
- [Project Structure](#project-structure)
- [Authentication and Security](#authentication-and-security)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [License](#license)

---

## Core Capabilities

- **Intelligent Search** (`POST /v1/search`): Executes web queries through a resilient multi-provider fallback chain (Brave Search, SerpAPI, DuckDuckGo). Supports `basic` (snippet-only) and `advanced` (full page content extraction) depth modes, with optional LLM-powered answer synthesis and citation indexing.

- **Content Extraction** (`POST /v1/extract`): Parses and sanitizes raw HTML from one or more URLs. Uses Trafilatura and Readability for fast heuristic extraction, with automatic Playwright headless Chromium fallback for JavaScript-rendered single-page applications. Supports batch processing of up to 10 URLs concurrently.

- **Background Domain Crawling** (`POST /v1/crawl`): Triggers asynchronous Celery-based crawl jobs for specified URL domains. Supports configurable max depth and max pages. Results are retrieved by polling a task status endpoint (`GET /v1/crawl/{task_id}`).

- **Deep Research Pipelines** (`POST /v1/research`): Orchestrates multi-angle research by dynamically generating sub-queries via LLM, executing parallel searches, fetching and extracting content from top sources, ranking results by relevance, and synthesizing a comprehensive research summary.

- **Python SDK**: Native Python client with synchronous and asynchronous interfaces. Includes built-in LangGraph and LangChain tool adapters for direct agent integration.

- **Developer Portal**: React-based dashboard for user registration, API key lifecycle management, usage monitoring, interactive API playground, documentation, pricing, coupon redemption, and a project roadmap timeline.

- **Admin Console**: React-based administrative interface for user account management, platform analytics, promotional coupon management, and real-time system health monitoring.

---

## System Architecture

SearchMind is built on a modern asynchronous microservices stack designed for high availability and low latency.

```
Developer Portal (React/Vite)  ----+
                                    |
Admin Console (React/Vite)     ----+----> FastAPI Backend (Python 3.11+)
                                    |         |
Python SDK (httpx)             ----+         +---> Neon PostgreSQL (7 tables)
                                              +---> Redis (cache + rate limits)
                                              +---> Brave Search API
                                              +---> SerpAPI (fallback)
                                              +---> DuckDuckGo (final fallover)
                                              +---> Groq LLM (Llama 3.3 70B)
                                              +---> Celery Workers (crawl tasks)
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| API Framework | FastAPI with async SQLAlchemy |
| Database | PostgreSQL via Neon Serverless |
| Cache and Rate Limiting | Redis (sliding window rate limits, in-memory cache) |
| Background Tasks | Celery with Redis broker |
| LLM Provider | Groq (Llama 3.3 70B Versatile) |
| Search Providers | Brave Search (primary), SerpAPI (fallback), DuckDuckGo (final) |
| Content Extraction | Trafilatura, Readability-lxml, Playwright (JS fallback) |
| Frontend Framework | React 18 with Vite and Tailwind CSS |
| Authentication | JWT (Bearer tokens) for portal sessions, SHA-256 hashed API keys for programmatic access |

### Caching Architecture

SearchMind uses a dual-tier caching strategy:

- **Tier 1 (Redis)**: In-memory cache for sub-10ms reads. Used for search results, extracted content, and rate limit counters.
- **Tier 2 (PostgreSQL)**: Durable `cached_results` table for queryable, persistent cache storage. Expired entries are automatically purged on startup.
- Cache misses hydrate both tiers simultaneously.

---

## API Endpoints

All endpoints are prefixed with `/v1`.

### Authentication

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/v1/auth/register` | Create a new user account and receive a JWT token plus an initial API key | None |
| POST | `/v1/auth/login` | Authenticate and receive a JWT token | None |

### Core Search

| Method | Path | Description | Auth | Plan |
|--------|------|-------------|------|------|
| POST | `/v1/search` | AI-optimized web search with optional answer synthesis | API Key | All |
| POST | `/v1/extract` | Extract clean text and metadata from URLs | API Key | Pro+ |
| POST | `/v1/crawl` | Trigger background domain crawl job | API Key | Pro+ |
| GET | `/v1/crawl/{task_id}` | Poll crawl task status and retrieve results | API Key | Pro+ |
| POST | `/v1/research` | Deep multi-source research with LLM synthesis | API Key | Enterprise |

### Key and Usage Management

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/v1/api-keys` | Create a new API key | JWT |
| GET | `/v1/api-keys` | List all active API keys with usage stats | JWT |
| DELETE | `/v1/api-keys/{key_id}` | Revoke an API key | JWT |
| GET | `/v1/usage` | Get current period usage statistics | JWT or API Key |
| GET | `/v1/logs` | Retrieve recent API activity logs | JWT or API Key |

### Coupon System

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/v1/coupons/redeem` | Redeem a promotional coupon code | JWT |
| GET | `/v1/coupons/active` | Check if user has an active coupon promotion | JWT |

### Admin Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/admin/users` | List all users with telemetry data |
| PUT | `/v1/admin/users/{id}/plan` | Update a user's subscription plan |
| PUT | `/v1/admin/users/{id}/status` | Enable or disable a user account |
| GET | `/v1/admin/analytics` | Platform analytics with time range selection |
| GET | `/v1/admin/health` | System health for API, database, and Redis |
| GET | `/v1/admin/coupons` | List all promotional coupons |
| POST | `/v1/admin/coupons` | Create a new coupon code |
| DELETE | `/v1/admin/coupons/{id}` | Delete a coupon |

### System

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe with database and Redis checks |
| GET | `/` | API root metadata |
| GET | `/docs` | Interactive OpenAPI (Swagger) documentation |
| GET | `/redoc` | ReDoc API documentation |

---

## Monetization and Plan Tiers

SearchMind implements a four-tier monetization model. Rate limits and monthly quotas are enforced at the middleware layer.

| Plan | Monthly Requests | Rate Limit | Endpoints Available |
|------|-----------------|------------|---------------------|
| Free | 500 | 5 req/min | Search |
| Starter | 10,000 | 30 req/min | Search |
| Pro | 100,000 | 100 req/min | Search, Extract, Crawl |
| Enterprise | 10,000,000 | 1,000 req/min | Search, Extract, Crawl, Research |

- Rate limits are enforced via sliding window counters in Redis.
- Monthly quotas are tracked in PostgreSQL `usage_records` with per-endpoint breakdowns (search, extract, crawl, research).
- API keys inherit their plan's limits at creation time and are updated automatically when plans change (including through coupon redemptions).

---

## Coupon and Promotional System

SearchMind includes a complete promotional coupon system for running time-limited plan upgrades.

### Admin Side

- Create coupons with: code, duration (days), maximum redemption count, validity window (from/to dates), and target plan (e.g., "pro").
- View all coupons with real-time redemption counts and status.
- Delete coupons when no longer needed.

### User Side

- Users redeem coupons from the Pricing page in the Developer Portal.
- The system enforces the following rules strictly:
  - Coupon must exist and be active.
  - Current date must be within the coupon's validity window.
  - Redemption count must not have reached the maximum limit.
  - The user must not have already redeemed this specific coupon.
  - The user must not have another active coupon promotion running.
- On successful redemption, the user's plan is upgraded and all active API key limits are adjusted to match the new plan tier.

### Auto-Expiration

- Every API request checks if the user's active coupon has expired.
- When a coupon expires, the user's plan and API key limits are automatically reverted to their original values.
- The redemption record is marked with status "expired".

### Active Coupon Banner

- When a user has an active coupon, a notification banner appears above the navigation bar showing the coupon code and remaining days.
- The banner is dismissible by the user if more than 7 days remain.
- During the last 7 days, the banner becomes non-dismissible and displays an "Ending Soon" indicator.

---

## User Analytics and Session Telemetry

SearchMind captures detailed session telemetry on every registration and login event.

### Data Captured

| Field | Source |
|-------|--------|
| IP Address | Request headers (X-Forwarded-For or client host) |
| Country, Region, City | ip-api.com GeoIP service |
| ISP | ip-api.com GeoIP service |
| Browser | User-Agent header parsing |
| Operating System | User-Agent header parsing |
| Device Type | User-Agent header parsing (Desktop/Mobile/Tablet) |
| Screen Resolution | Client-side capture (sent in auth request body) |
| Language | Client-side capture (navigator.language) |
| Timezone | Client-side capture (Intl.DateTimeFormat) |
| Last Login | Server timestamp |

### Localhost Handling

When the application is accessed from a local or loopback address (127.0.0.1, ::1, private ranges), the system fetches the server's public IP using api.ipify.org as a fallback before performing geolocation, ensuring real telemetry data in development environments.

### Admin Telemetry View

The Admin Console displays a Vercel-inspired telemetry overlay modal when clicking on any user in the User Accounts table. This modal presents all captured session data in a structured format.

---

## Developer Portal

The Developer Portal is a React single-page application served at `http://localhost:5173`.

### Pages

| Page | Path | Description |
|------|------|-------------|
| Landing Page | `/` | Product overview with feature highlights and BETA badge |
| Authentication | `/auth` | Login and registration with client-side telemetry capture |
| Dashboard | `/dashboard` | API key management, usage statistics, and activity logs |
| Playground | `/playground` | Interactive API testing for search, extract, crawl, and research endpoints |
| API Documentation | `/docs` | Full endpoint reference with request/response examples |
| Pricing | `/pricing` | Four-tier pricing cards, FAQ accordion, and coupon redemption section |
| Features | `/features` | Feature showcase |
| Reliability | `/reliability` | Multi-provider fallback architecture explanation |
| Latency | `/latency` | Performance metrics and latency visualization |
| Caching | `/caching` | Caching architecture explanation |
| Use Cases | `/use-cases` | Agent, RAG, and chatbot integration examples |
| Python SDK | `/python-sdk` | SDK installation and usage documentation |
| System Status | `/status` | Real-time system health display |
| Roadmap | `/roadmap` | Project timeline with animated scroll effects |
| Terms of Service | `/terms` | Legal terms with beta disclaimer |
| Privacy Policy | `/privacy` | Privacy policy with beta disclaimer |
| 404 Not Found | `/404` | Canyon-themed parallax error page with SVG artwork |

### Error Handling

All undefined routes are redirected to a custom 404 error page featuring an interactive canyon landscape with parallax SVG cacti and mouse-tracking effects. The page includes a "Return Home" button to navigate back to the landing page.

---

## Admin Console

The Admin Console is a React single-page application served at `http://localhost:3001`.

### Pages

| Page | Path | Description |
|------|------|-------------|
| User Accounts | `/users` | User table with plan management, enable/disable controls, and telemetry modal |
| Platform Analytics | `/analytics` | KPI cards, query volume and latency sparkline charts, provider share breakdown, time range selector (1h/12h/24h/7d) |
| Promo Coupons | `/coupons` | Create, list, and delete promotional coupons with real-time redemption tracking |
| System Health | `/system` | API server, database, and Redis health dashboard with uptime, latency, connection, and memory metrics |
| 404 Not Found | `/404` | Same canyon-themed error page as the Developer Portal |

### Features

- Sidebar navigation with live system health indicator (auto-polls every 15 seconds).
- Responsive design with mobile bottom navigation bar.
- Undefined routes are caught and redirected to the 404 page.

---

## Python SDK and Agent Integration

The SearchMind Python SDK provides a native client with both synchronous and asynchronous interfaces. For complete SDK documentation, refer to [sdk/README.md](sdk/README.md).

### Installation

```bash
cd sdk
pip install -e .
```

Or install with LangChain support:

```bash
pip install -e ".[langchain]"
```

### Basic Usage

```python
from searchmind import SearchMindClient

client = SearchMindClient(api_key="sm_live_...")

# Basic search
result = client.search("latest LangGraph tutorials", num_results=5)
print(result.answer)
for r in result.results:
    print(f"  {r.title} -- {r.url} (score: {r.score:.2f})")

# Content extraction (requires Pro plan)
extracted = client.extract(["https://example.com/article"])
print(extracted.results[0].content)

# Deep research (requires Enterprise plan)
research = client.research("Compare vector databases in 2026")
print(research.summary)

# Usage statistics
usage = client.get_usage()
print(f"Used: {usage.total_requests}/{usage.monthly_limit}")
```

### Async Usage

```python
import asyncio
from searchmind import SearchMindClient

async def main():
    client = SearchMindClient(api_key="sm_live_...")
    result = await client.async_search("Python 3.13 new features")
    print(result.answer)
    await client.aclose()

asyncio.run(main())
```

### LangGraph Agent Integration

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

result = agent.invoke({"messages": [("user", "Compare modern vector databases")]})
```

### LangChain Tool Integration

```python
from searchmind import SearchMindClient
from searchmind.langchain_tool import SearchMindSearchTool

client = SearchMindClient(api_key="sm_live_...")
tool = SearchMindSearchTool(client=client)

# Use as a standalone tool
result = tool.invoke("latest FastAPI best practices")
```

---

## Quick Start (Docker)

The fastest method to deploy the complete SearchMind platform is via Docker Compose.

### 1. Clone and Configure

```bash
git clone https://github.com/pritpatel2412/SearchMind-API.git
cd SearchMind-API
cp backend/.env.example backend/.env
```

### 2. Environment Variables

Edit `backend/.env` with your connection strings and API keys:

```env
DATABASE_URL=postgresql+asyncpg://user:pass@ep-xxx.region.aws.neon.tech/neondb?ssl=require
SECRET_KEY=your-secure-jwt-secret-min-32-characters
BRAVE_API_KEY=your-brave-search-api-key
LLM_API_KEY=your-groq-api-key
REDIS_URL=redis://redis:6379/0
```

### 3. Deploy Services

```bash
docker compose up --build
```

Database migrations are executed automatically on container startup.

### 4. Access Points

| Service | URL |
|---------|-----|
| API Server | http://localhost:8000 |
| OpenAPI Docs (Swagger) | http://localhost:8000/docs |
| ReDoc Documentation | http://localhost:8000/redoc |
| Developer Portal | http://localhost:5173 |
| Admin Console | http://localhost:3001 |

---

## Local Development (Without Docker)

### 1. Backend API and Celery Workers

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Linux/macOS
# .venv\Scripts\activate        # Windows

pip install -r requirements.txt
playwright install chromium

# Start the API server
uvicorn app.main:app --reload

# In a separate terminal, start Celery workers for crawl tasks
celery -A app.workers.celery_app worker --loglevel=info
```

### 2. Developer Portal

```bash
cd frontend/developer-portal
npm install
npm run dev
```

### 3. Admin Console

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
|   |   |-- auth/              # JWT and API key authentication
|   |   |   |-- api_key_auth.py
|   |   |   |-- jwt_auth.py
|   |   |   |-- key_generator.py
|   |   |-- middleware/         # CORS, rate limiting, usage tracking
|   |   |   |-- cors.py
|   |   |   |-- rate_limiter.py
|   |   |   |-- usage_tracker.py
|   |   |-- models/            # SQLAlchemy ORM models (7 tables)
|   |   |   |-- user.py
|   |   |   |-- api_key.py
|   |   |   |-- search_log.py
|   |   |   |-- usage.py
|   |   |   |-- cached_results.py
|   |   |   |-- coupon.py       # Coupon + CouponRedemption models
|   |   |-- routers/           # API route handlers
|   |   |   |-- auth.py         # Register, login, session telemetry
|   |   |   |-- search.py       # Web search endpoint
|   |   |   |-- extract.py      # Content extraction endpoint
|   |   |   |-- crawl.py        # Background crawl endpoint
|   |   |   |-- research.py     # Deep research endpoint
|   |   |   |-- api_keys.py     # API key CRUD
|   |   |   |-- usage.py        # Usage stats and logs
|   |   |   |-- admin.py        # Admin: users, analytics, health, coupons
|   |   |   |-- coupons.py      # User coupon redemption
|   |   |-- schemas/           # Pydantic request/response schemas
|   |   |-- services/          # Business logic layer (15 services)
|   |   |   |-- search_service.py
|   |   |   |-- brave_service.py
|   |   |   |-- serpapi_service.py
|   |   |   |-- ddg_service.py
|   |   |   |-- search_provider.py
|   |   |   |-- fetch_service.py
|   |   |   |-- extract_service.py
|   |   |   |-- ai_service.py
|   |   |   |-- cache_service.py
|   |   |   |-- rank_service.py
|   |   |   |-- safety_service.py
|   |   |   |-- credibility_service.py
|   |   |   |-- quota_service.py
|   |   |   |-- plan_service.py
|   |   |   |-- coupon_service.py
|   |   |-- utils/             # Seeder, HTML cleaner, URL utils
|   |   |-- workers/           # Celery task definitions
|   |   |-- config.py          # Settings via pydantic-settings
|   |   |-- database.py        # Async SQLAlchemy engine
|   |   |-- main.py            # FastAPI application entry point
|   |-- alembic/               # Database migration scripts
|   |-- requirements.txt
|   |-- Dockerfile
|   |-- .env.example
|-- frontend/
|   |-- developer-portal/      # Developer-facing React SPA (17 pages)
|   |   |-- src/
|   |   |   |-- pages/         # Home, Auth, Dashboard, Playground, Docs, etc.
|   |   |   |-- components/    # Navbar, ApiKeyCard, UsageChart, etc.
|   |   |   |-- App.jsx        # Router, coupon banner, footer
|   |-- admin/                 # Admin React SPA (5 pages)
|   |   |-- src/
|   |   |   |-- pages/         # Users, Analytics, Coupons, SystemHealth, 404
|   |   |   |-- App.jsx        # Admin layout, sidebar, mobile nav
|-- sdk/                       # Python SDK package
|   |-- searchmind/
|   |   |-- client.py          # Sync + async HTTP client
|   |   |-- models.py          # Response data models
|   |   |-- exceptions.py      # Custom exception classes
|   |   |-- langchain_tool.py  # LangChain tool adapter
|   |   |-- langgraph_tool.py  # LangGraph tool adapter
|   |-- pyproject.toml
|   |-- README.md
|-- e2e_tests/                 # End-to-end test suite
|-- scripts/                   # Test scripts (PowerShell)
|-- docker-compose.yml
|-- docker-compose.dev.yml
```

---

## Authentication and Security

SearchMind is a multi-tenant platform with two authentication mechanisms:

### API Key Authentication

Used for programmatic access to search, extract, crawl, and research endpoints.

```http
X-API-Key: sm_live_...
```

- Keys are generated with a `sm_live_` prefix for identification.
- The full key is displayed only once at creation time.
- Keys are stored as SHA-256 hashes in the database.
- Each key has independent monthly quota and per-minute rate limits.

### JWT Token Authentication

Used for Developer Portal sessions and user-scoped operations (key management, usage stats).

```http
Authorization: Bearer <jwt_token>
```

- Tokens are issued on login/registration with configurable expiry.
- Used for API key CRUD, usage reporting, and coupon redemption endpoints.

### Abuse Protection

- Maximum 3 accounts per IP address (enforced at registration).
- Per-key rate limiting via Redis sliding window.
- Monthly quota enforcement via PostgreSQL usage records.
- Plan-gated endpoint access (Extract, Crawl, Research).

---

## Database Schema

SearchMind uses 7 PostgreSQL tables managed by Alembic migrations:

| Table | Description |
|-------|-------------|
| `users` | User accounts with plan, credentials, and 12+ telemetry columns |
| `api_keys` | SHA-256 hashed API keys with per-key rate limits and quotas |
| `search_logs` | Audit trail for every API request (endpoint, query, latency, status) |
| `usage_records` | Monthly per-key usage counters by endpoint type |
| `cached_results` | Durable cache tier for search and extraction results |
| `coupons` | Promotional coupon definitions (code, duration, max redemptions, validity) |
| `coupon_redemptions` | User-coupon redemption records with expiry and status tracking |

Migrations run automatically on application startup when `RUN_MIGRATIONS_ON_STARTUP=true`.

---

## Environment Variables

All configuration is managed through environment variables. See `backend/.env.example` for the complete reference.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (asyncpg driver) |
| `SECRET_KEY` | Yes | JWT signing secret (minimum 32 characters) |
| `REDIS_URL` | Yes | Redis connection string |
| `BRAVE_API_KEY` | Recommended | Brave Search API key (primary provider) |
| `SERPAPI_KEY` | Optional | SerpAPI key (fallback provider) |
| `LLM_PROVIDER` | Optional | LLM provider: groq, nvidia, or openai (default: groq) |
| `LLM_API_KEY` | Optional | API key for the LLM provider |
| `LLM_MODEL` | Optional | Model identifier (default: llama-3.3-70b-versatile) |
| `LLM_BASE_URL` | Optional | LLM API base URL |
| `DEBUG` | Optional | Enable debug logging (default: false) |
| `RUN_MIGRATIONS_ON_STARTUP` | Optional | Auto-run Alembic migrations (default: true) |

---

## Testing

### End-to-End Tests

```bash
cd e2e_tests
pytest test_backend.py -v
pytest test_frontend.py -v
```

### Manual API Testing (PowerShell)

```bash
cd scripts
./test-search.ps1
./test-usage.ps1
```

### Build Verification

```bash
# Developer Portal
cd frontend/developer-portal
npm run build

# Admin Console
cd frontend/admin
npm run build
```

---

## License

Proprietary -- All rights reserved. Refer to the repository owner for licensing terms and distribution rights.
