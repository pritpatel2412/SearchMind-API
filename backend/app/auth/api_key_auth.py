from fastapi import Security, HTTPException, status, Depends, Header
from fastapi.security import APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from typing import Optional

from app.database import get_db
from app.models.api_key import APIKey
from app.auth.jwt_auth import get_current_user

# Disable auto_error so we can manually handle fallback authentication when X-API-Key is missing/default
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

async def get_current_api_key(
    api_key: Optional[str] = Security(API_KEY_HEADER),
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db)
) -> APIKey:
    """Validate incoming API key by hash check, with fallback to Bearer JWT token for portal playground usage."""
    key_obj = None

    # 1. Attempt X-API-Key validation if provided and not the default placeholder
    if api_key and api_key != 'sm_live_YOUR_KEY':
        hashed = APIKey.hash_key(api_key)
        result = await db.execute(
            select(APIKey).where(
                APIKey.hashed_key == hashed,
                APIKey.is_active == True
            )
        )
        key_obj = result.scalar_one_or_none()

    # 2. Fall back to Bearer token authentication (primarily for portal playground actions)
    if not key_obj and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            # Resolve user from JWT token
            user = await get_current_user(token=token, db=db)
            if user:
                # Find the user's active API key
                result = await db.execute(
                    select(APIKey).where(
                        APIKey.user_id == user.id,
                        APIKey.is_active == True
                    )
                )
                key_obj = result.scalar_one_or_none()
                
                # If no active key exists for the user, create a default playground key on the fly
                if not key_obj:
                    full_key, prefix, hashed_key = APIKey.generate_key()
                    key_obj = APIKey(
                        user_id=user.id,
                        name="Playground Auto Key",
                        key_prefix=prefix,
                        hashed_key=hashed_key,
                        monthly_limit=1000,
                        rate_limit_per_min=10
                    )
                    db.add(key_obj)
                    await db.commit()
                    await db.refresh(key_obj)
        except Exception:
            pass

    if not key_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or inactive API key",
            headers={"WWW-Authenticate": "ApiKey"}
        )

    # Use timezone-aware comparison
    now = datetime.now(timezone.utc)
    
    # Verify expiration
    if key_obj.expires_at:
        expires_at = key_obj.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key has expired"
            )

    # Update last used timestamp
    key_obj.last_used_at = now
    await db.commit()

    return key_obj
