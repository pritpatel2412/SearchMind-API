import math
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from pydantic import BaseModel
from datetime import datetime, timezone

from app.database import get_db
from app.models.user import User
from app.models.coupon import CouponRedemption
from app.auth.jwt_auth import get_current_user
from app.services.coupon_service import redeem_coupon_code

router = APIRouter()

class RedeemRequest(BaseModel):
    code: str

@router.post("/coupons/redeem", tags=["Coupons"])
async def redeem(
    request: RedeemRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Redeem a coupon code to upgrade the user's plan."""
    code_clean = request.code.strip()
    if not code_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon code cannot be empty"
        )
    
    redemption = await redeem_coupon_code(user, code_clean, db)
    return {
        "status": "success",
        "message": "Coupon redeemed successfully",
        "plan": user.plan,
        "expires_at": redemption.expires_at.isoformat()
    }

@router.get("/coupons/active", tags=["Coupons"])
async def get_active_coupon(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve details of the user's active coupon plan, if any."""
    result = await db.execute(
        select(CouponRedemption)
        .options(joinedload(CouponRedemption.coupon))
        .where(
            CouponRedemption.user_id == user.id,
            CouponRedemption.status == "active"
        )
    )
    redemption = result.scalar_one_or_none()
    if not redemption:
        return None

    now = datetime.now(timezone.utc)
    expires_at = redemption.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    delta = expires_at - now
    days_remaining = max(0, math.ceil(delta.total_seconds() / 86400))

    return {
        "code": redemption.coupon.code,
        "expires_at": redemption.expires_at.isoformat(),
        "days_remaining": days_remaining,
        "target_plan": redemption.coupon.target_plan
    }
