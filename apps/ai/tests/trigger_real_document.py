import sys
import asyncio
import uuid
from sqlalchemy import text, select

from app.database import async_session
from app.models.ai_job import AIJob
from app.models.embedding import Embedding

REAL_DOCUMENT_ID = uuid.UUID("e2d06f5c-21c4-40a1-8a63-528dd8bcb7ab")

async def trigger_real_doc_embedding():
    print(f"Connecting to database to check document '{REAL_DOCUMENT_ID}'...")
    async with async_session() as session:
        # 1. Fetch the real document's workspace_id and title
        stmt_doc = text('SELECT workspace_id, title FROM "Document" WHERE id = :doc_id')
        res_doc = await session.execute(stmt_doc, {"doc_id": str(REAL_DOCUMENT_ID)})
        doc = res_doc.fetchone()
        
        if not doc:
            print(f"\n[Error] Document '{REAL_DOCUMENT_ID}' not found in your database.")
            print("Please make sure the ID is correct and exists in your public.\"Document\" table.")
            return
            
        workspace_id_str, title = doc[0], doc[1]
        workspace_id = uuid.UUID(workspace_id_str)
        print(f"Found document: Title='{title}', Workspace ID='{workspace_id}'")

        # 2. Check if a job is already in queue
        stmt_job = select(AIJob).where(
            AIJob.source_id == REAL_DOCUMENT_ID,
            AIJob.status.in_(["pending", "processing"])
        )
        existing_job = (await session.execute(stmt_job)).scalars().first()
        if existing_job:
            print(f"\n[Info] A job is already '{existing_job.status}' for this document (Job ID: {existing_job.id}).")
            print("The worker will pick it up automatically or is already running it.")
            return

        # 3. Insert the pending job in ai.ai_jobs
        print("Inserting pending 'embed_document' job into queue...")
        job = AIJob(
            workspace_id=workspace_id,
            job_type="embed_document",
            source_type="document",
            source_id=REAL_DOCUMENT_ID,
            status="pending"
        )
        session.add(job)
        await session.commit()
        print(f"\nJob successfully queued! (Job ID: {job.id})")

    print("\nNext Steps:")
    print("1. Look at your running FastAPI (uvicorn) console.")
    print("2. The worker will pick up this job, download its attachments, chunk it, and save the embeddings.")
    print("3. Once finished, you can run this script with 'status' to view the generated chunks in database:")
    print("   .venv\\Scripts\\python tests\\trigger_real_document.py status")

async def view_status():
    print(f"Checking database status for document '{REAL_DOCUMENT_ID}'...")
    async with async_session() as session:
        # Check jobs
        stmt_job = select(AIJob).where(AIJob.source_id == REAL_DOCUMENT_ID)
        jobs = (await session.execute(stmt_job)).scalars().all()
        
        # Check generated embeddings
        stmt_emb = select(Embedding).where(Embedding.source_id == REAL_DOCUMENT_ID)
        embeddings = (await session.execute(stmt_emb)).scalars().all()
        
        print("\n" + "=" * 60)
        print(f"STATUS FOR DOCUMENT '{REAL_DOCUMENT_ID}':")
        print("=" * 60)
        
        if jobs:
            print("\nRelated Job Queue History:")
            for j in jobs:
                print(f"  - Job ID: {j.id}")
                print(f"    Type:   {j.job_type}")
                print(f"    Status: {j.status}")
                if j.completed_at:
                    print(f"    Done:   {j.completed_at}")
                if j.error:
                    print(f"    Error:  {j.error}")
        else:
            print("\nNo job queue history found.")

        print(f"\nVector Embeddings: Found {len(embeddings)} chunk(s) saved in database.")
        for idx, emb in enumerate(embeddings):
            print(f"  Chunk {idx + 1} (Index={emb.chunk_index}):")
            snippet = emb.chunk_text.replace("\n", " ")
            print(f"    Text: '{snippet[:100]}...'")
            print(f"    Dims: {len(emb.embedding)}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')
        
    mode = sys.argv[1] if len(sys.argv) > 1 else "trigger"
    if mode == "trigger":
        asyncio.run(trigger_real_doc_embedding())
    elif mode == "status":
        asyncio.run(view_status())
    else:
        print("Usage: .venv\\Scripts\\python tests\\trigger_real_document.py [trigger|status]")
