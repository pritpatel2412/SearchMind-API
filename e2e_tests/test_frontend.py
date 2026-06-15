from playwright.sync_api import sync_playwright
import pytest

FRONTEND_URL = "http://localhost:5173"

def test_frontend_renders_and_login():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Go to home page
        page.goto(FRONTEND_URL)
        assert "SearchMind API" in page.title() or "SearchMind" in page.content()
        
        # Check login page
        page.goto(f"{FRONTEND_URL}/#/auth")
        page.wait_for_selector("input[type='email']", timeout=5000)
        page.wait_for_selector("input[type='password']", timeout=5000)
        
        browser.close()

def test_frontend_navigation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        page.goto(f"{FRONTEND_URL}/#/")
        
        # Test navigation to protected route Playground redirects to auth
        page.goto(f"{FRONTEND_URL}/#/playground")
        page.wait_for_selector("input[type='email']", timeout=5000)
        assert "login" in page.url or "auth" in page.url
        
        browser.close()
