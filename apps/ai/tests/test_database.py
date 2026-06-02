import pytest
import uuid
import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select

from app.database import async_session
from app.models.embedding import Embedding
from app.models.ai_job import AIJob
from app.models.ai_cache import AICache

@pytest.mark.asyncio
async def test_database_operations():
    """Verify that we can write, read, and delete records from all three custom schemas."""
    workspace_id = uuid.uuid4()
    source_id = uuid.uuid4()
    
    # Mock a 384-dimensional float vector for sentence-transformers model
    dummy_vector = [0.1] * 384
    
    # 1. Write mock records
    async with async_session() as session:
        # Create embedding record
        embedding_rec = Embedding(
            workspace_id=workspace_id,
            source_type="document",
            source_id=source_id,
            chunk_index=0,
            chunk_text="This is a test chunk to verify DB schema operations.",
            content_hash="test-content-hash-abcdef",
            metadata_={"test_meta": "yes"},
            embedding=dummy_vector
        )
        session.add(embedding_rec)
        
        # Create AI job record
        job_rec = AIJob(
            workspace_id=workspace_id,
            job_type="embed_document",
            source_type="document",
            source_id=source_id,
            payload={"doc_id": str(source_id)},
            status="pending"
        )
        session.add(job_rec)
        
        # Create AI cache record
        cache_rec = AICache(
            cache_key=f"test_cache_{uuid.uuid4()}",
            workspace_id=workspace_id,
            response={"reply": "Mock reply"},
            model="llama-3.1-8b-instant",
            token_usage={"total_tokens": 15},
            expires_at=datetime.now(timezone.utc) + timedelta(hours=1)
        )
        session.add(cache_rec)
        
        await session.commit()
        
    # 2. Read back and verify correctness
    async with async_session() as session:
        # Query Embedding
        stmt_emb = select(Embedding).where(Embedding.workspace_id == workspace_id)
        res_emb = (await session.execute(stmt_emb)).scalars().all()
        assert len(res_emb) == 1
        assert res_emb[0].source_type == "document"
        assert res_emb[0].chunk_text == "This is a test chunk to verify DB schema operations."
        assert len(res_emb[0].embedding) == 384
        
        # Query Job
        stmt_job = select(AIJob).where(AIJob.workspace_id == workspace_id)
        res_job = (await session.execute(stmt_job)).scalars().all()
        assert len(res_job) == 1
        assert res_job[0].job_type == "embed_document"
        assert res_job[0].status == "pending"
        
        # Query Cache
        stmt_cache = select(AICache).where(AICache.workspace_id == workspace_id)
        res_cache = (await session.execute(stmt_cache)).scalars().all()
        assert len(res_cache) == 1
        assert res_cache[0].model == "llama-3.1-8b-instant"
        
        # 3. Clean up records
        await session.delete(res_emb[0])
        await session.delete(res_job[0])
        await session.delete(res_cache[0])
        await session.commit()
        
    print("\n[DB Test] Successfully wrote, verified, and cleaned up records in Neon Database!")

if __name__ == "__main__":
    # Allow running the test directly via 'python tests/test_database.py'
    print("Running database schema operations test...")
    asyncio.run(test_database_operations())
