import asyncio
import hashlib
import json
import logging
from datetime import datetime, timedelta
import httpx
from sqlalchemy import select

from app.workers.celery_app import celery_app
from app.database import SessionLocal
from app.models.watch_task import WatchTask
from app.schemas.search import SearchRequest
from app.services.search_service import perform_search

logger = logging.getLogger("searchmind.watch_tasks")

@celery_app.task(name="tasks.run_due_watch_tasks", bind=True)
def run_due_watch_tasks(self):
    """Entry point for Celery beat to find and execute due watch tasks."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    loop.run_until_complete(process_due_tasks())

async def process_due_tasks():
    logger.info("Checking for due watch tasks...")
    async with SessionLocal() as db:
        query = select(WatchTask).where(WatchTask.is_active == True)
        result = await db.execute(query)
        tasks = result.scalars().all()
        
        now = datetime.utcnow()
        due_tasks = []
        for task in tasks:
            if not task.last_run_at:
                due_tasks.append(task)
            else:
                next_run = task.last_run_at + timedelta(minutes=task.interval_minutes)
                if now >= next_run:
                    due_tasks.append(task)
                    
        if not due_tasks:
            logger.info("No watch tasks due.")
            return

        logger.info(f"Found {len(due_tasks)} due watch tasks.")
        for task in due_tasks:
            await execute_watch_task(task, db)
            
        await db.commit()

async def execute_watch_task(task: WatchTask, db):
    logger.info(f"Executing watch task {task.id} for query '{task.query}'")
    try:
        # Build Search Request
        search_params = task.search_params or {}
        req = SearchRequest(
            query=task.query,
            num_results=5,
            search_depth=search_params.get("search_depth", "basic"),
            topic=search_params.get("topic", "general"),
            include_answer=True,
            vectorize=False
        )
        
        # Perform Search
        response = await perform_search(req, db=db)
        
        # Generate Hash of top results
        results_data = [{"url": r.url, "title": r.title} for r in response.results]
        current_hash = hashlib.md5(json.dumps(results_data, sort_keys=True).encode()).hexdigest()
        
        if current_hash != task.last_results_hash:
            logger.info(f"Results changed for task {task.id}. Triggering webhook...")
            # Trigger webhook
            webhook_payload = {
                "task_id": str(task.id),
                "query": task.query,
                "answer": response.answer,
                "results": [r.model_dump() for r in response.results]
            }
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(task.webhook_url, json=webhook_payload, timeout=10.0)
            except Exception as e:
                logger.error(f"Failed to deliver webhook for task {task.id}: {e}")
                
            task.last_results_hash = current_hash
            
        task.last_run_at = datetime.utcnow()
        db.add(task)
    except Exception as e:
        logger.error(f"Error executing watch task {task.id}: {e}")
