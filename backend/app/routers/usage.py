from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import Optional
import uuid

from app.database import get_db
from app.models.usage import UsageRecord
from app.models.api_key import APIKey
from app.auth.api_key_auth import get_current_api_key
from app.auth.jwt_auth import get_current_user
from app.schemas.usage import UsageResponse
from app.models.user import User
from app.models.search_log import SearchLog

router = APIRouter()

async def get_current_user_or_api_key(
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
):
    # Try JWT if Authorization header is present
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            user = await get_current_user(token=token, db=db)
            return user
        except Exception:
            pass

    # Try API Key if X-API-Key header is present
    if x_api_key:
        try:
            api_key = await get_current_api_key(api_key=x_api_key, db=db)
            return api_key
        except Exception:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated"
    )

@router.get("/usage", response_model=UsageResponse, tags=["Usage"])
async def get_usage(
    api_key_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    auth_obj = Depends(get_current_user_or_api_key)
):
    """
    Get API usage statistics for the current calendar period.
    Supports Bearer token (JWT) authentication for user-level aggregates or
    X-API-Key header for key-specific statistics.
    """
    now = datetime.now(timezone.utc)
    
    if isinstance(auth_obj, User):
        user = auth_obj
        # Query usage records for this user
        query = select(UsageRecord).where(
            UsageRecord.user_id == user.id,
            UsageRecord.period_year == now.year,
            UsageRecord.period_month == now.month
        )
        if api_key_id:
            try:
                key_uuid = uuid.UUID(api_key_id)
                query = query.where(UsageRecord.api_key_id == key_uuid)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid api_key_id format")
                
        result = await db.execute(query)
        records = result.scalars().all()
        
        search = sum(r.search_count for r in records)
        extract = sum(r.extract_count for r in records)
        crawl = sum(r.crawl_count for r in records)
        research = sum(r.research_count for r in records)
        tokens = sum(r.total_tokens for r in records)
        total = search + extract + crawl + research
        
        # Get limits
        from app.services.plan_service import get_plan_limits
        plan_monthly, _ = get_plan_limits(user.plan)
        limit = plan_monthly
        
        if api_key_id:
            key_result = await db.execute(
                select(APIKey).where(APIKey.id == uuid.UUID(api_key_id), APIKey.user_id == user.id)
            )
            key_obj = key_result.scalar_one_or_none()
            if key_obj:
                limit = key_obj.monthly_limit
                
        remaining = max(0, limit - total)
        percentage = round((total / limit) * 100, 2) if limit > 0 else 100.0
        
    else:
        api_key = auth_obj
        result = await db.execute(
            select(UsageRecord).where(
                UsageRecord.api_key_id == api_key.id,
                UsageRecord.period_year == now.year,
                UsageRecord.period_month == now.month
            )
        )
        usage = result.scalar_one_or_none()
        
        search = usage.search_count if usage else 0
        extract = usage.extract_count if usage else 0
        crawl = usage.crawl_count if usage else 0
        research = usage.research_count if usage else 0
        tokens = usage.total_tokens if usage else 0
        total = search + extract + crawl + research
        
        limit = api_key.monthly_limit
        remaining = max(0, limit - total)
        percentage = round((total / limit) * 100, 2) if limit > 0 else 100.0

    return UsageResponse(
        period=f"{now.year}-{now.month:02d}",
        search_count=search,
        extract_count=extract,
        crawl_count=crawl,
        research_count=research,
        total_requests=total,
        total_tokens=tokens,
        monthly_limit=limit,
        remaining_requests=remaining,
        percentage_used=percentage
    )


@router.get("/logs", tags=["Usage"])
async def get_logs(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    auth_obj = Depends(get_current_user_or_api_key)
):
    """
    Get recent search/API logs for the authenticated user or API key.
    """
    if isinstance(auth_obj, User):
        user = auth_obj
        query = select(SearchLog).where(
            SearchLog.user_id == user.id
        ).order_by(SearchLog.created_at.desc()).limit(limit)
    else:
        api_key = auth_obj
        query = select(SearchLog).where(
            SearchLog.api_key_id == api_key.id
        ).order_by(SearchLog.created_at.desc()).limit(limit)

    result = await db.execute(query)
    logs = result.scalars().all()

    return [
        {
            "id": str(log.id),
            "endpoint": log.endpoint,
            "query": log.query,
            "latency_ms": log.latency_ms,
            "status_code": log.status_code,
            "error_message": log.error_message,
            "created_at": log.created_at.isoformat() if log.created_at else None
        }
        for log in logs
    ]
