from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from datetime import timedelta

from app.database import get_db
from app.models.user import User
from app.models.api_key import APIKey
from app.auth.jwt_auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from app.services.plan_service import get_plan_limits

router = APIRouter()


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str = ""

    model_config = {
        "json_schema_extra": {
            "example": {
                "email": "you@example.com",
                "password": "your-secure-password",
                "full_name": "Your Name",
            }
        }
    }


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    plan: str
    full_key: str | None = None  # Only returned once on registration


@router.post("/auth/register", response_model=TokenResponse, tags=["Auth"])
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account and return a JWT + a first API key."""
    # Check duplicate
    existing = await db.execute(select(User).where(User.email == request.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=request.email,
        hashed_password=get_password_hash(request.password),
        full_name=request.full_name,
        plan="free",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    monthly_limit, rate_limit_per_min = get_plan_limits(user.plan)

    full_key, prefix, hashed = APIKey.generate_key()
    default_key = APIKey(
        user_id=user.id,
        name="Default Key",
        key_prefix=prefix,
        hashed_key=hashed,
        monthly_limit=monthly_limit,
        rate_limit_per_min=rate_limit_per_min,
    )
    db.add(default_key)
    await db.commit()

    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        email=user.email,
        plan=user.plan,
        full_key=full_key,
    )


@router.post("/auth/login", response_model=TokenResponse, tags=["Auth"])
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and return a JWT access token."""
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return TokenResponse(
        access_token=token,
        user_id=str(user.id),
        email=user.email,
        plan=user.plan,
    )
