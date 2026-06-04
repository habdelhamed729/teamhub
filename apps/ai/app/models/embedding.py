from sqlalchemy import Column, String, Integer, Text, DateTime, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
import uuid
from datetime import datetime, timezone

from app.database import Base

class Embedding(Base):
    __tablename__ = "embeddings"
    __table_args__ = (
        UniqueConstraint("source_type", "source_id", "chunk_index", name="uq_embeddings_source_chunk"),
        {"schema": "ai"}
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workspace_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    source_type = Column(String(50), nullable=False)      # 'document', 'message', 'task'
    source_id = Column(UUID(as_uuid=True), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    content_hash = Column(String(64), nullable=True)       # SHA-256 of full document content
    metadata_ = Column("metadata", JSONB, default=dict, nullable=False)
    embedding = Column(Vector(384), nullable=False)         # all-MiniLM-L6-v2 dimensions
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
