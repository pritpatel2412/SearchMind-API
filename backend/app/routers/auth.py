from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, EmailStr
from datetime import timedelta
import datetime
import httpx

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


def parse_user_agent(ua_string: str) -> dict:
    if not ua_string:
        return {"browser": "Unknown", "os": "Unknown", "device": "Unknown"}
    
    ua_lower = ua_string.lower()
    
    # Simple OS parsing
    if "windows" in ua_lower:
        os_name = "Windows"
    elif "macintosh" in ua_lower or "mac os" in ua_lower:
        os_name = "macOS"
    elif "linux" in ua_lower:
        os_name = "Linux"
    elif "android" in ua_lower:
        os_name = "Android"
    elif "iphone" in ua_lower or "ipad" in ua_lower:
        os_name = "iOS"
    else:
        os_name = "Unknown OS"
        
    # Simple Browser parsing
    if "edg/" in ua_lower or "edge/" in ua_lower:
        browser_name = "Microsoft Edge"
    elif "chrome/" in ua_lower or "chromium/" in ua_lower:
        browser_name = "Google Chrome"
    elif "safari/" in ua_lower and "chrome/" not in ua_lower:
        browser_name = "Safari"
    elif "firefox/" in ua_lower:
        browser_name = "Mozilla Firefox"
    elif "opera/" in ua_lower or "opr/" in ua_lower:
        browser_name = "Opera"
    else:
        # Check for client libraries
        if "python" in ua_lower:
            browser_name = "Python Client"
        elif "node" in ua_lower or "axios" in ua_lower:
            browser_name = "NodeJS Client"
        elif "curl" in ua_lower:
            browser_name = "Curl"
        else:
            browser_name = "Unknown Browser"
            
    # Simple Device parsing
    if "mobi" in ua_lower or "phone" in ua_lower:
        device_name = "Mobile"
    elif "tablet" in ua_lower or "ipad" in ua_lower:
        device_name = "Tablet"
    else:
        device_name = "Desktop"
        
    return {"browser": browser_name, "os": os_name, "device": device_name}


async def get_ip_geolocation(ip: str) -> dict:
    default_geo = {
        "region": "California",
        "country": "United States",
        "city": "San Francisco",
        "isp": "Local Provider"
    }
    
    # Check if local/loopback/private IP
    is_local = (
        ip == "127.0.0.1" or 
        ip == "::1" or 
        ip.startswith("192.168.") or 
        ip.startswith("10.") or 
        ip.startswith("172.16.") or
        ip == "localhost" or
        ip == "unknown" or
        not ip
    )
    
    target_ip = ip
    if is_local:
        # Try to resolve public IP of the host first
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get("https://api.ipify.org?format=json")
                if resp.status_code == 200:
                    target_ip = resp.json().get("ip", ip)
        except Exception:
            pass
            
    if target_ip and target_ip != "127.0.0.1" and target_ip != "::1" and target_ip != "unknown":
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(f"http://ip-api.com/json/{target_ip}")
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("status") == "success":
                        return {
                            "region": data.get("regionName", "Unknown"),
                            "country": data.get("country", "Unknown"),
                            "city": data.get("city", "Unknown"),
                            "isp": data.get("isp", "Unknown")
                        }
        except Exception:
            pass
            
    return default_geo


async def update_user_session_telemetry(user, req: Request, db: AsyncSession, meta: dict):
    # Extract client IP
    client_ip = req.headers.get("x-forwarded-for") or req.client.host if req.client else "unknown"
    if client_ip and "," in client_ip:
        client_ip = client_ip.split(",")[0].strip()
        
    ua = req.headers.get("user-agent") or ""
    ua_data = parse_user_agent(ua)
    geo_data = await get_ip_geolocation(client_ip)
    
    user.last_ip = client_ip
    user.user_agent = ua[:500]
    user.browser = ua_data["browser"]
    user.os = ua_data["os"]
    user.device = ua_data["device"]
    user.region = geo_data["region"]
    user.country = geo_data["country"]
    user.city = geo_data["city"]
    user.isp = geo_data["isp"]
    user.screen_resolution = meta.get("screen_resolution")
    user.language = meta.get("language")
    user.timezone = meta.get("timezone")
    user.last_login = datetime.datetime.utcnow()
    
    db.add(user)


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str = ""
    screen_resolution: str | None = None
    language: str | None = None
    timezone: str | None = None

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
    screen_resolution: str | None = None
    language: str | None = None
    timezone: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    plan: str
    full_key: str | None = None  # Only returned once on registration


@router.post("/auth/register", response_model=TokenResponse, tags=["Auth"])
async def register(request: RegisterRequest, req: Request, db: AsyncSession = Depends(get_db)):
    """Register a new user account and return a JWT + a first API key."""
    # Extract client IP
    client_ip = req.headers.get("x-forwarded-for") or req.client.host if req.client else "unknown"
    if client_ip and "," in client_ip:
        client_ip = client_ip.split(",")[0].strip()

    # Check IP limits (Max 3 accounts per IP)
    if client_ip != "unknown":
        ip_count_query = await db.execute(select(func.count(User.id)).where(User.created_from_ip == client_ip))
        ip_count = ip_count_query.scalar() or 0
        if ip_count >= 3:
            raise HTTPException(status_code=429, detail="Maximum number of accounts reached for this IP address.")

    # Check duplicate
    existing = await db.execute(select(User).where(User.email == request.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=request.email,
        hashed_password=get_password_hash(request.password),
        full_name=request.full_name,
        plan="free",
        created_from_ip=client_ip,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Save additional session/geoip metadata
    meta = {
        "screen_resolution": request.screen_resolution,
        "language": request.language,
        "timezone": request.timezone,
    }
    await update_user_session_telemetry(user, req, db, meta)
    await db.commit()

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
async def login(request: LoginRequest, req: Request, db: AsyncSession = Depends(get_db)):
    """Authenticate and return a JWT access token."""
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    # Update session/geoip metadata
    meta = {
        "screen_resolution": request.screen_resolution,
        "language": request.language,
        "timezone": request.timezone,
    }
    await update_user_session_telemetry(user, req, db, meta)
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
    )
