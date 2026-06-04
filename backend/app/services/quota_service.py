"""Monthly quota enforcement using PostgreSQL usage_records (single source of truth)."""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_key import APIKey
from app.models.usage import UsageRecord


async def get_monthly_request_total(db: AsyncSession, api_key: APIKey) -> int:
    """Total metered API requests for the current calendar month."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(UsageRecord).where(
            UsageRecord.api_key_id == api_key.id,
            UsageRecord.period_year == now.year,
            UsageRecord.period_month == now.month,
        )
    )
    usage = result.scalar_one_or_none()
    if not usage:
        return 0
    return (
        usage.search_count
        + usage.extract_count
        + usage.crawl_count
        + usage.research_count
    )


async def check_monthly_quota(db: AsyncSession, api_key: APIKey) -> None:
    """
    Reject the request when the API key has reached its monthly limit.
    Uses the same counters as GET /v1/usage and usage_tracker.
    """
    total = await get_monthly_request_total(db, api_key)
    limit = api_key.monthly_limit
    if total >= limit:
        remaining = max(0, limit - total)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Monthly usage limit exceeded ({total}/{limit} requests). "
                f"Remaining: {remaining}. Upgrade your plan or wait until next month."
            ),
            headers={
                "X-Monthly-Limit": str(limit),
                "X-Monthly-Used": str(total),
                "X-Monthly-Remaining": str(remaining),
            },
        )
