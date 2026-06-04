# SearchMind API

AI-native web search API for LangChain, LangGraph, RAG pipelines, and autonomous agents. Returns clean, ranked, LLM-friendly search results with optional answer synthesis.

## Features

- **Search** — Web search with basic (snippets) or advanced (full page extraction) depth
- **Extract** — Clean article text from URLs (trafilatura + Playwright fallback)
- **Research** — Multi-query deep research with LLM summary
- **Crawl** — Background domain crawl via Celery (poll for results)
- **API keys** — SHA-256 hashed keys, rate limits, usage tracking

Search provider fallback: **Brave → SerpAPI → DuckDuckGo** (at least one recommended for production).

## Quick start (Docker)

1. Copy environment file:

```bash
cp backend/.env.example backend/.env
```

2. Edit `backend/.env` — set at minimum:

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | JWT signing secret (32+ chars) |
| `DATABASE_URL` | Yes | **Neon** pooled URL with `postgresql+asyncpg://` and `?ssl=require` |
| `BRAVE_API_KEY` | Recommended | Primary search ([Brave Search API](https://brave.com/search/api/)) |
| `SERPAPI_KEY` | Optional | Second fallback ([SerpAPI](https://serpapi.com/)) |
| `LLM_API_KEY` | Optional | Groq/OpenAI-compatible key for `include_answer` / research summaries |
| `LLM_BASE_URL` | Optional | Default: `https://api.groq.com/openai/v1` |
| `LLM_MODEL` | Optional | Default: `llama-3.3-70b-specdec` |

3. Start services (API, Redis, Celery — database is **Neon**, not local Postgres):

```bash
docker compose up --build
```

**Neon `DATABASE_URL` format** (from Neon dashboard → pooled connection):

```bash
postgresql+asyncpg://USER:PASSWORD@ep-xxx-pooler.region.aws.neon.tech/neondb?ssl=require
```

Run migrations once:

```bash
cd backend
alembic upgrade head
```

Optional local Postgres instead of Neon: `docker compose --profile local-db up postgres`

API: [http://localhost:8000](http://localhost:8000)  
Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

Development with hot reload:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

## Quick start (local)

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium

cp .env.example .env
# Edit .env — use localhost URLs:
# DATABASE_URL=postgresql+asyncpg://searchmind:searchmindpass@localhost:5432/searchmind
# REDIS_URL=redis://localhost:6379/0

uvicorn app.main:app --reload
```

Run Celery worker (required for `/v1/crawl`):

```bash
celery -A app.workers.celery_app worker --loglevel=info
```

## Authentication

Protected endpoints require header:

```http
X-API-Key: sm_live_...
```

### Register (returns API key once)

```bash
curl -s -X POST http://localhost:8000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"you@example.com\",\"password\":\"your-secure-password\",\"full_name\":\"Your Name\"}"
```

Response includes `full_key` **only on registration** — save it immediately. Use it as `X-API-Key` for all `/v1/*` calls.

### Login (JWT only)

```bash
curl -s -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"you@example.com\",\"password\":\"your-secure-password\"}"
```

## API examples

Replace `YOUR_API_KEY` with your `sm_live_...` key.

### Windows PowerShell (recommended)

**Do not** use `curl -d "{\"query\":...}"` in PowerShell — it breaks JSON and returns `422 JSON decode error`.

Use the test script or `Invoke-RestMethod`:

```powershell
$env:SEARCHMIND_API_KEY = "sm_live_YOUR_KEY_HERE"
.\scripts\test-search.ps1
.\scripts\test-usage.ps1
```

Or manually:

```powershell
$API_KEY = "sm_live_YOUR_KEY_HERE"
$body = @{
  query = "Python FastAPI"
  num_results = 3
  search_depth = "basic"
  include_answer = $true
} | ConvertTo-Json -Compress

Invoke-RestMethod -Uri "http://localhost:8000/v1/search" -Method POST `
  -Headers @{ "X-API-Key" = $API_KEY } `
  -ContentType "application/json" -Body $body
```

### Health

```bash
curl -s http://localhost:8000/health
```

### Search (basic) — bash / Git Bash

```bash
curl -s -X POST http://localhost:8000/v1/search \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"LangGraph tutorials 2025\",\"num_results\":5,\"search_depth\":\"basic\",\"include_answer\":true}"
```

### Search (advanced — fetches full pages)

```bash
curl -s -X POST http://localhost:8000/v1/search \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"FastAPI async best practices\",\"num_results\":3,\"search_depth\":\"advanced\",\"include_answer\":true}"
```

### Extract URLs

```bash
curl -s -X POST http://localhost:8000/v1/extract \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"urls\":[\"https://fastapi.tiangolo.com/\"],\"use_js_rendering\":false,\"max_content_length\":3000}"
```

### Deep research

```bash
curl -s -X POST http://localhost:8000/v1/research \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"vector database comparison 2025\",\"max_sources\":8,\"include_summary\":true}"
```

### Crawl (async)

Start a crawl:

```bash
curl -s -X POST http://localhost:8000/v1/crawl \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://docs.python.org/3/\",\"max_depth\":1,\"max_pages\":5}"
```

Poll status (use `task_id` from the response):

```bash
curl -s http://localhost:8000/v1/crawl/TASK_ID_HERE \
  -H "X-API-Key: YOUR_API_KEY"
```

When `ready` is `true` and `successful` is `true`, `results` lists crawled pages.

### Usage

```bash
curl -s http://localhost:8000/v1/usage \
  -H "X-API-Key: YOUR_API_KEY"
```

### API keys

```bash
# List keys
curl -s http://localhost:8000/v1/api-keys \
  -H "X-API-Key: YOUR_API_KEY"

# Create key (full_key returned once)
curl -s -X POST http://localhost:8000/v1/api-keys \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Production\"}"

# Revoke key
curl -s -X DELETE http://localhost:8000/v1/api-keys/KEY_UUID \
  -H "X-API-Key: YOUR_API_KEY"
```

Omit `monthly_limit` / `rate_limit_per_min` on create to inherit limits from the user's plan.

## Environment variables

See [backend/.env.example](backend/.env.example) for the full list.

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_NAME` | SearchMind API | Application name |
| `DEBUG` | false | Verbose logging |
| `SECRET_KEY` | (dev default) | JWT secret — **override in production** |
| `DATABASE_URL` | localhost postgres | Async SQLAlchemy URL |
| `REDIS_URL` | redis://localhost:6379/0 | Cache, rate limits, Celery broker |
| `BRAVE_API_KEY` | — | Brave Search API token |
| `SERPAPI_KEY` | — | SerpAPI key (fallback) |
| `LLM_PROVIDER` | groq | Informational label |
| `LLM_API_KEY` | — | OpenAI-compatible API key |
| `LLM_MODEL` | llama-3.3-70b-specdec | Chat model name |
| `LLM_BASE_URL` | https://api.groq.com/openai/v1 | Chat completions base URL |
| `SEARCH_CACHE_TTL` | 3600 | Search cache seconds |
| `EXTRACT_CACHE_TTL` | 86400 | Extract cache seconds |
| `CRAWL_MAX_CONTENT_LENGTH` | 8000 | Max chars stored per crawled page |
| `PLAYWRIGHT_TIMEOUT_MS` | 15000 | Browser fetch timeout |
| `RUN_MIGRATIONS_ON_STARTUP` | true | Run Alembic on app boot (local dev) |
| `REQUIRE_REDIS_FOR_RATE_LIMIT` | true | Reject requests if Redis unavailable |
| `PURGE_EXPIRED_CACHE_ON_STARTUP` | true | Delete expired `cached_results` rows |

## Project structure

```
SearchMind API/
├── backend/           # FastAPI application
├── docker-compose.yml
├── docker-compose.dev.yml
└── README.md
```

## Rate limits & quotas

| Layer | Store | Behavior |
|-------|--------|----------|
| Per minute | Redis | Sliding window per API key; **503** if Redis is down (`REQUIRE_REDIS_FOR_RATE_LIMIT=true`) |
| Per month | PostgreSQL `usage_records` | Single source of truth; same data as `GET /v1/usage`; **429** when exceeded |

Plan defaults applied on register and new API keys (override optional on create):

| Plan | Monthly requests | Per minute |
|------|------------------|------------|
| free | 1,000 | 5 |
| starter | 10,000 | 30 |
| pro | 100,000 | 100 |
| enterprise | 10,000,000 | 1,000 |

## Caching

Responses are cached in **Redis** (fast) and **PostgreSQL `cached_results`** (durable). On Redis miss, the API loads from Postgres and warms Redis. Expired rows are purged on startup (`PURGE_EXPIRED_CACHE_ON_STARTUP`).

## Database migrations

- **Docker:** `entrypoint.sh` runs `alembic upgrade head` before uvicorn.
- **Local uvicorn:** set `RUN_MIGRATIONS_ON_STARTUP=true` (default) to migrate on boot.
- Manual: `cd backend && alembic upgrade head`

`create_all` is no longer used — schema changes must go through Alembic.

## Health check

```bash
curl -s http://localhost:8000/health
```

Returns `status: ok` or `degraded` with `checks.database` and `checks.redis`.

## License

Proprietary — see repository owner for terms.
