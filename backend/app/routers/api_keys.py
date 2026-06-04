from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime, timezone
from app.schemas.api_key import CreateAPIKeyRequest, APIKeyResponse
from app.database import get_db
from app.models.api_key import APIKey
from app.models.user import User
from app.models.usage import UsageRecord
from app.auth.jwt_auth import get_current_user
from app.services.plan_service import get_plan_limits

router = APIRouter()


@router.post("/api-keys", response_model=APIKeyResponse, tags=["API Keys"])
async def create_api_key(
    request: CreateAPIKeyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new API key for the authenticated user."""
    plan_monthly, plan_rate = get_plan_limits(current_user.plan)

    monthly_limit = (
        request.monthly_limit if request.monthly_limit is not None else plan_monthly
    )
    rate_limit_per_min = (
        request.rate_limit_per_min
        if request.rate_limit_per_min is not None
        else plan_rate
    )

    full_key, prefix, hashed = APIKey.generate_key()
    new_key = APIKey(
        user_id=current_user.id,
        name=request.name,
        key_prefix=prefix,
        hashed_key=hashed,
        monthly_limit=monthly_limit,
        rate_limit_per_min=rate_limit_per_min,
    )
    db.add(new_key)
    await db.commit()
    await db.refresh(new_key)

    return APIKeyResponse(
        id=str(new_key.id),
        name=new_key.name,
        key_prefix=new_key.key_prefix,
        monthly_limit=new_key.monthly_limit,
        rate_limit_per_min=new_key.rate_limit_per_min,
        is_active=new_key.is_active,
        created_at=str(new_key.created_at),
        full_key=full_key,  # Only returned once at creation
        total_requests=0
    )


@router.get("/api-keys", response_model=List[APIKeyResponse], tags=["API Keys"])
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all active API keys for the authenticated user."""
    result = await db.execute(
        select(APIKey).where(
            APIKey.user_id == current_user.id,
            APIKey.is_active == True
        )
    )
    keys = result.scalars().all()
    
    now = datetime.now(timezone.utc)
    responses = []
    for k in keys:
        usage_res = await db.execute(
            select(UsageRecord).where(
                UsageRecord.api_key_id == k.id,
                UsageRecord.period_year == now.year,
                UsageRecord.period_month == now.month
            )
        )
        usage = usage_res.scalar_one_or_none()
        total_requests = 0
        if usage:
            total_requests = (
                usage.search_count
                + usage.extract_count
                + usage.crawl_count
                + usage.research_count
            )
        responses.append(
            APIKeyResponse(
                id=str(k.id),
                name=k.name,
                key_prefix=k.key_prefix,
                monthly_limit=k.monthly_limit,
                rate_limit_per_min=k.rate_limit_per_min,
                is_active=k.is_active,
                created_at=str(k.created_at),
                last_used_at=str(k.last_used_at) if k.last_used_at else None,
                total_requests=total_requests
            )
        )
    return responses


@router.delete("/api-keys/{key_id}", tags=["API Keys"])
async def revoke_api_key(
    key_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Revoke (deactivate) an API key."""
    result = await db.execute(
        select(APIKey).where(
            APIKey.id == key_id,
            APIKey.user_id == current_user.id
        )
    )
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="API key not found")
    key.is_active = False
    await db.commit()
    return {"message": "API key revoked successfully"}
