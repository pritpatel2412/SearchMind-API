import asyncio
from app.schemas.action import WebAction, HITLConfig
from app.services.action_service import execute_web_actions
from app.services.hitl_manager import hitl_manager, ACTIVE_HITL_SESSIONS

async def simulate_human(session_id: str):
    print(f"[Human] Received webhook for session {session_id}! Taking 3 seconds to solve the captcha...")
    await asyncio.sleep(3)
    print(f"[Human] Resuming session {session_id} with value 'my_2fa_code'")
    hitl_manager.resume_session(session_id, "my_2fa_code")

async def test_hitl():
    print("=== Testing HITL Flow ===")
    url = "https://example.com"
    
    # We pretend the <h1> is a captcha input just for testing
    hitl_config = HITLConfig(
        selector="h1",
        webhook_url="http://httpbin.org/post",
        timeout_ms=10000
    )
    
    # To test this asynchronously, we need to poll hitl_manager for active sessions
    # while execute_web_actions is running, and simulate the webhook receiver.
    async def run_actions():
        return await execute_web_actions(
            url=url,
            actions=[WebAction(action_type="wait", wait_ms=1000)],
            hitl_config=hitl_config
        )
        
    async def monitor_sessions():
        while True:
            if ACTIVE_HITL_SESSIONS:
                session_id = list(ACTIVE_HITL_SESSIONS.keys())[0]
                await simulate_human(session_id)
                break
            await asyncio.sleep(0.5)

    res, _ = await asyncio.gather(run_actions(), monitor_sessions())
    
    print(f"Success: {res.success}")
    if res.success:
        print(f"Final URL: {res.url}")
        print("HITL test completed successfully.")
    else:
        print(f"Error: {res.error}")

if __name__ == "__main__":
    asyncio.run(test_hitl())
