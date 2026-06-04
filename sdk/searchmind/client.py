import httpx
from typing import Optional, List, Any, Dict
from .models import SearchResponse, ExtractResponse, ResearchResponse, UsageResponse
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
        api_key: str,
        base_url: str = "http://localhost:8000/v1",
        timeout: float = 60.0
    ):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self._client = httpx.Client(
            headers={"X-API-Key": api_key, "Content-Type": "application/json"},
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
        max_content_length: int = 2000
    ) -> SearchResponse:
        payload = {
            "query": query,
            "num_results": num_results,
            "search_depth": search_depth,
            "include_answer": include_answer,
            "topic": topic,
            "max_content_length": max_content_length
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
        max_content_length: int = 5000
    ) -> ExtractResponse:
        payload = {
            "urls": urls,
            "use_js_rendering": use_js_rendering,
            "max_content_length": max_content_length
        }
        response = self._client.post(f"{self.base_url}/extract", json=payload)
        return ExtractResponse(**self._handle_response(response))

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
        max_content_length: int = 2000
    ) -> SearchResponse:
        client = await self._get_async_client()
        payload = {
            "query": query,
            "num_results": num_results,
            "search_depth": search_depth,
            "include_answer": include_answer,
            "topic": topic,
            "max_content_length": max_content_length
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
        max_content_length: int = 5000
    ) -> ExtractResponse:
        client = await self._get_async_client()
        payload = {
            "urls": urls,
            "use_js_rendering": use_js_rendering,
            "max_content_length": max_content_length
        }
        response = await client.post(f"{self.base_url}/extract", json=payload)
        return ExtractResponse(**self._handle_response(response))

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
