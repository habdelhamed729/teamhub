from sqlalchemy import Column, String, LargeBinary, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, timezone
from app.database import Base

class GraphCheckpoint(Base):
    __tablename__ = "graph_checkpoints"
    __table_args__ = {"schema": "ai"}

    thread_id = Column(String(100), primary_key=True)
    checkpoint_ns = Column(String(100), primary_key=True, default="")
    checkpoint_id = Column(String(100), primary_key=True)
    parent_checkpoint_id = Column(String(100), nullable=True)
    checkpoint_blob = Column(LargeBinary, nullable=False)
    checkpoint_format = Column(String(50), default="json", nullable=False)
    metadata_blob = Column(JSONB, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
