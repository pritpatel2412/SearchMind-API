from langchain.tools import BaseTool
from pydantic import BaseModel, Field
from typing import Optional, Type, Any
from .client import SearchMindClient

class SearchMindInput(BaseModel):
    query: str = Field(..., description="The search query to look up on the web")
    num_results: int = Field(default=5, description="Number of results to return (1-20)")
    search_depth: str = Field(default="basic", description="'basic' for snippets, 'advanced' for full content")


class SearchMindTool(BaseTool):
    """
    LangChain tool wrapper for SearchMind API.
    """
    name: str = "searchmind_search"
    description: str = (
        "Search the web for current information. Use this when you need to find "
        "up-to-date facts, documentation, news, or any information from the internet. "
        "Input should be a clear search query."
    )
    args_schema: Type[BaseModel] = SearchMindInput
    client: Any  # Avoid type checking errors if SearchMindClient isn't pre-imported

    def __init__(self, client: SearchMindClient, **kwargs):
        super().__init__(client=client, **kwargs)

    class Config:
        arbitrary_types_allowed = True

    def _run(self, query: str, num_results: int = 5, search_depth: str = "basic") -> str:
        try:
            result = self.client.search(
                query=query,
                num_results=num_results,
                search_depth=search_depth,
                include_answer=True
            )
            output = f"Query: {result.query}\n\n"
            if result.answer:
                output += f"Summary: {result.answer}\n\n"
            output += "Sources:\n"
            for i, r in enumerate(result.results, 1):
                output += f"\n[{i}] {r.title}\nURL: {r.url}\nRelevance: {r.score:.2f}\n{r.content[:500]}...\n"
            return output
        except Exception as e:
            return f"Error executing search: {str(e)}"

    async def _arun(self, query: str, num_results: int = 5, search_depth: str = "basic") -> str:
        try:
            result = await self.client.async_search(
                query=query,
                num_results=num_results,
                search_depth=search_depth,
                include_answer=True
            )
            output = f"Query: {result.query}\n\n"
            if result.answer:
                output += f"Summary: {result.answer}\n\n"
            output += "Sources:\n"
            for i, r in enumerate(result.results, 1):
                output += f"\n[{i}] {r.title}\nURL: {r.url}\nRelevance: {r.score:.2f}\n{r.content[:500]}...\n"
            return output
        except Exception as e:
            return f"Error executing search: {str(e)}"
