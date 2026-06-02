import sys
import asyncio
import uuid
import json
from sqlalchemy import text, select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.ai_job import AIJob
from app.models.embedding import Embedding

# Reuse the static UUIDs for easy manual verification
TEST_DOCUMENT_ID = uuid.UUID("caaaaaad-beef-4321-caad-feeddeadbeef")
TEST_ATTACH_ID = uuid.UUID("daaaaaad-beef-4321-daad-feeddeadbeef")

async def setup_test_job():
    print("Connecting to database...")
    async with async_session() as session:
        # 1. Fetch a valid user to satisfy foreign key constraint on Document
        res_user = await session.execute(text('SELECT id FROM "User" LIMIT 1'))
        user = res_user.fetchone()
        if not user:
            print("[Error] No User found in database to link the mock document. Please create a user first.")
            return
        user_id = user[0]

        # 2. Fetch a valid workspace to satisfy foreign key constraint on Document
        res_ws = await session.execute(text('SELECT id FROM "Workspace" LIMIT 1'))
        ws = res_ws.fetchone()
        if not ws:
            print("[Error] No Workspace found in database. Please create a workspace first.")
            return
        ws_id = ws[0]

        # 3. Check and clean up any existing mock records from previous tests
        await session.execute(text('DELETE FROM "Attachment" WHERE id = :id'), {"id": str(TEST_ATTACH_ID)})
        await session.execute(text('DELETE FROM "Document" WHERE id = :id'), {"id": str(TEST_DOCUMENT_ID)})
        await session.execute(delete(AIJob).where(AIJob.source_id == TEST_DOCUMENT_ID))
        await session.execute(delete(Embedding).where(Embedding.source_id == TEST_DOCUMENT_ID))
        await session.commit()

        print("Writing mock document and PDF attachment to database...")
        
        # TipTap content
        mock_content = {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "Interactive Job Test"}]
                },
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "This document is processed asynchronously using the background worker."
                        }
                    ]
                }
            ]
        }
        
        # 4. Create mock Document
        await session.execute(
            text(
                'INSERT INTO "Document" (id, workspace_id, created_by_id, title, content, is_archived, created_at, updated_at) '
                'VALUES (:doc_id, :ws_id, :user_id, :title, :content, false, NOW(), NOW())'
            ),
            {
                "doc_id": str(TEST_DOCUMENT_ID),
                "ws_id": str(ws_id),
                "user_id": str(user_id),
                "title": "Interactive Job Test",
                "content": json.dumps(mock_content)
            }
        )
        
        # 5. Create mock Attachment (using the Cloudinary dart.pdf file)
        pdf_url = "https://res.cloudinary.com/dnrzcqzdi/raw/upload/v1780081730/teamhub/attachments/1780081732563-dart.pdf"
        await session.execute(
            text(
                'INSERT INTO "Attachment" (id, file_name, url, file_type, file_size, uploaded_by, document_id, created_at) '
                'VALUES (:attach_id, :file_name, :url, :file_type, :file_size, :user_id, :doc_id, NOW())'
            ),
            {
                "attach_id": str(TEST_ATTACH_ID),
                "file_name": "dart.pdf",
                "url": pdf_url,
                "file_type": "application/pdf",
                "file_size": 1024,
                "user_id": str(user_id),
                "doc_id": str(TEST_DOCUMENT_ID)
            }
        )
        
        # 6. Insert the PENDING AI job into the queue
        job = AIJob(
            workspace_id=uuid.UUID(str(ws_id)),
            job_type="embed_document",
            source_type="document",
            source_id=TEST_DOCUMENT_ID,
            status="pending"
        )
        session.add(job)
        
        await session.commit()
        print("\n" + "=" * 60)
        print("MOCK DATA AND PENDING JOB INSERTED SUCCESSFULLY!")
        print("=" * 60)
        print(f"Workspace ID: {ws_id}")
        print(f"Document ID:  {TEST_DOCUMENT_ID}")
        print(f"Attachment:   dart.pdf")
        print(f"Job Status:   pending")
        
    print("\nInstructions:")
    print("1. Keep this terminal open.")
    print("2. In another terminal, start your FastAPI dev server:")
    print("   .venv\\Scripts\\uvicorn app.main:app --reload --port 8000")
    print("3. Watch the uvicorn terminal console! You should see it pick up the job and run the pipeline.")
    print("4. Once completed, run this script again with 'verify' to inspect the results and cleanup:")
    print("   .venv\\Scripts\\python tests\\trigger_job_test.py verify")

async def verify_and_cleanup():
    print("Querying results from database...")
    async with async_session() as session:
        # Check Job Status
        stmt_job = select(AIJob).where(AIJob.source_id == TEST_DOCUMENT_ID)
        job = (await session.execute(stmt_job)).scalars().first()
        
        # Check saved embeddings
        stmt_emb = select(Embedding).where(Embedding.source_id == TEST_DOCUMENT_ID)
        embeddings = (await session.execute(stmt_emb)).scalars().all()
        
        print("\n" + "=" * 60)
        print("ASYNC JOB EXECUTION RESULTS:")
        print("=" * 60)
        if job:
            print(f"Job Status:   {job.status}")
            print(f"Job Attempts: {job.attempts}/{job.max_attempts}")
            print(f"Locked By:    {job.locked_by}")
            if job.error:
                print(f"Job Error:    {job.error}")
        else:
            print("No job record found.")

        print(f"\nCreated Embeddings: Found {len(embeddings)} chunks saved in database.")
        for idx, emb in enumerate(embeddings):
            print(f"  Chunk {idx + 1}: Index={emb.chunk_index}, Text Snippet: '{emb.chunk_text[:60]}...'")

        # Cleanup
        print("\n" + "-" * 60)
        print("Cleaning up mock records from Neon database...")
        await session.execute(delete(Embedding).where(Embedding.source_id == TEST_DOCUMENT_ID))
        await session.execute(delete(AIJob).where(AIJob.source_id == TEST_DOCUMENT_ID))
        await session.execute(text('DELETE FROM "Attachment" WHERE id = :id'), {"id": str(TEST_ATTACH_ID)})
        await session.execute(text('DELETE FROM "Document" WHERE id = :id'), {"id": str(TEST_DOCUMENT_ID)})
        await session.commit()
        print("Cleanup completed successfully!")

if __name__ == "__main__":
    if sys.platform == 'win32':
        sys.stdout.reconfigure(encoding='utf-8')

    mode = sys.argv[1] if len(sys.argv) > 1 else "trigger"
    if mode == "trigger":
        asyncio.run(setup_test_job())
    elif mode == "verify":
        asyncio.run(verify_and_cleanup())
    else:
        print("Usage: .venv\\Scripts\\python tests\\trigger_job_test.py [trigger|verify]")
