import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=True)
    plan = Column(String(50), default="free")  # free | starter | pro | enterprise
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_from_ip = Column(String(45), nullable=True)
    last_ip = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    browser = Column(String(100), nullable=True)
    os = Column(String(100), nullable=True)
    device = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    isp = Column(String(100), nullable=True)
    screen_resolution = Column(String(50), nullable=True)
    language = Column(String(20), nullable=True)
    timezone = Column(String(100), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")
    search_logs = relationship("SearchLog", back_populates="user")
    usage_records = relationship("UsageRecord", back_populates="user", cascade="all, delete-orphan")
