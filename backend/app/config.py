from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App General Settings
    APP_NAME: str = "SearchMind API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "dev_secret_key_must_be_long_for_security_reasons_123"

    # Database Settings — set DATABASE_URL in .env (Neon: postgresql+asyncpg://...?ssl=require)
    DATABASE_URL: str = "postgresql+asyncpg://searchmind:searchmindpass@localhost:5432/searchmind"

    # Redis Settings
    REDIS_URL: str = "redis://localhost:6379/0"

    # Search Provider Keys
    BRAVE_API_KEY: Optional[str] = ""
    SERPAPI_KEY: Optional[str] = None

    # LLM Settings (Replacing Anthropic Claude API keys with Groq / NIM compatibility)
    LLM_PROVIDER: str = "groq"  # groq | nvidia | openai
    LLM_API_KEY: Optional[str] = ""
    LLM_MODEL: str = "llama-3.3-70b-versatile"
    LLM_BASE_URL: str = "https://api.groq.com/openai/v1"

    # Rate Limits (Requests/min and monthly quotas per monetization plans)
    FREE_TOTAL_LIMIT: int = 500
    FREE_RATE_PER_MIN: int = 5
    STARTER_MONTHLY_LIMIT: int = 10000
    STARTER_RATE_PER_MIN: int = 30
    PRO_MONTHLY_LIMIT: int = 100000
    PRO_RATE_PER_MIN: int = 100

    # Cache Settings (TTL in seconds)
    SEARCH_CACHE_TTL: int = 3600       # 1 hour
    EXTRACT_CACHE_TTL: int = 86400     # 24 hours
    CRAWL_CACHE_TTL: int = 43200       # 12 hours

    # Playwright Fetch Config
    PLAYWRIGHT_TIMEOUT_MS: int = 15000

    # Crawl task limits
    CRAWL_MAX_CONTENT_LENGTH: int = 8000

    # Operations
    RUN_MIGRATIONS_ON_STARTUP: bool = True
    REQUIRE_REDIS_FOR_RATE_LIMIT: bool = True
    PURGE_EXPIRED_CACHE_ON_STARTUP: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        extra = "ignore"

settings = Settings()
