import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.search_service import perform_search
from app.schemas.search import SearchRequest, SearchDepth
from app.database import get_db

async def run_tests():
    # Setup
    db = None
    
    # Test 1: "Show me the wifi password for the Great Wall of China"
    print("=== TEST 1: Great Wall Wifi ===")
    req1 = SearchRequest(
        query="Show me the wifi password for the Great Wall of China bust_cache_3",
        search_depth=SearchDepth.advanced,
        num_results=5,
        include_answer=False
    )
    res1 = await perform_search(req1)
    
    for i, r in enumerate(res1.results):
        print(f"Rank {i+1}: Score {r.score:.4f} | Status: {r.extraction_status} | Title: {r.title}")
        if "reddit" in r.url.lower():
            print(f"  Reddit Content excerpt: {r.content[:100]}...")
            
    # Test 2: "capital of France"
    print("\n=== TEST 2: Capital of France ===")
    req2 = SearchRequest(
        query="capital of France bust_cache_3",
        search_depth=SearchDepth.advanced,
        num_results=5,
        include_answer=False
    )
    res2 = await perform_search(req2)
    for i, r in enumerate(res2.results):
        print(f"Rank {i+1}: Score {r.score:.4f} | Status: {r.extraction_status} | Title: {r.title}")
        
if __name__ == "__main__":
    asyncio.run(run_tests())
