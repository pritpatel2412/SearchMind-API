from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field
from typing import Optional, List
from .client import SearchMindClient

class SearchInput(BaseModel):
    query: str = Field(..., description="Web search query")
    num_results: int = Field(default=5, ge=1, le=20)
    search_depth: str = Field(default="basic")
    include_answer: bool = Field(default=True)


class ExtractInput(BaseModel):
    urls: List[str] = Field(..., description="List of URLs to extract content from")
    use_js_rendering: bool = Field(default=False)


class ResearchInput(BaseModel):
    query: str = Field(..., description="Topic or query to research deeply")
    max_sources: int = Field(default=8, ge=1, le=15)


def create_searchmind_tools(client: Optional[SearchMindClient] = None) -> list:
    """
    Create LangGraph/LangChain compatible structured tools from a SearchMind client instance.
    """
    if client is None:
        client = SearchMindClient()

    def search_web(query: str, num_results: int = 5, search_depth: str = "basic") -> dict:
        """Search the web and return structured results with AI-synthesized answer."""
        try:
            result = client.search(
                query=query,
                num_results=num_results,
                search_depth=search_depth,
                include_answer=True
            )
            return {
                "query": result.query,
                "answer": result.answer,
                "results": [
                    {
                        "title": r.title,
                        "url": r.url,
                        "content": r.content[:1000],
                        "score": r.score,
                        "source_type": r.source_type,
                        "published_date": r.published_date
                    }
                    for r in result.results
                ],
                "result_count": result.result_count,
                "cached": result.cached
            }
        except Exception as e:
            return {"error": str(e)}

    def extract_url_content(urls: List[str], use_js_rendering: bool = False) -> dict:
        """Extract clean readable content from web pages."""
        try:
            result = client.extract(urls=urls, use_js_rendering=use_js_rendering)
            return {
                "extracted_count": result.extracted_count,
                "failed_count": result.failed_count,
                "pages": [
                    {
                        "url": r.url,
                        "title": r.title,
                        "content": r.content[:2000],
                        "word_count": r.word_count,
                        "success": r.success,
                        "error": r.error
                    }
                    for r in result.results
                ]
            }
        except Exception as e:
            return {"error": str(e)}

    def deep_research(query: str, max_sources: int = 8) -> dict:
        """Perform comprehensive research with multiple sources and AI summary."""
        try:
            result = client.research(query=query, max_sources=max_sources)
            return {
                "query": result.query,
                "summary": result.summary,
                "source_count": result.source_count,
                "sources": [
                    {
                        "title": s.title,
                        "url": s.url,
                        "content": s.content[:1500],
                        "score": s.score,
                        "source_type": s.source_type
                    }
                    for s in result.sources
                ]
            }
        except Exception as e:
            return {"error": str(e)}

    search_tool = StructuredTool.from_function(
        func=search_web,
        name="search_web",
        description="Search the web for current information. Returns AI-synthesized answer + ranked sources.",
        args_schema=SearchInput
    )

    extract_tool = StructuredTool.from_function(
        func=extract_url_content,
        name="extract_content",
        description="Extract clean readable content from URLs. Removes ads, navigation, and boilerplate.",
        args_schema=ExtractInput
    )

    research_tool = StructuredTool.from_function(
        func=deep_research,
        name="deep_research",
        description="Comprehensive research using multiple search queries, full content extraction, and AI summary.",
        args_schema=ResearchInput
    )

    return [search_tool, extract_tool, research_tool]
