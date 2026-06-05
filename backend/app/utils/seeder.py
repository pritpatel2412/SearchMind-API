import random
import datetime
import uuid
import math
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.search_log import SearchLog
from app.models.user import User
from app.models.api_key import APIKey

async def seed_search_logs(db: AsyncSession):
    """Seed search logs with realistic time series patterns if count is low."""
    try:
        # Check if we already have logs
        result = await db.execute(select(func.count(SearchLog.id)))
        count = result.scalar() or 0
        if count >= 1000:
            return

        # Clean up existing search logs before seeding a full 7 days of data
        from sqlalchemy import delete
        await db.execute(delete(SearchLog))

        # Find the first user and API key to make it link correctly
        user_result = await db.execute(select(User).limit(1))
        user = user_result.scalar_one_or_none()
        user_id = user.id if user else None

        key_id = None
        if user_id:
            key_result = await db.execute(select(APIKey).where(APIKey.user_id == user_id).limit(1))
            key = key_result.scalar_one_or_none()
            key_id = key.id if key else None

        # Generate logs for the last 7 days (168 hours)
        now = datetime.datetime.utcnow()
        logs_to_add = []
        
        queries = [
            "python fastapi tutorial", "langchain agent RAG", "brave search api documentation",
            "how to scale celery workers", "redis cache invalidation strategies",
            "duckduckgo html search query", "structured output with openai sdk",
            "extract text from js heavy website playwright", "langgraph graph traversal",
            "neon postgres serverless connection pool", "celery task queue postgres",
            "ai search engine for developer portal", "scrape copyright content with trafilatura"
        ]
        
        endpoints = ["search", "extract", "crawl", "research"]
        
        for i in range(168): # 168 hours (7 days)
            hour_dt = now - datetime.timedelta(hours=i)
            # Calculate a realistic request count for this hour using a sine wave
            # Peak around hour 16 (4 PM), low around hour 4 (4 AM)
            hour_val = hour_dt.hour
            base_count = int(25 + 12 * math.sin((hour_val - 8) * math.pi / 12) + random.randint(-4, 4))
            if base_count < 5:
                base_count = 5
                
            for _ in range(base_count):
                endpoint = random.choice(endpoints)
                query = random.choice(queries) if endpoint in ["search", "research"] else f"https://example.com/docs/{random.randint(1,100)}"
                
                # Latency ranges: search is 80-240ms, research is 1500-3500ms, extract/crawl is 250-750ms
                if endpoint == "search":
                    latency = random.randint(80, 240)
                elif endpoint == "research":
                    latency = random.randint(1500, 3500)
                else:
                    latency = random.randint(250, 750)
                    
                cached = random.random() < 0.35 # 35% cache hits
                if cached:
                    latency = random.randint(5, 15) # fast cache hits
                    
                status_code = 200
                if random.random() < 0.01: # 1% error rate
                    status_code = random.choice([500, 502, 504])
                    
                # Log timestamp slightly randomized within this hour
                log_time = hour_dt.replace(
                    minute=random.randint(0, 59),
                    second=random.randint(0, 59),
                    microsecond=random.randint(0, 999999)
                )
                
                log = SearchLog(
                    id=uuid.uuid4(),
                    api_key_id=key_id,
                    user_id=user_id,
                    endpoint=endpoint,
                    query=query,
                    results_count=random.randint(5, 20) if endpoint == "search" else None,
                    cached=cached,
                    latency_ms=latency,
                    tokens_used=random.randint(200, 1500) if endpoint in ["search", "research"] else 0,
                    ip_address="127.0.0.1",
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    status_code=status_code,
                    error_message="Gateway Timeout" if status_code >= 500 else None,
                    created_at=log_time
                )
                logs_to_add.append(log)
                
        db.add_all(logs_to_add)
        await db.commit()
        print(f"Seeded {len(logs_to_add)} search logs successfully!")
    except Exception as e:
        print(f"Telemetry log seeding failed: {e}")
