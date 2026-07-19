import asyncio
import uuid
import logging
from typing import Dict

logger = logging.getLogger("searchmind.hitl")

# In-memory store for active HITL sessions.
# Maps session_id (str) -> asyncio.Future
ACTIVE_HITL_SESSIONS: Dict[str, asyncio.Future] = {}

class HITLManager:
    @staticmethod
    def create_session() -> str:
        session_id = str(uuid.uuid4())
        loop = asyncio.get_event_loop()
        future = loop.create_future()
        ACTIVE_HITL_SESSIONS[session_id] = future
        logger.info(f"Created HITL session: {session_id}")
        return session_id
        
    @staticmethod
    async def wait_for_resume(session_id: str, timeout_ms: int) -> str:
        future = ACTIVE_HITL_SESSIONS.get(session_id)
        if not future:
            raise ValueError(f"Invalid or expired session: {session_id}")
            
        try:
            logger.info(f"Waiting for human intervention on session {session_id} for {timeout_ms}ms")
            # Wait for the human to resume via the API
            value = await asyncio.wait_for(future, timeout=timeout_ms / 1000.0)
            return value
        finally:
            if session_id in ACTIVE_HITL_SESSIONS:
                del ACTIVE_HITL_SESSIONS[session_id]
                
    @staticmethod
    def resume_session(session_id: str, value: str):
        future = ACTIVE_HITL_SESSIONS.get(session_id)
        if not future:
            raise ValueError(f"Invalid or expired session: {session_id}")
            
        if not future.done():
            future.set_result(value)
            logger.info(f"Resumed HITL session: {session_id}")
            
hitl_manager = HITLManager()
