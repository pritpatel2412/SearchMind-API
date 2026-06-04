from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from app.config import settings


def _connect_args(database_url: str) -> dict:
    """SSL for Neon and other managed Postgres hosts (asyncpg)."""
    url_lower = database_url.lower()
    if "neon.tech" in url_lower or "ssl=require" in url_lower or "sslmode=require" in url_lower:
        return {"ssl": True}
    return {}


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    connect_args=_connect_args(settings.DATABASE_URL),
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db() -> AsyncSession:
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
