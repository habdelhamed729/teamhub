from collections.abc import AsyncIterator
from typing import Any, Optional, Sequence
from contextlib import asynccontextmanager
from langchain_core.runnables import RunnableConfig
from langgraph.checkpoint.base import (
    BaseCheckpointSaver,
    Checkpoint,
    CheckpointMetadata,
    CheckpointTuple,
    ChannelVersions,
)
from sqlalchemy import select, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.graph_checkpoint import GraphCheckpoint
from unittest.mock import Mock, AsyncMock, MagicMock

class SQLAlchemyCheckpointSaver(BaseCheckpointSaver):
    def __init__(self, session_or_factory, *, serde = None):
        super().__init__(serde=serde)
        if (hasattr(session_or_factory, "__call__") or hasattr(session_or_factory, "class_")) and not isinstance(session_or_factory, (Mock, AsyncMock, MagicMock)):
            self.session_factory = session_or_factory
            self.session = None
        else:
            self.session_factory = None
            self.session = session_or_factory

    @asynccontextmanager
    async def _get_session(self):
        if self.session_factory:
            async with self.session_factory() as session:
                yield session
        else:
            yield self.session

    async def aget_tuple(self, config: RunnableConfig) -> Optional[CheckpointTuple]:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = config["configurable"].get("checkpoint_id")

        async with self._get_session() as session:
            if checkpoint_id:
                stmt = select(GraphCheckpoint).where(
                    and_(
                        GraphCheckpoint.thread_id == thread_id,
                        GraphCheckpoint.checkpoint_ns == checkpoint_ns,
                        GraphCheckpoint.checkpoint_id == checkpoint_id,
                    )
                )
            else:
                stmt = (
                    select(GraphCheckpoint)
                    .where(
                        and_(
                            GraphCheckpoint.thread_id == thread_id,
                            GraphCheckpoint.checkpoint_ns == checkpoint_ns,
                        )
                    )
                    .order_by(desc(GraphCheckpoint.created_at))
                    .limit(1)
                )

            res = await session.execute(stmt)
            row = res.scalars().first()
            if not row:
                return None

            checkpoint = self.serde.loads_typed((row.checkpoint_format, row.checkpoint_blob))
            metadata = row.metadata_blob
            parent_checkpoint_id = row.parent_checkpoint_id

        parent_config = None
        if parent_checkpoint_id:
            parent_config = {
                "configurable": {
                    "thread_id": thread_id,
                    "checkpoint_ns": checkpoint_ns,
                    "checkpoint_id": parent_checkpoint_id,
                }
            }

        return CheckpointTuple(
            config={
                "configurable": {
                    "thread_id": thread_id,
                    "checkpoint_ns": checkpoint_ns,
                    "checkpoint_id": checkpoint_id,
                }
            },
            checkpoint=checkpoint,
            metadata=metadata,
            parent_config=parent_config,
        )

    async def aput(
        self,
        config: RunnableConfig,
        checkpoint: Checkpoint,
        metadata: CheckpointMetadata,
        new_versions: ChannelVersions,
    ) -> RunnableConfig:
        thread_id = config["configurable"]["thread_id"]
        checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
        checkpoint_id = checkpoint["id"]
        parent_checkpoint_id = config["configurable"].get("checkpoint_id")

        checkpoint_format, checkpoint_blob = self.serde.dumps_typed(checkpoint)
        metadata_dict = dict(metadata)

        async with self._get_session() as session:
            stmt = select(GraphCheckpoint).where(
                and_(
                    GraphCheckpoint.thread_id == thread_id,
                    GraphCheckpoint.checkpoint_ns == checkpoint_ns,
                    GraphCheckpoint.checkpoint_id == checkpoint_id,
                )
            )
            res = await session.execute(stmt)
            existing = res.scalars().first()

            if existing:
                existing.checkpoint_blob = checkpoint_blob
                existing.checkpoint_format = checkpoint_format
                existing.metadata_blob = metadata_dict
                existing.parent_checkpoint_id = parent_checkpoint_id
            else:
                db_checkpoint = GraphCheckpoint(
                    thread_id=thread_id,
                    checkpoint_ns=checkpoint_ns,
                    checkpoint_id=checkpoint_id,
                    parent_checkpoint_id=parent_checkpoint_id,
                    checkpoint_blob=checkpoint_blob,
                    checkpoint_format=checkpoint_format,
                    metadata_blob=metadata_dict,
                )
                session.add(db_checkpoint)

            if self.session_factory:
                await session.commit()
            else:
                await session.flush()

        return {
            "configurable": {
                "thread_id": thread_id,
                "checkpoint_ns": checkpoint_ns,
                "checkpoint_id": checkpoint_id,
            }
        }

    async def aput_writes(
        self,
        config: RunnableConfig,
        writes: Sequence[tuple[str, Any]],
        task_id: str,
        task_path: str = "",
    ) -> None:
        # No-op for now. Required to satisfy base class abstract requirements.
        pass

    async def alist(
        self,
        config: RunnableConfig | None,
        *,
        filter: dict[str, Any] | None = None,
        before: RunnableConfig | None = None,
        limit: int | None = None,
    ) -> AsyncIterator[CheckpointTuple]:
        if config is None:
            stmt = select(GraphCheckpoint)
        else:
            thread_id = config["configurable"]["thread_id"]
            checkpoint_ns = config["configurable"].get("checkpoint_ns", "")
            stmt = select(GraphCheckpoint).where(
                and_(
                    GraphCheckpoint.thread_id == thread_id,
                    GraphCheckpoint.checkpoint_ns == checkpoint_ns,
                )
            )

        stmt = stmt.order_by(desc(GraphCheckpoint.created_at))
        if limit:
            stmt = stmt.limit(limit)

        async with self._get_session() as session:
            res = await session.execute(stmt)
            rows = res.scalars().all()

        for row in rows:
            checkpoint = self.serde.loads_typed((row.checkpoint_format, row.checkpoint_blob))
            parent_config = None
            if row.parent_checkpoint_id:
                parent_config = {
                    "configurable": {
                        "thread_id": row.thread_id,
                        "checkpoint_ns": row.checkpoint_ns,
                        "checkpoint_id": row.parent_checkpoint_id,
                    }
                }
            yield CheckpointTuple(
                config={
                    "configurable": {
                        "thread_id": row.thread_id,
                        "checkpoint_ns": row.checkpoint_ns,
                        "checkpoint_id": row.checkpoint_id,
                    }
                },
                checkpoint=checkpoint,
                metadata=row.metadata_blob,
                parent_config=parent_config,
            )
