import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class WatchTask(Base):
    __tablename__ = "watch_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    query = Column(String, nullable=False)
    webhook_url = Column(String, nullable=False)
    interval_minutes = Column(Integer, default=60, nullable=False)
    is_active = Column(Boolean, default=True)
    last_run_at = Column(DateTime, nullable=True)
    last_results_hash = Column(String, nullable=True)
    
    # Store search config (e.g., search_depth, topic)
    search_params = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
