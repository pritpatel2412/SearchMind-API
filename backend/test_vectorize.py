import asyncio
import os
from app.config import settings
from app.services.embedding_service import embedding_service
from app.schemas.search import SearchRequest
from app.services.search_service import perform_search

async def mock_vectorize(text: str):
    chunks = embedding_service.text_splitter.split_text(text)
    return [{"text": c, "embedding": [0.1, 0.2, 0.3]} for c in chunks]

async def test_vectorization():
    embedding_service.vectorize_text = mock_vectorize
    print("=== Testing Search with Vectorization ===")
    req = SearchRequest(
        query="What is the capital of France?",
        num_results=1,
        search_depth="advanced",
        vectorize=True,
        include_answer=False
    )
    
    # We pass db=None. Ensure mock/cache bypass.
    # To bypass cache, let's add a random string
    req.query += " rand123"
    
    res = await perform_search(req)
    
    for i, r in enumerate(res.results):
        print(f"\nResult {i+1}: {r.title}")
        if r.vectors:
            print(f"Vectors generated: {len(r.vectors)} chunks.")
            for v in r.vectors[:1]:
                print(f"Chunk text: {v['text'][:50]}...")
                print(f"Embedding length: {len(v['embedding'])}")
        else:
            print("No vectors generated (maybe content was empty).")

if __name__ == "__main__":
    asyncio.run(test_vectorization())
