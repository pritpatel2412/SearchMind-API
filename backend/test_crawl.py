import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        # We need an API key or a fake JWT token?
        # Actually, let's just use FastAPI's TestClient
        from fastapi.testclient import TestClient
        from app.main import app
        
        # Override the auth dependency for testing
        from app.auth.api_key_auth import get_current_api_key
        from app.models.api_key import APIKey
        from app.models.user import User
        import uuid
        
        fake_user = User(id=uuid.uuid4(), email="test@test.com", plan="enterprise")
        fake_api_key = APIKey(id=uuid.uuid4(), user_id=fake_user.id, hashed_key="123", is_active=True)
        fake_api_key.user = fake_user
        
        app.dependency_overrides[get_current_api_key] = lambda: fake_api_key
        
        from sqlalchemy.ext.asyncio import AsyncSession
        async def mock_commit(*args, **kwargs):
            pass
        AsyncSession.commit = mock_commit
        
        import app.routers.crawl as crawl_mod
        crawl_mod._celery_available = lambda: True
        async def mock_track_usage(*args, **kwargs):
            pass
        crawl_mod.track_usage = mock_track_usage
        
        async def mock_get_redis(*args, **kwargs):
            raise Exception("Mock no redis")
        crawl_mod.get_redis = mock_get_redis
        
        async def mock_rate_limit(*args, **kwargs):
            return True
        crawl_mod.enforce_rate_limits = mock_rate_limit
        
        client = TestClient(app)
        response = client.post(
            "/v1/crawl",
            json={
                "url": "https://example.com",
                "max_depth": 1,
                "max_pages": 2
            }
        )
        print("STATUS:", response.status_code)
        print("JSON:", response.json())

if __name__ == "__main__":
    asyncio.run(main())
