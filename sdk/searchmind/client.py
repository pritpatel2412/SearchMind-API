import httpx
from typing import Optional, List, Any, Dict
from .models import (
    SearchResponse,
    ExtractResponse,
    SchemaExtractResponse,
    MapResponse,
    SessionResponse,
    SessionDetailResponse,
    SessionCookie,
    ActionResponse,
    ResearchResponse,
    UsageResponse,
)
from .exceptions import SearchMindError, AuthError, RateLimitError, QuotaExceededError

class SearchMindClient:
    """
    Official Python SDK for SearchMind API.

    Usage:
        from searchmind import SearchMindClient
        client = SearchMindClient(api_key="sm_live_...")
        result = client.search("latest LangGraph tutorials")
        print(result.answer)
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        timeout: float = 60.0
    ):
        import os
        self.api_key = api_key or os.environ.get("SEARCHMIND_API_KEY")
        if not self.api_key:
            raise ValueError(
                "SearchMind API key must be provided or configured via the SEARCHMIND_API_KEY environment variable."
            )
        
        env_base_url = os.environ.get("SEARCHMIND_BASE_URL")
        self.base_url = (base_url or env_base_url or "http://localhost:8000/v1").rstrip("/")
        self.timeout = timeout
        self._client = httpx.Client(
            headers={"X-API-Key": self.api_key, "Content-Type": "application/json"},
            timeout=timeout
        )
        self._async_client: Optional[httpx.AsyncClient] = None

    def _handle_response(self, response: httpx.Response) -> dict:
        if response.status_code == 401:
            raise AuthError("Invalid or expired API key", response.status_code, response.text)
        elif response.status_code == 429:
            try:
                data = response.json()
                detail = data.get("detail", "")
            except Exception:
                detail = response.text
            
            if "monthly" in detail.lower() or "quota" in detail.lower():
                raise QuotaExceededError(detail, response.status_code, response.text)
            raise RateLimitError(detail, response.status_code, response.text)
        elif response.status_code >= 400:
            raise SearchMindError(f"API error {response.status_code}: {response.text}", response.status_code, response.text)
        return response.json()

    def search(
        self,
        query: str,
        num_results: int = 5,
        search_depth: str = "basic",
        include_answer: bool = True,
        topic: str = "general",
        include_domains: Optional[List[str]] = None,
        exclude_domains: Optional[List[str]] = None,
        time_range: Optional[str] = None,
        max_content_length: int = 2000,
        highlights: bool = False,
        highlight_strategy: str = "dynamic",
        max_highlights: int = 3
    ) -> SearchResponse:
        payload = {
            "query": query,
            "num_results": num_results,
            "search_depth": search_depth,
            "include_answer": include_answer,
            "topic": topic,
            "max_content_length": max_content_length,
            "highlights": highlights,
            "highlight_strategy": highlight_strategy,
            "max_highlights": max_highlights
        }
        if include_domains:
            payload["include_domains"] = include_domains
        if exclude_domains:
            payload["exclude_domains"] = exclude_domains
        if time_range:
            payload["time_range"] = time_range

        response = self._client.post(f"{self.base_url}/search", json=payload)
        return SearchResponse(**self._handle_response(response))

    def extract(
        self,
        urls: List[str],
        use_js_rendering: bool = False,
        max_content_length: int = 5000,
        query: Optional[str] = None,
        highlights: bool = False,
        highlight_strategy: str = "dynamic",
        max_highlights: int = 3
    ) -> ExtractResponse:
        payload = {
            "urls": urls,
            "use_js_rendering": use_js_rendering,
            "max_content_length": max_content_length,
            "query": query,
            "highlights": highlights,
            "highlight_strategy": highlight_strategy,
            "max_highlights": max_highlights
        }
        response = self._client.post(f"{self.base_url}/extract", json=payload)
        return ExtractResponse(**self._handle_response(response))

    def extract_schema(
        self,
        schema: dict,
        url: Optional[str] = None,
        html: Optional[str] = None,
        system_prompt: Optional[str] = None,
        use_js_rendering: bool = False,
        temperature: float = 0.0
    ) -> SchemaExtractResponse:
        payload = {
            "schema": schema,
            "use_js_rendering": use_js_rendering,
            "temperature": temperature
        }
        if url:
            payload["url"] = url
        if html:
            payload["html"] = html
        if system_prompt:
            payload["system_prompt"] = system_prompt
        response = self._client.post(f"{self.base_url}/extract/schema", json=payload)
        return SchemaExtractResponse(**self._handle_response(response))

    def map(
        self,
        url: str,
        search: Optional[str] = None,
        ignore_sitemap: bool = False,
        include_subdomains: bool = False,
        limit: int = 5000
    ) -> MapResponse:
        """
        Zero-crawl website topological mapping.
        Rapidly maps and resolves the complete URL graph and sitemap hierarchy of a target domain.
        """
        payload = {
            "url": url,
            "ignore_sitemap": ignore_sitemap,
            "include_subdomains": include_subdomains,
            "limit": limit
        }
        if search:
            payload["search"] = search
        response = self._client.post(f"{self.base_url}/map", json=payload)
        return MapResponse(**self._handle_response(response))

    def create_session(
        self,
        initial_url: Optional[str] = None,
        cookies: Optional[List[dict]] = None,
        user_agent: Optional[str] = None,
        viewport: Optional[dict] = None,
        ttl_seconds: int = 1800
    ) -> SessionDetailResponse:
        """Create a persistent stateful browser session with an isolated cookie vault."""
        payload: Dict[str, Any] = {"ttl_seconds": ttl_seconds}
        if initial_url:
            payload["initial_url"] = initial_url
        if cookies:
            payload["cookies"] = cookies
        if user_agent:
            payload["user_agent"] = user_agent
        if viewport:
            payload["viewport"] = viewport
        response = self._client.post(f"{self.base_url}/sessions", json=payload)
        return SessionDetailResponse(**self._handle_response(response))

    def list_sessions(self) -> List[SessionResponse]:
        """List active persistent browser sessions."""
        response = self._client.get(f"{self.base_url}/sessions")
        return [SessionResponse(**s) for s in self._handle_response(response)]

    def get_session(self, session_id: str) -> SessionDetailResponse:
        """Get live status and cookie vault state of a persistent session."""
        response = self._client.get(f"{self.base_url}/sessions/{session_id}")
        return SessionDetailResponse(**self._handle_response(response))

    def delete_session(self, session_id: str) -> dict:
        """Terminate a persistent browser session."""
        response = self._client.delete(f"{self.base_url}/sessions/{session_id}")
        return self._handle_response(response)

    def inject_cookies(self, session_id: str, cookies: List[dict]) -> dict:
        """Inject authentication or session cookies into the session vault."""
        response = self._client.post(f"{self.base_url}/sessions/{session_id}/cookies", json={"cookies": cookies})
        return self._handle_response(response)

    def get_cookies(self, session_id: str) -> List[SessionCookie]:
        """Export cookies from the session vault."""
        response = self._client.get(f"{self.base_url}/sessions/{session_id}/cookies")
        return [SessionCookie(**c) for c in self._handle_response(response)]

    def action(
        self,
        url: str,
        actions: List[dict],
        session_id: Optional[str] = None,
        return_screenshot: bool = False,
        extract_images: bool = False
    ) -> ActionResponse:
        """Execute interactive web actions, optionally inside a persistent browser session."""
        payload = {
            "url": url,
            "actions": actions,
            "return_screenshot": return_screenshot,
            "extract_images": extract_images
        }
        if session_id:
            payload["session_id"] = session_id
        response = self._client.post(f"{self.base_url}/action", json=payload)
        return ActionResponse(**self._handle_response(response))

    def research(
        self,
        query: str,
        max_sources: int = 10,
        include_summary: bool = True
    ) -> ResearchResponse:
        payload = {
            "query": query,
            "max_sources": max_sources,
            "include_summary": include_summary,
            "search_depth": "advanced"
        }
        response = self._client.post(f"{self.base_url}/research", json=payload)
        return ResearchResponse(**self._handle_response(response))

    def get_usage(self) -> UsageResponse:
        response = self._client.get(f"{self.base_url}/usage")
        return UsageResponse(**self._handle_response(response))

    # --- Async Methods ---

    async def _get_async_client(self) -> httpx.AsyncClient:
        if self._async_client is None or self._async_client.is_closed:
            self._async_client = httpx.AsyncClient(
                headers={"X-API-Key": self.api_key, "Content-Type": "application/json"},
                timeout=self.timeout
            )
        return self._async_client

    async def async_search(
        self,
        query: str,
        num_results: int = 5,
        search_depth: str = "basic",
        include_answer: bool = True,
        topic: str = "general",
        include_domains: Optional[List[str]] = None,
        exclude_domains: Optional[List[str]] = None,
        time_range: Optional[str] = None,
        max_content_length: int = 2000,
        highlights: bool = False,
        highlight_strategy: str = "dynamic",
        max_highlights: int = 3
    ) -> SearchResponse:
        client = await self._get_async_client()
        payload = {
            "query": query,
            "num_results": num_results,
            "search_depth": search_depth,
            "include_answer": include_answer,
            "topic": topic,
            "max_content_length": max_content_length,
            "highlights": highlights,
            "highlight_strategy": highlight_strategy,
            "max_highlights": max_highlights
        }
        if include_domains:
            payload["include_domains"] = include_domains
        if exclude_domains:
            payload["exclude_domains"] = exclude_domains
        if time_range:
            payload["time_range"] = time_range

        response = await client.post(f"{self.base_url}/search", json=payload)
        return SearchResponse(**self._handle_response(response))

    async def async_extract(
        self,
        urls: List[str],
        use_js_rendering: bool = False,
        max_content_length: int = 5000,
        query: Optional[str] = None,
        highlights: bool = False,
        highlight_strategy: str = "dynamic",
        max_highlights: int = 3
    ) -> ExtractResponse:
        client = await self._get_async_client()
        payload = {
            "urls": urls,
            "use_js_rendering": use_js_rendering,
            "max_content_length": max_content_length,
            "query": query,
            "highlights": highlights,
            "highlight_strategy": highlight_strategy,
            "max_highlights": max_highlights
        }
        response = await client.post(f"{self.base_url}/extract", json=payload)
        return ExtractResponse(**self._handle_response(response))

    async def async_extract_schema(
        self,
        schema: dict,
        url: Optional[str] = None,
        html: Optional[str] = None,
        system_prompt: Optional[str] = None,
        use_js_rendering: bool = False,
        temperature: float = 0.0
    ) -> SchemaExtractResponse:
        client = await self._get_async_client()
        payload = {
            "schema": schema,
            "use_js_rendering": use_js_rendering,
            "temperature": temperature
        }
        if url:
            payload["url"] = url
        if html:
            payload["html"] = html
        if system_prompt:
            payload["system_prompt"] = system_prompt
        response = await client.post(f"{self.base_url}/extract/schema", json=payload)
        return SchemaExtractResponse(**self._handle_response(response))

    async def async_map(
        self,
        url: str,
        search: Optional[str] = None,
        ignore_sitemap: bool = False,
        include_subdomains: bool = False,
        limit: int = 5000
    ) -> MapResponse:
        """
        Asynchronously map website topology and sitemap hierarchy.
        """
        client = await self._get_async_client()
        payload = {
            "url": url,
            "ignore_sitemap": ignore_sitemap,
            "include_subdomains": include_subdomains,
            "limit": limit
        }
        if search:
            payload["search"] = search
        response = await client.post(f"{self.base_url}/map", json=payload)
        return MapResponse(**self._handle_response(response))

    async def async_create_session(
        self,
        initial_url: Optional[str] = None,
        cookies: Optional[List[dict]] = None,
        user_agent: Optional[str] = None,
        viewport: Optional[dict] = None,
        ttl_seconds: int = 1800
    ) -> SessionDetailResponse:
        """Asynchronously create a persistent browser session."""
        client = await self._get_async_client()
        payload: Dict[str, Any] = {"ttl_seconds": ttl_seconds}
        if initial_url:
            payload["initial_url"] = initial_url
        if cookies:
            payload["cookies"] = cookies
        if user_agent:
            payload["user_agent"] = user_agent
        if viewport:
            payload["viewport"] = viewport
        response = await client.post(f"{self.base_url}/sessions", json=payload)
        return SessionDetailResponse(**self._handle_response(response))

    async def async_list_sessions(self) -> List[SessionResponse]:
        """Asynchronously list active sessions."""
        client = await self._get_async_client()
        response = await client.get(f"{self.base_url}/sessions")
        return [SessionResponse(**s) for s in self._handle_response(response)]

    async def async_get_session(self, session_id: str) -> SessionDetailResponse:
        """Asynchronously get state of a persistent session."""
        client = await self._get_async_client()
        response = await client.get(f"{self.base_url}/sessions/{session_id}")
        return SessionDetailResponse(**self._handle_response(response))

    async def async_delete_session(self, session_id: str) -> dict:
        """Asynchronously terminate a persistent browser session."""
        client = await self._get_async_client()
        response = await client.delete(f"{self.base_url}/sessions/{session_id}")
        return self._handle_response(response)

    async def async_inject_cookies(self, session_id: str, cookies: List[dict]) -> dict:
        """Asynchronously inject cookies into a persistent session vault."""
        client = await self._get_async_client()
        response = await client.post(f"{self.base_url}/sessions/{session_id}/cookies", json={"cookies": cookies})
        return self._handle_response(response)

    async def async_get_cookies(self, session_id: str) -> List[SessionCookie]:
        """Asynchronously export cookies from session vault."""
        client = await self._get_async_client()
        response = await client.get(f"{self.base_url}/sessions/{session_id}/cookies")
        return [SessionCookie(**c) for c in self._handle_response(response)]

    async def async_action(
        self,
        url: str,
        actions: List[dict],
        session_id: Optional[str] = None,
        return_screenshot: bool = False,
        extract_images: bool = False
    ) -> ActionResponse:
        """Asynchronously execute actions within an optional persistent browser session."""
        client = await self._get_async_client()
        payload = {
            "url": url,
            "actions": actions,
            "return_screenshot": return_screenshot,
            "extract_images": extract_images
        }
        if session_id:
            payload["session_id"] = session_id
        response = await client.post(f"{self.base_url}/action", json=payload)
        return ActionResponse(**self._handle_response(response))

    async def async_research(
        self,
        query: str,
        max_sources: int = 10,
        include_summary: bool = True
    ) -> ResearchResponse:
        client = await self._get_async_client()
        payload = {
            "query": query,
            "max_sources": max_sources,
            "include_summary": include_summary,
            "search_depth": "advanced"
        }
        response = await client.post(f"{self.base_url}/research", json=payload)
        return ResearchResponse(**self._handle_response(response))

    async def async_get_usage(self) -> UsageResponse:
        client = await self._get_async_client()
        response = await client.get(f"{self.base_url}/usage")
        return UsageResponse(**self._handle_response(response))

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def close(self):
        """Close the synchronous client."""
        self._client.close()

    async def aclose(self):
        """Close the asynchronous client."""
        if self._async_client and not self._async_client.is_closed:
            await self._async_client.aclose()
