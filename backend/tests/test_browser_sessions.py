import os
import sys
import asyncio
from datetime import datetime, timedelta, timezone

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.schemas.session import (
    SessionCookie,
    CreateSessionRequest,
    InjectCookiesRequest,
    SessionResponse,
    SessionDetailResponse,
)
from app.schemas.action import WebAction, ActionRequest, ActionResponse
from app.services.session_service import session_manager, PersistentBrowserSession
from app.services.action_service import execute_web_actions

def test_session_cookie_models():
    cookie = SessionCookie(
        name="auth_token",
        value="secret_jwt_xyz",
        domain=".example.com",
        path="/",
        secure=True,
        http_only=True
    )
    assert cookie.name == "auth_token"
    assert cookie.secure is True
    assert cookie.http_only is True

    req = CreateSessionRequest(
        initial_url="https://example.com/dashboard",
        cookies=[cookie],
        ttl_seconds=3600
    )
    assert req.initial_url == "https://example.com/dashboard"
    assert len(req.cookies) == 1
    assert req.ttl_seconds == 3600

def test_session_lifecycle_and_cookie_injection():
    req = CreateSessionRequest(
        initial_url="https://app.example.com",
        cookies=[
            SessionCookie(name="session_id", value="sess_initial")
        ],
        ttl_seconds=1800
    )
    created: SessionDetailResponse = asyncio.run(session_manager.create_session(req, user_id="user_test_123"))
    session_id = created.session_id
    assert session_id.startswith("sess_")
    assert created.active is True
    assert created.cookies_count == 1
    assert created.current_url == "https://app.example.com"

    # Inject new cookies
    new_cookies = [
        SessionCookie(name="oauth_state", value="state_abc"),
        SessionCookie(name="theme", value="dark")
    ]
    injected_count = asyncio.run(session_manager.inject_cookies(session_id, new_cookies))
    assert injected_count == 2

    # Verify cookie vault
    vault = asyncio.run(session_manager.get_cookies(session_id))
    assert len(vault) == 3
    cookie_names = [c.name for c in vault]
    assert "session_id" in cookie_names
    assert "oauth_state" in cookie_names
    assert "theme" in cookie_names

def test_stateful_session_action_execution():
    req = CreateSessionRequest(
        initial_url="https://app.example.com/login",
        ttl_seconds=1800
    )
    created = asyncio.run(session_manager.create_session(req, user_id="user_test_123"))
    session_id = created.session_id

    # Execute action referencing this persistent session
    actions = [
        WebAction(action_type="wait", wait_ms=50)
    ]
    resp: ActionResponse = asyncio.run(execute_web_actions(
        url="https://app.example.com/dashboard",
        actions=actions,
        session_id=session_id
    ))

    assert resp.success is True
    assert resp.session_id == session_id
    assert resp.url == "https://app.example.com/dashboard"

    # Check that session history updated
    session = asyncio.run(session_manager.get_session(session_id))
    assert session is not None
    assert session.current_url == "https://app.example.com/dashboard"
    assert "https://app.example.com/dashboard" in session.history

def test_session_lease_and_expiration():
    short_lived = PersistentBrowserSession(
        session_id="sess_expired_test",
        ttl_seconds=-10 # Expired immediately in the past
    )
    assert short_lived.is_expired() is True

    short_lived.refresh_lease(additional_seconds=3600)
    assert short_lived.is_expired() is False

def test_session_termination():
    req = CreateSessionRequest(
        initial_url="https://app.example.com/logout",
        ttl_seconds=1800
    )
    created = asyncio.run(session_manager.create_session(req))
    session_id = created.session_id

    # Delete session
    deleted = asyncio.run(session_manager.delete_session(session_id))
    assert deleted is True

    # Ensure retrieval returns None
    retrieved = asyncio.run(session_manager.get_session(session_id))
    assert retrieved is None

if __name__ == "__main__":
    print("Running persistent browser session tests directly...", flush=True)
    test_session_cookie_models()
    print("PASS: test_session_cookie_models", flush=True)
    test_session_lifecycle_and_cookie_injection()
    print("PASS: test_session_lifecycle_and_cookie_injection", flush=True)
    test_stateful_session_action_execution()
    print("PASS: test_stateful_session_action_execution", flush=True)
    test_session_lease_and_expiration()
    print("PASS: test_session_lease_and_expiration", flush=True)
    test_session_termination()
    print("PASS: test_session_termination", flush=True)
    print("ALL 5 PERSISTENT BROWSER SESSION TESTS PASSED!", flush=True)
