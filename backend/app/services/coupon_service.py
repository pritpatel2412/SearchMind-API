import uuid
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.coupon import Coupon, CouponRedemption
from app.models.api_key import APIKey
from app.services.plan_service import get_plan_limits

async def check_and_apply_coupon_expiration(user: User, db: AsyncSession) -> bool:
    """
    Check if the user has an active coupon redemption that has expired.
    If expired, revert user's plan to original plan and update API keys.
    Returns True if an expiration occurred, False otherwise.
    """
    if not user:
        return False

    result = await db.execute(
        select(CouponRedemption)
        .where(
            CouponRedemption.user_id == user.id,
            CouponRedemption.status == "active"
        )
    )
    redemption = result.scalar_one_or_none()
    if not redemption:
        return False

    now = datetime.now(timezone.utc)
    expires_at = redemption.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if now > expires_at:
        # Revert plan
        original_plan = redemption.original_plan
        user.plan = original_plan
        redemption.status = "expired"

        # Update API key limits
        monthly_limit, rate_limit = get_plan_limits(original_plan)
        keys_result = await db.execute(
            select(APIKey).where(APIKey.user_id == user.id, APIKey.is_active == True)
        )
        keys = keys_result.scalars().all()
        for k in keys:
            k.monthly_limit = monthly_limit
            k.rate_limit_per_min = rate_limit

        db.add(user)
        db.add(redemption)
        await db.commit()
        return True

    return False

async def redeem_coupon_code(user: User, code: str, db: AsyncSession) -> CouponRedemption:
    """
    Redeem a coupon code for the user. Upgrades user's plan and API keys.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not authenticated"
        )

    # 1. Check coupon exists and is active
    result = await db.execute(
        select(Coupon).where(Coupon.code == code, Coupon.is_active == True)
    )
    coupon = result.scalar_one_or_none()
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or inactive coupon code"
        )

    # 2. Check time validity
    now = datetime.now(timezone.utc)
    valid_from = coupon.valid_from
    if valid_from.tzinfo is None:
        valid_from = valid_from.replace(tzinfo=timezone.utc)
    valid_to = coupon.valid_to
    if valid_to.tzinfo is None:
        valid_to = valid_to.replace(tzinfo=timezone.utc)

    if now < valid_from or now > valid_to:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon code has expired or is not yet active"
        )

    # 3. Check redemption limit
    if coupon.redemption_count >= coupon.max_redemptions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon redemption limit reached"
        )

    # 4. Check if user already redeemed this specific coupon
    already_redeemed_result = await db.execute(
        select(CouponRedemption)
        .where(
            CouponRedemption.user_id == user.id,
            CouponRedemption.coupon_id == coupon.id
        )
    )
    if already_redeemed_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already redeemed this coupon"
        )

    # 5. Check if user has any active coupon redemption currently
    active_redemption_result = await db.execute(
        select(CouponRedemption)
        .where(
            CouponRedemption.user_id == user.id,
            CouponRedemption.status == "active"
        )
    )
    if active_redemption_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active promotion plan"
        )

    # 6. Apply redemption
    original_plan = user.plan
    expires_at = now + timedelta(days=coupon.duration_days)

    redemption = CouponRedemption(
        id=uuid.uuid4(),
        user_id=user.id,
        coupon_id=coupon.id,
        original_plan=original_plan,
        redeemed_at=now,
        expires_at=expires_at,
        status="active"
    )

    # Upgrade user plan
    user.plan = coupon.target_plan
    coupon.redemption_count += 1

    # Upgrade active API keys limits
    monthly_limit, rate_limit = get_plan_limits(coupon.target_plan)
    keys_result = await db.execute(
        select(APIKey).where(APIKey.user_id == user.id, APIKey.is_active == True)
    )
    keys = keys_result.scalars().all()
    for k in keys:
        k.monthly_limit = monthly_limit
        k.rate_limit_per_min = rate_limit

    db.add(redemption)
    db.add(user)
    db.add(coupon)
    await db.commit()
    await db.refresh(redemption)

    return redemption
