from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.database import get_db
from app.auth.api_key_auth import get_current_api_key
from app.models.api_key import APIKey
from app.models.watch_task import WatchTask
from app.schemas.watch import WatchTaskCreate, WatchTaskResponse

router = APIRouter()

@router.post("/", response_model=WatchTaskResponse, tags=["Watch"])
async def create_watch_task(
    request: WatchTaskCreate,
    api_key: APIKey = Depends(get_current_api_key),
    db: AsyncSession = Depends(get_db)
):
    """Create a new proactive search watch task."""
    if getattr(api_key.user, "plan", "free") == "free":
        raise HTTPException(status_code=403, detail="Watch endpoints require a Pro or Enterprise plan.")

    new_task = WatchTask(
        user_id=api_key.user_id,
        query=request.query,
        webhook_url=str(request.webhook_url),
        interval_minutes=request.interval_minutes,
        search_params={
            "search_depth": request.search_depth,
            "topic": request.topic
        }
    )
    
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)
    
    return new_task

@router.get("/", response_model=List[WatchTaskResponse], tags=["Watch"])
async def list_watch_tasks(
    api_key: APIKey = Depends(get_current_api_key),
    db: AsyncSession = Depends(get_db)
):
    """List all active watch tasks for the user."""
    query = select(WatchTask).where(WatchTask.user_id == api_key.user_id)
    result = await db.execute(query)
    tasks = result.scalars().all()
    
    return tasks

@router.delete("/{task_id}", tags=["Watch"])
async def delete_watch_task(
    task_id: UUID,
    api_key: APIKey = Depends(get_current_api_key),
    db: AsyncSession = Depends(get_db)
):
    """Delete a watch task."""
    query = select(WatchTask).where(WatchTask.id == task_id, WatchTask.user_id == api_key.user_id)
    result = await db.execute(query)
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    await db.delete(task)
    await db.commit()
    return {"status": "deleted"}
