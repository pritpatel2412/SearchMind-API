"""Plan tier limits for API keys (monthly quota + per-minute rate)."""

from app.config import settings


PLAN_LIMITS: dict[str, tuple[int, int]] = {
    "free": (settings.FREE_TOTAL_LIMIT, settings.FREE_RATE_PER_MIN),
    "starter": (settings.STARTER_MONTHLY_LIMIT, settings.STARTER_RATE_PER_MIN),
    "pro": (settings.PRO_MONTHLY_LIMIT, settings.PRO_RATE_PER_MIN),
    "enterprise": (10_000_000, 1000),
}


def get_plan_limits(plan: str) -> tuple[int, int]:
    """Return (monthly_limit, rate_limit_per_min) for a subscription plan."""
    return PLAN_LIMITS.get((plan or "free").lower(), PLAN_LIMITS["free"])
