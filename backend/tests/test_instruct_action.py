import os
import sys
import asyncio

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.schemas.action import InstructActionRequest, InstructActionResponse
from app.services.instruct_action_service import (
    extract_nodes_from_html,
    heuristic_resolve_node,
    execute_instruct_action,
)

SAMPLE_LOGIN_HTML = """
<!DOCTYPE html>
<html>
<head><title>SearchMind Console Login</title></head>
<body>
    <header>
        <a href="/" aria-label="SearchMind Home">Home</a>
    </header>
    <main>
        <h1>Welcome Back</h1>
        <form action="/login" method="POST">
            <label for="email">Email</label>
            <input id="email" name="user_email" type="email" placeholder="name@company.com" />

            <label for="password">Password</label>
            <input id="password" name="password" type="password" placeholder="Enter password" />

            <button type="submit" id="btn-login">Sign In to Dashboard</button>
        </form>
        <div class="footer-links">
            <a href="/forgot-password">Reset Password</a>
            <button id="btn-demo">Try Live Sandbox Demo</button>
        </div>
    </main>
</body>
</html>
"""

def test_instruct_request_models():
    req = InstructActionRequest(
        url="https://console.searchmind.dev/login",
        instruction="Click on the Sign In to Dashboard button",
        return_screenshot=True,
        max_retries=3
    )
    assert req.url == "https://console.searchmind.dev/login"
    assert req.instruction == "Click on the Sign In to Dashboard button"
    assert req.max_retries == 3

    resp = InstructActionResponse(
        url="https://console.searchmind.dev/login",
        instruction="Click on Sign In",
        action_type="click",
        target_selector="[data-sm-ref='3']",
        target_description="button 'Sign In to Dashboard'",
        final_html="<html><body>Done</body></html>",
        success=True,
        self_healed=True
    )
    assert resp.success is True
    assert resp.self_healed is True
    assert resp.action_type == "click"

def test_extract_interactive_nodes():
    nodes = extract_nodes_from_html(SAMPLE_LOGIN_HTML)
    assert len(nodes) >= 5

    # Should find inputs and buttons
    tags = [n["tag"] for n in nodes]
    assert "button" in tags
    assert "input" in tags
    assert "a" in tags

    email_node = next((n for n in nodes if "email" in n.get("placeholder", "").lower() or "email" in n.get("name", "").lower()), None)
    assert email_node is not None
    assert email_node["tag"] == "input"

def test_heuristic_semantic_resolution_click():
    nodes = extract_nodes_from_html(SAMPLE_LOGIN_HTML)
    node, action_type, val = heuristic_resolve_node("Click the Sign In to Dashboard button", nodes)
    assert node is not None
    assert node["tag"] == "button"
    assert "Sign In" in node["text"]
    assert action_type == "click"

def test_heuristic_semantic_resolution_type():
    nodes = extract_nodes_from_html(SAMPLE_LOGIN_HTML)
    node, action_type, val = heuristic_resolve_node("Type 'developer@searchmind.dev' into the email input", nodes)
    assert node is not None
    assert node["tag"] == "input"
    assert action_type == "type"
    assert val == "developer@searchmind.dev"

def test_end_to_end_instruct_action_execution():
    req = InstructActionRequest(
        url="https://console.searchmind.dev/login",
        instruction="Click the Try Live Sandbox Demo button"
    )
    resp: InstructActionResponse = asyncio.run(execute_instruct_action(req))
    assert resp.success is True
    assert resp.instruction == "Click the Try Live Sandbox Demo button"
    assert resp.action_type == "click"
    assert resp.target_selector is not None

if __name__ == "__main__":
    print("Running natural language self-healing action tests directly...", flush=True)
    test_instruct_request_models()
    print("PASS: test_instruct_request_models", flush=True)
    test_extract_interactive_nodes()
    print("PASS: test_extract_interactive_nodes", flush=True)
    test_heuristic_semantic_resolution_click()
    print("PASS: test_heuristic_semantic_resolution_click", flush=True)
    test_heuristic_semantic_resolution_type()
    print("PASS: test_heuristic_semantic_resolution_type", flush=True)
    test_end_to_end_instruct_action_execution()
    print("PASS: test_end_to_end_instruct_action_execution", flush=True)
    print("ALL 5 INSTRUCT ACTION TESTS PASSED!", flush=True)
