import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.api_key_auth import get_current_api_key
from app.models.api_key import APIKey
from app.database import get_db
from app.middleware.rate_limiter import enforce_rate_limits
from app.middleware.usage_tracker import track_usage
from app.schemas.session import (
    SessionCookie,
    CreateSessionRequest,
    InjectCookiesRequest,
    SessionResponse,
    SessionDetailResponse,
)
from app.services.session_service import session_manager

logger = logging.getLogger("searchmind.routers.session")

router = APIRouter(prefix="/sessions", tags=["Browser Sessions"])


@router.post("", response_model=SessionDetailResponse, summary="Create Persistent Browser Session")
async def create_browser_session(
    request: CreateSessionRequest,
    http_request: Request,
    api_key: APIKey = Depends(get_current_api_key),
    db: AsyncSession = Depends(get_db),
):
    """
    Launch a persistent, stateful browser session with its own cookie vault,
    isolated storage state, and optional starting URL.
    """
    await enforce_rate_limits(http_request, api_key, db)
    session = await session_manager.create_session(request, user_id=api_key.user_id)
    await track_usage(db, api_key, "action", result_count=1)
    return session


@router.get("", response_model=List[SessionResponse], summary="List Active Sessions")
async def list_active_sessions(
    http_request: Request,
    api_key: APIKey = Depends(get_current_api_key),
    db: AsyncSession = Depends(get_db),
):
    """List all active persistent browser sessions belonging to the caller."""
    await enforce_rate_limits(http_request, api_key, db)
    return session_manager.list_sessions(user_id=api_key.user_id)


@router.get("/{session_id}", response_model=SessionDetailResponse, summary="Get Session State")
async def get_session_state(
    session_id: str,
    http_request: Request,
    api_key: APIKey = Depends(get_current_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve full details of an active session, including cookies and navigation history."""
    await enforce_rate_limits(http_request, api_key, db)
    session = await session_manager.get_session(session_id)
    if not session or (api_key.user_id and session.user_id and session.user_id != api_key.user_id):
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found or has expired.")
    await session.sync_cookies_from_browser()
    return session.to_detail_response()


@router.delete("/{session_id}", summary="Terminate Session")
async def terminate_browser_session(
    session_id: str,
    http_request: Request,
    api_key: APIKey = Depends(get_current_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Gracefully terminate a persistent browser session and release compute resources."""
    await enforce_rate_limits(http_request, api_key, db)
    session = await session_manager.get_session(session_id)
    if not session or (api_key.user_id and session.user_id and session.user_id != api_key.user_id):
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found or already closed.")
    deleted = await session_manager.delete_session(session_id)
    return {"session_id": session_id, "status": "terminated", "success": deleted}


@router.post("/{session_id}/cookies", summary="Inject Cookies into Vault")
async def inject_session_cookies(
    session_id: str,
    request: InjectCookiesRequest,
    http_request: Request,
    api_key: APIKey = Depends(get_current_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Inject authentication or session cookies directly into the live browser context."""
    await enforce_rate_limits(http_request, api_key, db)
    session = await session_manager.get_session(session_id)
    if not session or (api_key.user_id and session.user_id and session.user_id != api_key.user_id):
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found or has expired.")
    count = await session_manager.inject_cookies(session_id, request.cookies)
    return {"session_id": session_id, "cookies_injected": count, "total_cookies": len(session._cookies)}


@router.get("/{session_id}/cookies", response_model=List[SessionCookie], summary="Export Vault Cookies")
async def export_session_cookies(
    session_id: str,
    http_request: Request,
    api_key: APIKey = Depends(get_current_api_key),
    db: AsyncSession = Depends(get_db),
):
    """Export all cookies currently retained in the session's cookie vault."""
    await enforce_rate_limits(http_request, api_key, db)
    session = await session_manager.get_session(session_id)
    if not session or (api_key.user_id and session.user_id and session.user_id != api_key.user_id):
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found or has expired.")
    return await session_manager.get_cookies(session_id)
