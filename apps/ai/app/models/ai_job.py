from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime, timezone

from app.database import Base

class AIJob(Base):
    __tablename__ = "ai_jobs"
    __table_args__ = {"schema": "ai"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    job_type = Column(String(100), nullable=False)          # 'embed_document', 'summarize', etc.
    source_type = Column(String(50), nullable=True)         # 'document', 'message', 'task'
    source_id = Column(UUID(as_uuid=True), nullable=True)
    payload = Column(JSONB, default=dict, nullable=False)
    status = Column(String(20), default="pending", nullable=False, index=True) # pending/processing/completed/failed
    attempts = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, default=3, nullable=False)
    error = Column(Text, nullable=True)
    locked_at = Column(DateTime(timezone=True), nullable=True)
    locked_by = Column(String(100), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
