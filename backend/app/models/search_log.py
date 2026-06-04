import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.orm import relationship
from app.database import Base

class SearchLog(Base):
    __tablename__ = "search_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    endpoint = Column(String(50), nullable=False)  # search | extract | crawl | research
    query = Column(Text, nullable=True)
    results_count = Column(Integer, nullable=True)
    cached = Column(Boolean, default=False)
    latency_ms = Column(Integer, nullable=True)
    tokens_used = Column(Integer, default=0)
    ip_address = Column(INET, nullable=True)
    user_agent = Column(Text, nullable=True)
    status_code = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)

    # Relationships
    api_key = relationship("APIKey", back_populates="search_logs")
    user = relationship("User", back_populates="search_logs")
