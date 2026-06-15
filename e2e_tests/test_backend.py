import pytest
import httpx
import os
import uuid

BASE_URL = "http://localhost:8000/v1"
API_KEY = "sm_live_Y8mK_xlF19bIWzwn0jVeuzDxktjVzxAyX63dDPqIi54"
HEADERS = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}

@pytest.fixture
def client():
    with httpx.Client(base_url=BASE_URL, headers=HEADERS, timeout=60.0) as c:
        yield c

@pytest.fixture
def unauth_client():
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as c:
        yield c

def test_missing_api_key(unauth_client):
    response = unauth_client.post("/search", json={"query": "test"})
    assert response.status_code == 401
    assert "invalid or inactive api key" in response.text.lower()

def test_invalid_api_key(unauth_client):
    response = unauth_client.post(
        "/search", 
        json={"query": "test"},
        headers={"X-API-Key": "invalid_key_123"}
    )
    assert response.status_code == 401

def test_get_usage(client):
    response = client.get("/usage")
    assert response.status_code == 200
    data = response.json()
    assert "total_requests" in data
    assert "monthly_limit" in data
    assert "percentage_used" in data

def test_search_endpoint(client):
    response = client.post(
        "/search",
        json={
            "query": "FastAPI advantages",
            "num_results": 2,
            "search_depth": "basic",
            "include_answer": True
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "results" in data
    assert isinstance(data["results"], list)
    assert len(data["results"]) > 0

def test_research_endpoint(client):
    response = client.post(
        "/research",
        json={
            "query": "What is Python?",
            "max_sources": 3,
            "include_summary": True
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "sources" in data
    assert isinstance(data["sources"], list)
    assert len(data["sources"]) > 0

def test_extract_endpoint(client):
    response = client.post(
        "/extract",
        json={
            "urls": ["https://example.com"],
            "use_js_rendering": False
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert len(data["results"]) == 1
    assert data["results"][0]["url"] == "https://example.com"
    assert "content" in data["results"][0]
