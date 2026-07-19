import asyncio
import uuid
import datetime
from sqlalchemy import select
from app.database import SessionLocal
from app.models.user import User
from app.models.watch_task import WatchTask
from app.workers.watch_tasks import process_due_tasks

async def test_watch():
    print("=== Testing Scheduled Watch Tasks ===")
    
    from app.database import engine
    from app.database import Base
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        # Create a dummy user
        test_user = User(
            id=uuid.uuid4(),
            email=f"test_watch_{uuid.uuid4().hex[:6]}@example.com",
            hashed_password="fake",
            plan="pro"
        )
        db.add(test_user)
        await db.commit()
        
        # Create a watch task for this user
        task = WatchTask(
            user_id=test_user.id,
            query="NVIDIA stock news",
            webhook_url="http://httpbin.org/post",
            interval_minutes=60,
            search_params={"search_depth": "basic", "topic": "finance"},
            last_run_at=None,
            last_results_hash=None
        )
        db.add(task)
        await db.commit()
        await db.refresh(task)
        
        print(f"Created WatchTask: {task.id}")

    # Now run the worker process
    await process_due_tasks()

    # Check if the DB updated
    async with SessionLocal() as db:
        query = select(WatchTask).where(WatchTask.id == task.id)
        res = await db.execute(query)
        updated_task = res.scalar_one_or_none()
        
        if updated_task and updated_task.last_run_at:
            print(f"✅ Success! Task last_run_at updated to {updated_task.last_run_at}")
            print(f"✅ Success! Task last_results_hash is {updated_task.last_results_hash}")
        else:
            print("❌ Task did not update.")

if __name__ == "__main__":
    asyncio.run(test_watch())
