from fastapi import Security, HTTPException, status, Depends
from fastapi.security import APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.database import get_db
from app.models.api_key import APIKey

API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=True)

async def get_current_api_key(
    api_key: str = Security(API_KEY_HEADER),
    db: AsyncSession = Depends(get_db)
) -> APIKey:
    """Validate incoming API key by checking SHA-256 hash in database."""
    hashed = APIKey.hash_key(api_key)
    result = await db.execute(
        select(APIKey).where(
            APIKey.hashed_key == hashed,
            APIKey.is_active == True
        )
    )
    key_obj = result.scalar_one_or_none()

    if not key_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or inactive API key",
            headers={"WWW-Authenticate": "ApiKey"}
        )

    # Use timezone-aware comparison
    now = datetime.now(timezone.utc)
    # Check expires_at
    if key_obj.expires_at:
        # Ensure expires_at has timezone info
        expires_at = key_obj.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key has expired"
            )

    # Update last_used_at
    key_obj.last_used_at = now
    await db.commit()

    return key_obj
