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
        return_screenshot=request.return_screenshot
    )
    
    if not response.success:
        raise HTTPException(status_code=500, detail=response.error)
        
    return response
