from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.database import get_db
from app.auth.api_key_auth import get_current_api_key
from app.models.api_key import APIKey
from app.schemas.action import (
    ActionRequest,
    ActionResponse,
    InstructActionRequest,
    InstructActionResponse,
    HITLResumeRequest,
)
from app.services.action_service import execute_web_actions
from app.services.instruct_action_service import execute_instruct_action
from app.services.hitl_manager import hitl_manager
from app.middleware.rate_limiter import enforce_rate_limits
from app.middleware.usage_tracker import track_usage
from app.utils.url_utils import validate_safe_url

router = APIRouter()

@router.post("/", response_model=ActionResponse, tags=["Action"])
async def perform_action(
    request: ActionRequest,
    http_request: Request,
    api_key: APIKey = Depends(get_current_api_key),
    db: AsyncSession = Depends(get_db),
):
    """
    Execute a sequence of interactive web actions (click, type, wait, etc) on a target URL
    and return the final rendered DOM state, AI extracted content, and optionally a screenshot.
    """
    await enforce_rate_limits(http_request, api_key, db)
    target_url = str(request.url)
    validate_safe_url(target_url)

    response = await execute_web_actions(
        url=target_url,
        actions=request.actions,
        extract_images=request.extract_images,
        return_screenshot=request.return_screenshot,
        hitl_config=request.hitl_config,
        session_id=request.session_id,
    )

    if not response.success:
        raise HTTPException(status_code=500, detail=response.error)

    await track_usage(db, api_key, "action", result_count=1)
    return response


@router.post("/resume/{session_id}", tags=["Action"])
async def resume_hitl_action(
    session_id: str,
    request: HITLResumeRequest,
    http_request: Request,
    api_key: APIKey = Depends(get_current_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Resume a paused HITL Playwright session by providing the required human input (e.g., Captcha/2FA code)."""
    await enforce_rate_limits(http_request, api_key, db)
    try:
        hitl_manager.resume_session(session_id, request.value)
        return {"status": "resumed", "session_id": session_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/instruct", response_model=InstructActionResponse, tags=["Action"])
async def perform_instruct_action(
    request: InstructActionRequest,
    http_request: Request,
    api_key: APIKey = Depends(get_current_api_key),
    db: AsyncSession = Depends(get_db),
):
    """
    Execute a natural language self-healing browser action.
    Compresses page DOM into an Accessibility Tree representation, grounds user intent,
    and self-heals dynamically if layout or selector mutations occur.
    """
    await enforce_rate_limits(http_request, api_key, db)
    if request.target_url:
        validate_safe_url(str(request.target_url))

    response = await execute_instruct_action(request)
    if not response.success:
        raise HTTPException(status_code=500, detail=response.error)

    await track_usage(db, api_key, "action", result_count=1)
    return response
