import sys
import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import select

from app.database import async_session
from app.models.embedding import Embedding
from app.models.ai_job import AIJob
from app.models.ai_cache import AICache

# Static UUIDs so we can query them easily in Neon Console
TEST_WORKSPACE_ID = uuid.UUID("baaaaaad-beef-4321-baad-feeddeadbeef")
TEST_SOURCE_ID = uuid.UUID("caaaaaad-beef-4321-caad-feeddeadbeef")
TEST_CACHE_KEY = "neon_console_verification_key_123"

async def write_data():
    print("Connecting to Neon Database...")
    async with async_session() as session:
        # Check if already exists to prevent duplicate key errors
        stmt = select(AICache).where(AICache.cache_key == TEST_CACHE_KEY)
        existing = (await session.execute(stmt)).scalars().first()
        if existing:
            print("\n[Warning] Test data already exists. Run 'read' first to clear it.")
            return

        print("Writing test records to 'ai' schema tables...")
        
        # 1. Embedding record
        embedding_rec = Embedding(
            workspace_id=TEST_WORKSPACE_ID,
            source_type="verification",
            source_id=TEST_SOURCE_ID,
            chunk_index=0,
            chunk_text="This is a persistent record to verify Neon console storage.",
            content_hash="neon-verif-hash-999",
            metadata_={"verification": "true"},
            embedding=[0.05] * 384
        )
        session.add(embedding_rec)
        
        # 2. AI Job record
        job_rec = AIJob(
            workspace_id=TEST_WORKSPACE_ID,
            job_type="verify_neon",
            source_type="verification",
            source_id=TEST_SOURCE_ID,
            payload={"step": 3},
            status="completed"
        )
        session.add(job_rec)
        
        # 3. AI Cache record
        cache_rec = AICache(
            cache_key=TEST_CACHE_KEY,
            workspace_id=TEST_WORKSPACE_ID,
            response={"status": "Neon verification success!"},
            model="llama-3-scout",
            expires_at=datetime.now(timezone.utc) + timedelta(days=1)
        )
        session.add(cache_rec)
        
        await session.commit()
        print("Commit completed! The data is now saved in Neon PostgreSQL.")
        
    print("\n" + "=" * 50)
    print("RECORDS SAVED IN NEON:")
    print(f"Workspace ID: {TEST_WORKSPACE_ID}")
    print(f"Source ID:    {TEST_SOURCE_ID}")
    print(f"Cache Key:    {TEST_CACHE_KEY}")
    print("=" * 50)
    print("\nYou can now open your Neon Console (or query editor) and run:")
    print("SELECT * FROM ai.embeddings WHERE workspace_id = 'baaaaaad-beef-4321-baad-feeddeadbeef';")
    print("SELECT * FROM ai.ai_jobs WHERE workspace_id = 'baaaaaad-beef-4321-baad-feeddeadbeef';")
    print("SELECT * FROM ai.ai_cache WHERE cache_key = 'neon_console_verification_key_123';")
    print("\nTo read and clear the records from the command line, run:")
    print("  .venv\\Scripts\\python tests\\verify_neon.py read")

async def read_and_clear():
    print("Connecting to Neon to query records...")
    async with async_session() as session:
        # Fetch records
        stmt_emb = select(Embedding).where(Embedding.workspace_id == TEST_WORKSPACE_ID)
        res_emb = (await session.execute(stmt_emb)).scalars().all()
        
        stmt_job = select(AIJob).where(AIJob.workspace_id == TEST_WORKSPACE_ID)
        res_job = (await session.execute(stmt_job)).scalars().all()
        
        stmt_cache = select(AICache).where(AICache.cache_key == TEST_CACHE_KEY)
        res_cache = (await session.execute(stmt_cache)).scalars().all()
        
        print("\n" + "=" * 50)
        print("DATABASE RECORD VIEWER:")
        print("=" * 50)
        
        print(f"\n1. ai.embeddings: Found {len(res_emb)} record(s)")
        for r in res_emb:
            print(f"   - ID: {r.id}")
            print(f"   - Chunk Text: '{r.chunk_text}'")
            print(f"   - Vector Dims: {len(r.embedding)} (values show: {r.embedding[:3]}...)")
            
        print(f"\n2. ai.ai_jobs: Found {len(res_job)} record(s)")
        for r in res_job:
            print(f"   - ID: {r.id}")
            print(f"   - Job Type: '{r.job_type}'")
            print(f"   - Status: '{r.status}'")
            
        print(f"\n3. ai.ai_cache: Found {len(res_cache)} record(s)")
        for r in res_cache:
            print(f"   - ID: {r.id}")
            print(f"   - Cache Key: '{r.cache_key}'")
            print(f"   - Response: {r.response}")
            
        # Clean up
        if res_emb or res_job or res_cache:
            print("\n" + "-" * 50)
            print("Cleaning up (deleting) test records from Neon...")
            for r in res_emb:
                await session.delete(r)
            for r in res_job:
                await session.delete(r)
            for r in res_cache:
                await session.delete(r)
            await session.commit()
            print("Cleanup completed! Records successfully deleted from Neon.")
        else:
            print("\nNo mock records found to clear.")

if __name__ == "__main__":
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')
        
    mode = sys.argv[1] if len(sys.argv) > 1 else "write"
    if mode == "write":
        asyncio.run(write_data())
    elif mode in ("read", "clear", "read-clear"):
        asyncio.run(read_and_clear())
    else:
        print("Usage: .venv\\Scripts\\python tests\\verify_neon.py [write|read]")
