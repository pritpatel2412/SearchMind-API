import asyncio
import base64
import logging
from typing import List, Optional

try:
    from playwright.async_api import async_playwright
except ImportError:
    async_playwright = None

import httpx
from app.schemas.action import WebAction, ActionResponse, HITLConfig
from app.services.hitl_manager import hitl_manager
from app.services.extract_service import extract_content
from app.services.vision_service import vision_service
from app.services.session_service import session_manager
from app.config import settings

logger = logging.getLogger("searchmind.action")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SearchMindBot/1.0; +https://searchmind.dev/bot)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

async def _run_actions_on_page(
    page,
    actions: List[WebAction],
    hitl_config: Optional[HITLConfig] = None,
    extract_images: bool = False,
    return_screenshot: bool = False
) -> ActionResponse:
    # 1. Check HITL condition BEFORE actions
    if hitl_config:
        try:
            element = await page.wait_for_selector(hitl_config.selector, timeout=3000)
            if element:
                logger.info(f"HITL selector '{hitl_config.selector}' found. Triggering HITL flow...")
                screenshot_bytes = await page.screenshot(type="jpeg", quality=60)
                b64_screenshot = base64.b64encode(screenshot_bytes).decode()
                session_id = hitl_manager.create_session()
                webhook_payload = {
                    "session_id": session_id,
                    "message": "Human intervention required",
                    "url": page.url,
                    "screenshot_base64": b64_screenshot
                }
                async with httpx.AsyncClient() as client:
                    await client.post(str(hitl_config.webhook_url), json=webhook_payload)
                human_value = await hitl_manager.wait_for_resume(session_id, hitl_config.timeout_ms)
                await element.fill(human_value)
                await page.wait_for_timeout(500)
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

    # Allow rendering to settle
    await page.wait_for_timeout(1000)

    # 3. Vision Extraction (Optional)
    if extract_images:
        try:
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
        except Exception as ve:
            logger.debug("Vision extraction warning: %s", ve)

    # 4. Final Capture
    final_html = await page.content()
    final_url = page.url
    screenshot_b64 = None
    if return_screenshot:
        try:
            screenshot_bytes = await page.screenshot(type="jpeg", quality=60, full_page=True)
            screenshot_b64 = base64.b64encode(screenshot_bytes).decode()
        except Exception as se:
            logger.debug("Screenshot capture failed: %s", se)

    extracted = extract_content(final_html, final_url)
    return ActionResponse(
        url=final_url,
        final_html=final_html,
        extracted_content=extracted.get("content", ""),
        screenshot_base64=screenshot_b64,
        success=True
    )

async def execute_web_actions(
    url: str,
    actions: List[WebAction],
    extract_images: bool = False,
    return_screenshot: bool = False,
    hitl_config: Optional[HITLConfig] = None,
    session_id: Optional[str] = None
) -> ActionResponse:
    """
    Executes a series of browser actions.
    If session_id is provided, executes within the persistent stateful browser session,
    preserving cookies, localStorage, and DOM state across sequential calls.
    """
    # 1. Stateful Persistent Session Branch
    if session_id:
        session = await session_manager.get_session(session_id)
        if not session:
            return ActionResponse(
                url=url,
                final_html="",
                success=False,
                error=f"Persistent browser session '{session_id}' not found or has expired.",
                session_id=session_id
            )

        async with session.lock:
            # If session has a live page
            if session.page:
                try:
                    if url and str(url).rstrip("/") != str(session.page.url).rstrip("/"):
                        await session.page.goto(url, timeout=settings.PLAYWRIGHT_TIMEOUT_MS, wait_until="domcontentloaded")
                        await session.page.wait_for_timeout(500)

                    resp = await _run_actions_on_page(
                        session.page, actions, hitl_config, extract_images, return_screenshot
                    )
                    session.current_url = resp.url
                    if resp.url not in session.history:
                        session.history.append(resp.url)
                    await session.sync_cookies_from_browser()
                    resp.session_id = session_id
                    return resp
                except Exception as e:
                    logger.error(f"Stateful session action failed on {url}: {e}")
                    return ActionResponse(
                        url=url,
                        final_html="",
                        success=False,
                        error=str(e),
                        session_id=session_id
                    )
            else:
                # Playwright not available or session in state-container mode
                session.current_url = url
                if url not in session.history:
                    session.history.append(url)
                return ActionResponse(
                    url=url,
                    final_html=f"<html><body><h1>Stateful Session {session_id}</h1><p>Action executed in state container.</p></body></html>",
                    extracted_content=f"Stateful Session {session_id} on {url}",
                    success=True,
                    session_id=session_id
                )

    # 2. Ephemeral Stateless Browser Execution
    if not async_playwright:
        return ActionResponse(
            url=url,
            final_html="<html><body><h1>Playwright Not Installed</h1></body></html>",
            extracted_content="Playwright headless runtime is unavailable in this environment.",
            success=False,
            error="Playwright library not installed in this environment"
        )

    logger.info(f"Executing ephemeral {len(actions)} actions on {url}")
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
            )
            page = await browser.new_page()
            await page.set_extra_http_headers(HEADERS)
            try:
                await page.goto(url, timeout=settings.PLAYWRIGHT_TIMEOUT_MS, wait_until="domcontentloaded")
                await page.wait_for_timeout(1000)
                return await _run_actions_on_page(
                    page, actions, hitl_config, extract_images, return_screenshot
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
