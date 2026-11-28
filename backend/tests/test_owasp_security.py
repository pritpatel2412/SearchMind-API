import os
os.environ["DISABLE_PLAYWRIGHT"] = "1"
import sys
import asyncio
from fastapi import HTTPException
from starlette.requests import Request
from starlette.responses import Response

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.utils.url_utils import validate_safe_url
from app.middleware.security import SecurityHeadersMiddleware
from app.middleware.rate_limiter import check_ip_rate_limit, _in_memory_ip_cache
from app.config import settings

def test_ssrf_protection_blocks_private_and_metadata_targets():
    dangerous_urls = [
        "http://127.0.0.1:8000/v1/admin/users",
        "http://localhost:3000",
        "http://169.254.169.254/latest/meta-data/",
        "http://10.0.0.1/internal-api",
        "http://192.168.1.100:8080",
        "http://172.16.0.5/secrets",
        "file:///etc/passwd",
        "ftp://malicious.org/script.sh",
        "http://metadata.google.internal/computeMetadata/v1/",
        "http://0.0.0.0:8000"
    ]

    for url in dangerous_urls:
        blocked = False
        try:
            validate_safe_url(url)
        except HTTPException as e:
            blocked = True
            assert e.status_code == 400
        assert blocked, f"SSRF protection failed to block dangerous URL: {url}"

def test_ssrf_protection_allows_valid_public_urls():
    safe_urls = [
        "https://example.com",
        "https://www.google.com/search?q=test",
        "http://httpbin.org/get",
    ]
    for url in safe_urls:
        try:
            validate_safe_url(url)
        except HTTPException as e:
            pytest_fail = False
            # If DNS resolution in an isolated sandbox fails for real public domains, it should raise gaierror
            if "Could not resolve host" in e.detail:
                pass
            else:
                assert False, f"Safe URL unexpectedly blocked: {url} with error {e.detail}"

def test_security_headers_middleware():
    middleware = SecurityHeadersMiddleware(app=None)

    class DummyRequest:
        pass

    async def dummy_call_next(req):
        resp = Response(content="OK", media_type="text/plain")
        resp.headers["server"] = "uvicorn"
        return resp

    async def run_middleware():
        resp = await middleware.dispatch(DummyRequest(), dummy_call_next)
        assert resp.headers["X-Content-Type-Options"] == "nosniff"
        assert resp.headers["X-Frame-Options"] == "DENY"
        assert resp.headers["X-XSS-Protection"] == "1; mode=block"
        assert "Strict-Transport-Security" in resp.headers
        assert resp.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
        assert "Content-Security-Policy" in resp.headers
        assert "server" not in resp.headers

    asyncio.run(run_middleware())

def test_ip_rate_limiting_enforcement():
    _in_memory_ip_cache.clear()

    class MockClient:
        host = "203.0.113.195"

    class MockRequest:
        client = MockClient()
        headers = {}

    req = MockRequest()

    async def run_rate_limits():
        # First 3 should succeed
        for _ in range(3):
            await check_ip_rate_limit(req, scope="test_login", max_requests=3, window_seconds=60)

        # 4th should raise 429
        rate_limited = False
        try:
            await check_ip_rate_limit(req, scope="test_login", max_requests=3, window_seconds=60)
        except HTTPException as e:
            rate_limited = True
            assert e.status_code == 429
            assert "Too many requests" in e.detail

        assert rate_limited, "IP rate limiter failed to raise 429 on exceeding max requests"

    asyncio.run(run_rate_limits())

if __name__ == "__main__":
    test_ssrf_protection_blocks_private_and_metadata_targets()
    print("✓ SSRF blocked tests passed!")
    test_ssrf_protection_allows_valid_public_urls()
    print("✓ SSRF safe URL tests passed!")
    test_security_headers_middleware()
    print("✓ Security headers middleware tests passed!")
    test_ip_rate_limiting_enforcement()
    print("✓ IP rate limiting tests passed!")
    print("\nALL OWASP SECURITY TESTS PASSED SUCCESSFULLY!")
