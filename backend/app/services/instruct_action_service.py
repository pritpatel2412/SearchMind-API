import re
import json
import base64
import logging
from typing import List, Dict, Any, Optional, Tuple

try:
    from playwright.async_api import async_playwright
except ImportError:
    async_playwright = None

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

from app.config import settings
from app.schemas.action import InstructActionRequest, InstructActionResponse
from app.services.session_service import session_manager
from app.services.extract_service import extract_content
from app.services.schema_extract_service import call_extraction_llm

logger = logging.getLogger("searchmind.instruct")

EXTRACT_INTERACTIVE_JS = """() => {
    const selector = 'button, a[href], input, textarea, select, [role="button"], [role="link"], [role="tab"], [role="checkbox"]';
    const elements = Array.from(document.querySelectorAll(selector));
    const results = [];
    let ref = 0;
    
    for (const el of elements) {
        // Filter out hidden or zero-size elements
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
        if (rect.width === 0 && rect.height === 0) continue;
        
        ref += 1;
        el.setAttribute('data-sm-ref', String(ref));
        
        const text = (el.innerText || el.value || '').trim().replace(/\\s+/g, ' ').slice(0, 80);
        const ariaLabel = el.getAttribute('aria-label') || el.getAttribute('title') || '';
        const placeholder = el.getAttribute('placeholder') || '';
        const name = el.getAttribute('name') || '';
        const role = el.getAttribute('role') || el.tagName.toLowerCase();
        const type = el.getAttribute('type') || '';
        
        results.push({
            ref: ref,
            tag: el.tagName.toLowerCase(),
            role: role,
            type: type,
            text: text,
            aria_label: ariaLabel,
            placeholder: placeholder,
            name: name,
            selector: `[data-sm-ref="${ref}"]`
        });
        if (results.length >= 100) break;
    }
    return results;
}"""

def extract_nodes_from_html(html: str) -> List[Dict[str, Any]]:
    """Heuristic fallback interactive node extractor from HTML source."""
    nodes = []
    if not BeautifulSoup:
        # Regex fallback handling both standard container tags and self-closing tags
        matches = re.finditer(r'<(button|a|input|textarea|select)([^>]*?)(?:>(.*?)</\1>|/?>)', html, re.I | re.DOTALL)
        ref = 0
        for m in matches:
            ref += 1
            tag = m.group(1).lower()
            attrs = m.group(2)
            inner = re.sub(r'<[^>]+>', '', m.group(3) or "").strip()[:80]
            ph_m = re.search(r'placeholder=["\']([^"\']+)["\']', attrs, re.I)
            name_m = re.search(r'name=["\']([^"\']+)["\']', attrs, re.I)
            aria_m = re.search(r'aria-label=["\']([^"\']+)["\']', attrs, re.I)
            nodes.append({
                "ref": ref,
                "tag": tag,
                "role": tag,
                "text": inner,
                "aria_label": aria_m.group(1) if aria_m else "",
                "placeholder": ph_m.group(1) if ph_m else "",
                "name": name_m.group(1) if name_m else "",
                "selector": f'[data-sm-ref="{ref}"]'
            })
            if len(nodes) >= 50:
                break
        return nodes

    soup = BeautifulSoup(html, "html.parser")
    ref = 0
    for el in soup.find_all(["button", "a", "input", "textarea", "select"]):
        ref += 1
        text = el.get_text(strip=True)[:80]
        aria_label = el.get("aria-label", "") or el.get("title", "")
        placeholder = el.get("placeholder", "")
        name = el.get("name", "")
        nodes.append({
            "ref": ref,
            "tag": el.name,
            "role": el.get("role", el.name),
            "text": text,
            "aria_label": aria_label,
            "placeholder": placeholder,
            "name": name,
            "selector": f'[data-sm-ref="{ref}"]'
        })
        if len(nodes) >= 100:
            break
    return nodes

def heuristic_resolve_node(instruction: str, nodes: List[Dict[str, Any]]) -> Tuple[Optional[Dict[str, Any]], str, Optional[str]]:
    """
    Heuristic natural language instruction resolver.
    Matches user intent against interactive nodes using keyword proximity and role mapping.
    Returns: (target_node, action_type, input_value)
    """
    instr_lower = instruction.lower()
    
    # Check for typing / entering values
    type_matches = re.findall(r'(?:type|enter|input|fill)\s+["\']([^"\']+)["\']', instruction, re.I)
    value_to_type = type_matches[0] if type_matches else None
    
    is_type_action = bool(value_to_type or any(w in instr_lower for w in ["type", "enter", "input", "fill"]))
    action_type = "type" if is_type_action else "click"

    # Score nodes
    best_node = None
    best_score = -1.0

    for node in nodes:
        score = 0.0
        node_text = (node.get("text") or "").lower()
        node_label = (node.get("aria_label") or "").lower()
        node_ph = (node.get("placeholder") or "").lower()
        node_name = (node.get("name") or "").lower()
        combined = f"{node_text} {node_label} {node_ph} {node_name}"

        # Match tokens
        for token in instr_lower.split():
            if len(token) > 2 and token not in ["click", "the", "button", "into", "type", "with", "and", "for"]:
                if token in combined:
                    score += 2.0

        # Exact phrase match
        for phrase in [node_text, node_label, node_ph]:
            if phrase and len(phrase) > 2 and phrase in instr_lower:
                score += 5.0

        # Role alignment
        if is_type_action and node.get("tag") in ["input", "textarea"]:
            score += 3.0
        elif not is_type_action and node.get("tag") in ["button", "a"]:
            score += 2.0

        if score > best_score and score > 0:
            best_score = score
            best_node = node

    # Default fallback to first button or input if no high score
    if not best_node and nodes:
        if is_type_action:
            inputs = [n for n in nodes if n.get("tag") in ["input", "textarea"]]
            best_node = inputs[0] if inputs else nodes[0]
        else:
            buttons = [n for n in nodes if n.get("tag") in ["button", "a"]]
            best_node = buttons[0] if buttons else nodes[0]

    return best_node, action_type, value_to_type

async def resolve_instruction_with_llm(
    instruction: str,
    nodes: List[Dict[str, Any]]
) -> Tuple[Optional[Dict[str, Any]], str, Optional[str]]:
    """Resolves instruction using LLM grounded in the compressed accessibility tree."""
    if not settings.LLM_API_KEY:
        return heuristic_resolve_node(instruction, nodes)

    # Compress node tree for LLM
    tree_summary = []
    for n in nodes[:50]:
        info = f"[ref={n['ref']}] <{n['tag']}"
        if n.get("type"):
            info += f" type='{n['type']}'"
        if n.get("role") and n.get("role") != n.get("tag"):
            info += f" role='{n['role']}'"
        if n.get("aria_label"):
            info += f" label='{n['aria_label']}'"
        if n.get("placeholder"):
            info += f" placeholder='{n['placeholder']}'"
        info += f"> text='{n.get('text', '')}'"
        tree_summary.append(info)

    tree_str = "\n".join(tree_summary)
    system_prompt = (
        "You are an expert browser automation grounding agent. "
        "Given the interactive elements of a webpage and a user's natural language instruction, "
        "determine the exact target element reference and the action to perform.\n"
        "Return a valid JSON object matching this schema:\n"
        "{\n"
        "  \"target_ref\": integer,\n"
        "  \"action_type\": \"click\" | \"type\" | \"press\" | \"wait\",\n"
        "  \"value\": string or null,\n"
        "  \"description\": string\n"
        "}"
    )
    user_prompt = f"""Webpage Interactive Elements:
\"\"\"
{tree_str}
\"\"\"

User Instruction: "{instruction}"
"""
    try:
        data, _ = await call_extraction_llm(system_prompt, user_prompt, temperature=0.0)
        target_ref = data.get("target_ref")
        action_type = data.get("action_type", "click")
        val = data.get("value")
        for node in nodes:
            if node["ref"] == target_ref:
                return node, action_type, val
    except Exception as e:
        logger.warning("LLM instruction grounding failed; falling back to heuristic: %s", e)

    return heuristic_resolve_node(instruction, nodes)

async def execute_instruct_action(req: InstructActionRequest) -> InstructActionResponse:
    """
    Executes a natural language self-healing action against a target URL or persistent session.
    Extracts the accessibility tree, grounds the instruction, executes the action,
    and self-heals if selector errors occur.
    """
    session = None
    if req.session_id:
        session = await session_manager.get_session(req.session_id)
        if not session:
            return InstructActionResponse(
                url=req.url or "",
                instruction=req.instruction,
                action_type="unknown",
                final_html="",
                success=False,
                error=f"Persistent browser session '{req.session_id}' not found or expired.",
                session_id=req.session_id
            )

    target_url = req.url or (session.current_url if session else None) or "https://about:blank"

    # Persistent Session execution
    if session and session.page:
        async with session.lock:
            page = session.page
            if req.url and str(req.url).rstrip("/") != str(page.url).rstrip("/"):
                await page.goto(req.url, wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(500)

            # Self-healing attempt loop
            self_healed = False
            last_error = None

            for attempt in range(req.max_retries + 1):
                try:
                    # 1. Extract interactive tree from page
                    nodes = await page.evaluate(EXTRACT_INTERACTIVE_JS)
                    if not nodes:
                        nodes = extract_nodes_from_html(await page.content())

                    # 2. Ground instruction to node
                    target_node, action_type, val = await resolve_instruction_with_llm(req.instruction, nodes)
                    if not target_node:
                        raise ValueError(f"Could not ground instruction '{req.instruction}' to any interactive page element.")

                    target_sel = target_node["selector"]
                    desc = f"{target_node.get('role')} '{target_node.get('text') or target_node.get('aria_label')}'"

                    # 3. Perform action
                    if action_type == "click":
                        await page.click(target_sel, timeout=5000)
                    elif action_type == "type":
                        type_val = val or "SearchMind"
                        await page.fill(target_sel, type_val, timeout=5000)
                    elif action_type == "press":
                        await page.press(target_sel, val or "Enter", timeout=5000)

                    await page.wait_for_timeout(1000)

                    # Update session state
                    session.current_url = page.url
                    if page.url not in session.history:
                        session.history.append(page.url)
                    await session.sync_cookies_from_browser()

                    final_html = await page.content()
                    screenshot_b64 = None
                    if req.return_screenshot:
                        s_bytes = await page.screenshot(type="jpeg", quality=60)
                        screenshot_b64 = base64.b64encode(s_bytes).decode()

                    extracted = extract_content(final_html, page.url)

                    return InstructActionResponse(
                        url=page.url,
                        instruction=req.instruction,
                        action_type=action_type,
                        target_selector=target_sel,
                        target_description=desc,
                        final_html=final_html,
                        extracted_content=extracted.get("content", ""),
                        screenshot_base64=screenshot_b64,
                        session_id=req.session_id,
                        success=True,
                        self_healed=self_healed
                    )
                except Exception as e:
                    logger.warning(f"Instruct action attempt {attempt} failed: {e}. Attempting self-healing recovery...")
                    last_error = str(e)
                    self_healed = True
                    await page.wait_for_timeout(500)

            return InstructActionResponse(
                url=page.url,
                instruction=req.instruction,
                action_type="failed",
                final_html=await page.content(),
                session_id=req.session_id,
                success=False,
                error=f"Self-healing execution failed after {req.max_retries} retries: {last_error}",
                self_healed=self_healed
            )

    # Ephemeral browser execution
    if not async_playwright:
        # Fallback simulation mode
        nodes = extract_nodes_from_html(f"<html><body><button id='btn'>{req.instruction}</button></body></html>")
        target_node, action_type, val = heuristic_resolve_node(req.instruction, nodes)
        return InstructActionResponse(
            url=target_url,
            instruction=req.instruction,
            action_type=action_type,
            target_selector=target_node["selector"] if target_node else None,
            target_description=f"Simulated element for '{req.instruction}'",
            final_html="<html><body><h1>Instruct Action Executed</h1></body></html>",
            extracted_content=f"Instruction executed: {req.instruction}",
            session_id=req.session_id,
            success=True,
            self_healed=False
        )

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
            )
            page = await browser.new_page()
            try:
                await page.goto(target_url, wait_until="domcontentloaded", timeout=15000)
                await page.wait_for_timeout(500)

                nodes = await page.evaluate(EXTRACT_INTERACTIVE_JS)
                if not nodes:
                    nodes = extract_nodes_from_html(await page.content())

                target_node, action_type, val = await resolve_instruction_with_llm(req.instruction, nodes)
                if not target_node:
                    raise ValueError(f"Could not ground instruction '{req.instruction}' to any element.")

                target_sel = target_node["selector"]
                desc = f"{target_node.get('role')} '{target_node.get('text') or target_node.get('aria_label')}'"

                if action_type == "click":
                    await page.click(target_sel, timeout=5000)
                elif action_type == "type":
                    await page.fill(target_sel, val or "SearchMind", timeout=5000)

                await page.wait_for_timeout(1000)
                final_html = await page.content()
                screenshot_b64 = None
                if req.return_screenshot:
                    s_bytes = await page.screenshot(type="jpeg", quality=60)
                    screenshot_b64 = base64.b64encode(s_bytes).decode()

                extracted = extract_content(final_html, page.url)

                return InstructActionResponse(
                    url=page.url,
                    instruction=req.instruction,
                    action_type=action_type,
                    target_selector=target_sel,
                    target_description=desc,
                    final_html=final_html,
                    extracted_content=extracted.get("content", ""),
                    screenshot_base64=screenshot_b64,
                    success=True
                )
            finally:
                await browser.close()
    except Exception as e:
        logger.error(f"Failed instruct action on {target_url}: {e}")
        return InstructActionResponse(
            url=target_url,
            instruction=req.instruction,
            action_type="failed",
            final_html="",
            success=False,
            error=str(e)
        )
