from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database import get_db
from app.auth.api_key_auth import get_current_api_key
from app.models.api_key import APIKey
from app.schemas.action import ActionRequest, ActionResponse
from app.services.action_service import execute_web_actions

router = APIRouter()

@router.post("/", response_model=ActionResponse, tags=["Action"])
async def perform_action(
    request: ActionRequest,
    api_key: APIKey = Depends(get_current_api_key)
):
    """
    Execute a sequence of interactive web actions (click, type, wait, etc) on a target URL
    and return the final rendered DOM state, AI extracted content, and optionally a screenshot.
    """
    # Note: Actions may require a premium plan depending on pricing model.
    # For now, allow all authenticated users.
    
    response = await execute_web_actions(
        url=str(request.url),
        actions=request.actions,
        extract_images=request.extract_images,
        return_screenshot=request.return_screenshot,
        hitl_config=request.hitl_config
    )
    
    if not response.success:
        raise HTTPException(status_code=500, detail=response.error)
        
    return response

from app.services.hitl_manager import hitl_manager
from app.schemas.action import HITLResumeRequest

@router.post("/resume/{session_id}", tags=["Action"])
async def resume_hitl_action(
    session_id: str,
    request: HITLResumeRequest,
    api_key: APIKey = Depends(get_current_api_key)
):
    """Resume a paused HITL Playwright session by providing the required human input (e.g., Captcha/2FA code)."""
    try:
        hitl_manager.resume_session(session_id, request.value)
        return {"status": "resumed", "session_id": session_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
