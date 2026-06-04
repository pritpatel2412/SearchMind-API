from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.models.usage import UsageRecord
from app.models.api_key import APIKey

async def track_usage(
    db: AsyncSession,
    api_key: APIKey,
    endpoint: str,
    result_count: int = 0,
    tokens_used: int = 0
) -> None:
    """
    Log usage statistics for a given API key and endpoint.
    Inserts or updates a row in the usage_records database table.
    """
    now = datetime.utcnow()
    
    # Query for an existing usage record for the current month and year
    stmt = select(UsageRecord).where(
        UsageRecord.user_id == api_key.user_id,
        UsageRecord.api_key_id == api_key.id,
        UsageRecord.period_year == now.year,
        UsageRecord.period_month == now.month
    )
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()

    if not record:
        record = UsageRecord(
            user_id=api_key.user_id,
            api_key_id=api_key.id,
            period_year=now.year,
            period_month=now.month,
            search_count=0,
            extract_count=0,
            crawl_count=0,
            research_count=0,
            total_tokens=0
        )
        db.add(record)

    # Increment appropriate counter
    endpoint = endpoint.lower()
    if endpoint == "search":
        record.search_count += 1
    elif endpoint == "extract":
        record.extract_count += 1
    elif endpoint == "crawl":
        record.crawl_count += 1
    elif endpoint == "research":
        record.research_count += 1

    if tokens_used > 0:
        record.total_tokens += tokens_used

    record.updated_at = now
    await db.commit()
