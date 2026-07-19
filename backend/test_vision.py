import asyncio
import os
from app.config import settings
from app.services.vision_service import vision_service
from app.schemas.extract import ExtractRequest
from app.routers.extract import process_single_url
from app.database import async_session_maker

async def test_vision_extraction():
    if not settings.OPENAI_API_KEY:
        print("Skipping test: OPENAI_API_KEY not set.")
        return

    print("=== Testing Vision Extraction ===")
    
    # We will test extracting a page known to have images. 
    # Example: Wikipedia's main page or an article with an infographic.
    url = "https://en.wikipedia.org/wiki/Mona_Lisa"
    print(f"Extracting {url} with extract_images=True...")
    
    async with async_session_maker() as db:
        # We pass use_js=True so it uses playwright
        result = await process_single_url(
            url=url,
            use_js=True,
            max_content_length=10000,
            db=db,
            vectorize=False,
            extract_images=True,
            emitter=None
        )
    
    print(f"\nResult title: {result.title}")
    print(f"Content length: {len(result.content)}")
    
    # Check if we successfully injected vision summaries
    if "![AI Vision Summary:" in result.content:
        print("\n✅ Success! Vision summaries found in the extracted text.")
        lines = result.content.split('\n')
        for line in lines:
            if "![AI Vision Summary:" in line:
                print(f"Found: {line[:150]}...")
    else:
        print("\n❌ No vision summaries found in the extracted text.")

if __name__ == "__main__":
    asyncio.run(test_vision_extraction())
