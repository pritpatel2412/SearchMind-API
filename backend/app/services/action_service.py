import asyncio
import base64
import logging
from typing import List, Optional
from playwright.async_api import async_playwright

import httpx
from app.schemas.action import WebAction, ActionResponse, HITLConfig
from app.services.hitl_manager import hitl_manager
from app.services.extract_service import extract_content
from app.services.vision_service import vision_service
from app.config import settings

logger = logging.getLogger("searchmind.action")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SearchMindBot/1.0; +https://searchmind.dev/bot)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

async def execute_web_actions(url: str, actions: List[WebAction], extract_images: bool = False, return_screenshot: bool = False, hitl_config: Optional[HITLConfig] = None) -> ActionResponse:
    logger.info(f"Executing {len(actions)} actions on {url}")
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
            )
            page = await browser.new_page()
            await page.set_extra_http_headers(HEADERS)
            try:
                # 1. Goto initial URL
                await page.goto(url, timeout=settings.PLAYWRIGHT_TIMEOUT_MS, wait_until="domcontentloaded")
                await page.wait_for_timeout(1000)

                # 1.5. Check HITL condition BEFORE actions
                if hitl_config:
                    try:
                        # Wait briefly to see if selector appears
                        element = await page.wait_for_selector(hitl_config.selector, timeout=3000)
                        if element:
                            logger.info(f"HITL selector '{hitl_config.selector}' found. Triggering HITL flow...")
                            
                            # Capture state for the human
                            screenshot_bytes = await page.screenshot(type="jpeg", quality=60)
                            b64_screenshot = base64.b64encode(screenshot_bytes).decode()
                            
                            session_id = hitl_manager.create_session()
                            
                            # Send webhook
                            webhook_payload = {
                                "session_id": session_id,
                                "message": "Human intervention required",
                                "url": page.url,
                                "screenshot_base64": b64_screenshot
                            }
                            async with httpx.AsyncClient() as client:
                                await client.post(str(hitl_config.webhook_url), json=webhook_payload)
                                
                            # Await human resolution
                            human_value = await hitl_manager.wait_for_resume(session_id, hitl_config.timeout_ms)
                            
                            # Type the value and proceed
                            await element.fill(human_value)
                            await page.wait_for_timeout(500) # slight delay after typing
                            
                            logger.info("HITL resolved. Proceeding with configured actions.")
                    except Exception as e:
                        logger.debug(f"HITL selector not found or webhook failed: {e}")

                # 2. Execute Actions Sequence
                for action in actions:
                    logger.debug(f"Executing action: {action.action_type} on {action.selector}")
                    if action.action_type == "click":
                        if action.selector:
                            await page.click(action.selector, timeout=5000)
                    elif action.action_type == "type":
                        if action.selector and action.value:
                            await page.fill(action.selector, action.value, timeout=5000)
                    elif action.action_type == "press":
                        if action.selector and action.value:
                            await page.press(action.selector, action.value, timeout=5000)
                    elif action.action_type == "submit":
                        if action.selector:
                            await page.evaluate(f'document.querySelector("{action.selector}").submit()')
                    elif action.action_type == "wait":
                        wait_time = action.wait_ms or 2000
                        await page.wait_for_timeout(wait_time)

                # Wait for any navigation or rendering to settle
                await page.wait_for_timeout(1500)

                # 3. Vision Extraction (Optional)
                if extract_images:
                    images_data = await page.evaluate('''() => {
                        return Array.from(document.querySelectorAll('img')).filter(img => img.width > 50 && img.height > 50 && img.src).map(img => {
                            try {
                                let canvas = document.createElement('canvas');
                                canvas.width = img.width;
                                canvas.height = img.height;
                                let ctx = canvas.getContext('2d');
                                ctx.drawImage(img, 0, 0);
                                let dataUrl = canvas.toDataURL('image/jpeg', 0.5);
                                if (!dataUrl || dataUrl === 'data:,') return null;
                                return { src: img.src, base64: dataUrl.split(',')[1] };
                            } catch(e) { return null; }
                        }).filter(Boolean);
                    }''')
                    
                    if images_data:
                        for img_data in images_data[:3]:
                            description = await vision_service.describe_image(img_data['base64'])
                            escaped_desc = description.replace("'", "\\'").replace("\n", " ").replace('"', '&quot;')
                            await page.evaluate(f'''() => {{
                                document.querySelectorAll('img[src="{img_data['src']}"]').forEach(el => {{
                                    let p = document.createElement('p');
                                    p.innerText = "![AI Vision Summary: " + "{escaped_desc}" + "]";
                                    el.parentNode.replaceChild(p, el);
                                }});
                            }}''')
                
                # 4. Final Capture
                final_html = await page.content()
                final_url = page.url
                
                screenshot_b64 = None
                if return_screenshot:
                    screenshot_bytes = await page.screenshot(type="jpeg", quality=60, full_page=True)
                    screenshot_b64 = base64.b64encode(screenshot_bytes).decode()

                # Extract markdown
                extracted = extract_content(final_html, final_url)
                
                return ActionResponse(
                    url=final_url,
                    final_html=final_html,
                    extracted_content=extracted.get("content", ""),
                    screenshot_base64=screenshot_b64,
                    success=True
                )
            finally:
                await browser.close()
    except Exception as e:
        logger.error(f"Failed to execute actions on {url}: {e}")
        return ActionResponse(
            url=url,
            final_html="",
            success=False,
            error=str(e)
        )
