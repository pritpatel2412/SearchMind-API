import asyncio
import datetime
import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import SessionLocal, engine, get_db
from app.db_migrate import run_migrations
from app.middleware.cors import setup_cors
from app.redis_client import close_redis, get_redis
from app.routers import search, extract, crawl, research, usage, api_keys, admin, coupons, watch, action
from app.routers.auth import router as auth_router
from app.http_client import get_http_client, close_http_client
from app.services.cache_service import purge_expired_cached_results
from fastapi.responses import JSONResponse
from fastapi import Request

# Import models so Alembic and metadata stay in sync
from app.models import User, APIKey, SearchLog, UsageRecord, CachedResult  # noqa: F401

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("searchmind")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: migrations + cache purge + http client. Shutdown: close pools."""
    app.state.start_time = datetime.datetime.utcnow()
    logger.info("Starting SearchMind API v%s", settings.APP_VERSION)

    # Initialize the global HTTP client pool
    get_http_client()

    if settings.RUN_MIGRATIONS_ON_STARTUP:
        try:
            await asyncio.to_thread(run_migrations)
        except Exception as e:
            logger.exception("Database migration failed: %s", e)
            raise

    try:
        async with SessionLocal() as db:
            from app.utils.seeder import seed_search_logs
            await seed_search_logs(db)
    except Exception as e:
        logger.warning("Telemetry log seeding failed: %s", e)

    if settings.PURGE_EXPIRED_CACHE_ON_STARTUP:
        try:
            async with SessionLocal() as db:
                removed = await purge_expired_cached_results(db)
                if removed:
                    logger.info("Purged %d expired cached_results rows", removed)
        except Exception as e:
            logger.warning("Cache purge on startup failed (non-fatal): %s", e)

    yield

    await close_http_client()
    await close_redis()
    await engine.dispose()
    logger.info("SearchMind API shut down.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-native web search API for LangGraph, LangChain, RAG, and autonomous agents",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

setup_cors(app)

app.include_router(auth_router, prefix="/v1")
app.include_router(search.router, prefix="/v1")
app.include_router(extract.router, prefix="/v1")
app.include_router(crawl.router, prefix="/v1")
app.include_router(watch.router, prefix="/v1/watch")
app.include_router(action.router, prefix="/v1/action")
app.include_router(research.router, prefix="/v1")
app.include_router(usage.router, prefix="/v1")
app.include_router(api_keys.router, prefix="/v1")
app.include_router(admin.router, prefix="/v1")
app.include_router(coupons.router, prefix="/v1")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
        headers={"Access-Control-Allow-Origin": "*"}
    )


@app.get("/health", tags=["System"])
async def health(db: AsyncSession = Depends(get_db)):
    """Liveness probe with dependency checks (Postgres + Redis)."""
    checks: dict[str, str] = {"api": "ok", "database": "error", "redis": "error"}

    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        logger.warning("Health check database failed: %s", e)

    try:
        redis = await get_redis()
        await redis.ping()
        checks["redis"] = "ok"
    except Exception as e:
        logger.warning("Health check redis failed: %s", e)

    all_ok = all(v == "ok" for v in checks.values())
    return {
        "status": "ok" if all_ok else "degraded",
        "version": settings.APP_VERSION,
        "checks": checks,
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "name": "SearchMind API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "status": "operational",
    }
