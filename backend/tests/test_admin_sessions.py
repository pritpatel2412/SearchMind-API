import os
os.environ["DISABLE_PLAYWRIGHT"] = "1"
import sys
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.schemas.session import CreateSessionRequest, SessionCookie
from app.services.session_service import session_manager
from app.routers.admin import list_admin_sessions, terminate_admin_session, clean_admin_expired_sessions

def test_admin_sessions_management():
    async def _async_suite():
        req = CreateSessionRequest(
            initial_url=None,
            cookies=[SessionCookie(name="admin_sid", value="val_123")],
            ttl_seconds=1800
        )
        created = await session_manager.create_session(req, user_id="user_admin_test")
        session_id = created.session_id

        admin_auth = {"sub": "admin", "role": "root_admin"}
        sessions = await list_admin_sessions(admin_auth=admin_auth)
        matching = [s for s in sessions if s.session_id == session_id]
        assert len(matching) == 1
        assert matching[0].user_id == "user_admin_test"
        assert matching[0].cookies_count == 1
        assert matching[0].is_active is True

        clean_res = await clean_admin_expired_sessions(admin_auth=admin_auth)
        assert clean_res["status"] == "success"
        assert clean_res["remaining_active"] >= 1

        term_res = await terminate_admin_session(session_id=session_id, admin_auth=admin_auth)
        assert term_res["status"] == "success"

        sessions_after = await list_admin_sessions(admin_auth=admin_auth)
        assert not any(s.session_id == session_id for s in sessions_after)

    asyncio.run(_async_suite())

if __name__ == "__main__":
    test_admin_sessions_management()
    print("ALL ADMIN SESSIONS TESTS PASSED!", flush=True)
