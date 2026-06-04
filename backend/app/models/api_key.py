import uuid
import hashlib
import secrets
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    key_prefix = Column(String(12), nullable=False)
    hashed_key = Column(String(255), unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    monthly_limit = Column(Integer, default=1000)
    rate_limit_per_min = Column(Integer, default=10)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="api_keys")
    search_logs = relationship("SearchLog", back_populates="api_key")
    usage_records = relationship("UsageRecord", back_populates="api_key")

    @staticmethod
    def generate_key() -> tuple[str, str, str]:
        """Returns (full_key, prefix, hashed_key)"""
        raw = "sm_live_" + secrets.token_urlsafe(32)
        prefix = raw[:12]
        hashed = hashlib.sha256(raw.encode()).hexdigest()
        return raw, prefix, hashed

    @staticmethod
    def hash_key(raw_key: str) -> str:
        return hashlib.sha256(raw_key.encode()).hexdigest()
