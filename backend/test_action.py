import asyncio
import os
from app.schemas.action import WebAction
from app.services.action_service import execute_web_actions

async def test_action():
    print("=== Testing Interactive Web Actions ===")
    
    url = "https://example.com"
    
    # We will just do a simple wait and extract for example.com
    # If we wanted to test a real interaction, we could use a search engine or wikipedia.
    actions = [
        WebAction(action_type="wait", wait_ms=2000)
    ]
    
    response = await execute_web_actions(
        url=url,
        actions=actions,
        extract_images=False,
        return_screenshot=True
    )
    
    print(f"Success: {response.success}")
    if response.success:
        print(f"Final URL: {response.url}")
        print(f"Content length: {len(response.extracted_content)}")
        if response.screenshot_base64:
            print(f"Screenshot taken: {len(response.screenshot_base64)} bytes of base64")
    else:
        print(f"Error: {response.error}")

if __name__ == "__main__":
    asyncio.run(test_action())
