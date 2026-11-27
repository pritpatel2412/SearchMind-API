import uuid
import time
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any

try:
    from playwright.async_api import async_playwright, BrowserContext, Page
except ImportError:
    async_playwright = None
    BrowserContext = None
    Page = None

from app.schemas.session import (
    SessionCookie,
    CreateSessionRequest,
    SessionResponse,
    SessionDetailResponse,
)

logger = logging.getLogger("searchmind.session")

DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SearchMindAgent/1.0"

class PersistentBrowserSession:
    """Encapsulates the state and active Playwright context of a persistent browser session."""
    def __init__(
        self,
        session_id: str,
        user_id: Optional[str] = None,
        initial_url: Optional[str] = None,
        cookies: Optional[List[SessionCookie]] = None,
        user_agent: Optional[str] = None,
        viewport: Optional[Dict[str, int]] = None,
        ttl_seconds: int = 1800,
    ):
        self.session_id = session_id
        self.user_id = user_id
        self.created_at = datetime.now(timezone.utc)
        self.expires_at = self.created_at + timedelta(seconds=ttl_seconds)
        self.current_url = initial_url
        self.user_agent = user_agent or DEFAULT_USER_AGENT
        self.viewport = viewport or {"width": 1280, "height": 800}
        self.history: List[str] = [initial_url] if initial_url else []
        self.is_active = True

        # In-memory cookie vault
        self._cookies: Dict[str, SessionCookie] = {}
        if cookies:
            for c in cookies:
                self._cookies[c.name] = c

        # Live browser context handles
        self.playwright_handle: Optional[Any] = None
        self.browser: Optional[Any] = None
        self.context: Optional[Any] = None
        self.page: Optional[Any] = None
        self.lock = asyncio.Lock()

    def is_expired(self) -> bool:
        return datetime.now(timezone.utc) > self.expires_at

    def refresh_lease(self, additional_seconds: int = 1800) -> None:
        self.expires_at = datetime.now(timezone.utc) + timedelta(seconds=additional_seconds)

    def to_response(self) -> SessionResponse:
        return SessionResponse(
            session_id=self.session_id,
            status="active" if self.is_active and not self.is_expired() else "closed",
            created_at=self.created_at.isoformat(),
            expires_at=self.expires_at.isoformat(),
            current_url=self.current_url,
            cookies_count=len(self._cookies),
            active=self.is_active and not self.is_expired(),
        )

    def to_detail_response(self) -> SessionDetailResponse:
        return SessionDetailResponse(
            session_id=self.session_id,
            status="active" if self.is_active and not self.is_expired() else "closed",
            created_at=self.created_at.isoformat(),
            expires_at=self.expires_at.isoformat(),
            current_url=self.current_url,
            cookies_count=len(self._cookies),
            active=self.is_active and not self.is_expired(),
            cookies=list(self._cookies.values()),
            history=self.history,
            user_agent=self.user_agent,
            viewport=self.viewport,
        )

    async def initialize_playwright(self) -> None:
        """Initializes a real persistent Playwright browser context if playwright is installed."""
        if not async_playwright:
            logger.info("Playwright not installed; session %s operating in headless state container mode.", self.session_id)
            return

        try:
            self.playwright_handle = await async_playwright().start()
            self.browser = await self.playwright_handle.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
            )
            self.context = await self.browser.new_context(
                user_agent=self.user_agent,
                viewport=self.viewport,
            )
            # Inject vault cookies into context
            if self._cookies:
                pw_cookies = []
                for c in self._cookies.values():
                    ck_dict: Dict[str, Any] = {"name": c.name, "value": c.value, "path": c.path}
                    if c.domain:
                        ck_dict["domain"] = c.domain
                    elif self.current_url:
                        from urllib.parse import urlparse
                        ck_dict["domain"] = urlparse(self.current_url).netloc
                    else:
                        ck_dict["url"] = "https://default.local"
                    if c.expires:
                        ck_dict["expires"] = c.expires
                    if c.http_only:
                        ck_dict["httpOnly"] = c.http_only
                    if c.secure:
                        ck_dict["secure"] = c.secure
                    if c.same_site:
                        ck_dict["sameSite"] = c.same_site
                    pw_cookies.append(ck_dict)
                try:
                    await self.context.add_cookies(pw_cookies)
                except Exception as ce:
                    logger.warning("Failed injecting initial cookies: %s", ce)

            self.page = await self.context.new_page()
            if self.current_url:
                await self.page.goto(self.current_url, wait_until="domcontentloaded", timeout=15000)
                await self.page.wait_for_timeout(500)
                self.current_url = self.page.url
        except Exception as e:
            logger.warning("Playwright initialization error for session %s: %s", self.session_id, e)

    async def sync_cookies_from_browser(self) -> None:
        """Pulls latest cookies from live Playwright context back into vault."""
        if self.context:
            try:
                live_cookies = await self.context.cookies()
                for c in live_cookies:
                    self._cookies[c["name"]] = SessionCookie(
                        name=c["name"],
                        value=c["value"],
                        domain=c.get("domain"),
                        path=c.get("path", "/"),
                        expires=c.get("expires"),
                        http_only=c.get("httpOnly", False),
                        secure=c.get("secure", False),
                        same_site=c.get("sameSite", "Lax"),
                    )
            except Exception as e:
                logger.debug("Failed to sync cookies from browser context: %s", e)

    async def close(self) -> None:
        """Terminates live page, browser, and playwright instance."""
        async with self.lock:
            self.is_active = False
            if self.context:
                await self.sync_cookies_from_browser()
            try:
                if self.page:
                    await self.page.close()
                if self.context:
                    await self.context.close()
                if self.browser:
                    await self.browser.close()
                if self.playwright_handle:
                    await self.playwright_handle.stop()
            except Exception as e:
                logger.debug("Error closing session resources: %s", e)
            finally:
                self.page = None
                self.context = None
                self.browser = None
                self.playwright_handle = None


class SessionManager:
    """Singleton registry tracking active stateful browser sessions."""
    def __init__(self):
        self._sessions: Dict[str, PersistentBrowserSession] = {}
        self._lock = asyncio.Lock()

    async def create_session(
        self,
        req: CreateSessionRequest,
        user_id: Optional[str] = None
    ) -> SessionDetailResponse:
        session_id = f"sess_{uuid.uuid4().hex[:16]}"
        session = PersistentBrowserSession(
            session_id=session_id,
            user_id=user_id,
            initial_url=req.initial_url,
            cookies=req.cookies,
            user_agent=req.user_agent,
            viewport=req.viewport,
            ttl_seconds=req.ttl_seconds,
        )
        await session.initialize_playwright()

        async with self._lock:
            self._sessions[session_id] = session

        return session.to_detail_response()

    async def get_session(self, session_id: str) -> Optional[PersistentBrowserSession]:
        self.clean_expired()
        async with self._lock:
            session = self._sessions.get(session_id)
            if session and not session.is_expired() and session.is_active:
                session.refresh_lease()
                return session
            return None

    def list_sessions(self, user_id: Optional[str] = None) -> List[SessionResponse]:
        self.clean_expired()
        results = []
        for s in self._sessions.values():
            if s.is_active and not s.is_expired():
                if user_id is None or s.user_id == user_id:
                    results.append(s.to_response())
        return results

    async def delete_session(self, session_id: str) -> bool:
        async with self._lock:
            session = self._sessions.pop(session_id, None)
        if session:
            await session.close()
            return True
        return False

    async def inject_cookies(self, session_id: str, cookies: List[SessionCookie]) -> int:
        session = await self.get_session(session_id)
        if not session:
            return 0
        async with session.lock:
            for c in cookies:
                session._cookies[c.name] = c
            if session.context:
                pw_cookies = []
                for c in cookies:
                    cd = {"name": c.name, "value": c.value, "path": c.path}
                    if c.domain:
                        cd["domain"] = c.domain
                    elif session.current_url:
                        from urllib.parse import urlparse
                        cd["domain"] = urlparse(session.current_url).netloc
                    else:
                        cd["url"] = "https://default.local"
                    pw_cookies.append(cd)
                try:
                    await session.context.add_cookies(pw_cookies)
                except Exception as e:
                    logger.warning("Failed injecting live cookies: %s", e)
        return len(cookies)

    async def get_cookies(self, session_id: str) -> List[SessionCookie]:
        session = await self.get_session(session_id)
        if not session:
            return []
        await session.sync_cookies_from_browser()
        return list(session._cookies.values())

    def clean_expired(self) -> None:
        """Prunes stale expired sessions."""
        now = datetime.now(timezone.utc)
        expired_ids = [sid for sid, s in self._sessions.items() if s.expires_at < now or not s.is_active]
        for sid in expired_ids:
            s = self._sessions.pop(sid, None)
            if s and s.is_active:
                asyncio.create_task(s.close())

# Global Session Manager Singleton
session_manager = SessionManager()
