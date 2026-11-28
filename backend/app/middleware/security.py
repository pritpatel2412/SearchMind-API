from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Enforces strict OWASP Recommended HTTP Security Headers on every response.
    Protects against XSS, clickjacking, MIME sniffing, and enforces HTTPS transport security.
    """
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        # 1. Prevent MIME-sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # 2. Prevent Clickjacking (framing)
        response.headers["X-Frame-Options"] = "DENY"

        # 3. Legacy XSS filter protection
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # 4. HTTP Strict Transport Security (HSTS - 1 year, include subdomains, preload)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        # 5. Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # 6. Permissions / Feature Policy
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), camera=(), geolocation=(), gyroscope=(), "
            "magnetometer=(), microphone=(), payment=(), usb=()"
        )

        # 7. Content Security Policy (strict defaults for JSON REST API / Portal)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';"
        )

        # 8. Mask server banner
        if "server" in response.headers:
            del response.headers["server"]

        return response
