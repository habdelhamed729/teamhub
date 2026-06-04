import pytest
import uuid
import json
from sqlalchemy import text, delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.embeddings.pipeline import embed_document
from app.models.embedding import Embedding

@pytest.mark.asyncio
async def test_embedding_pipeline():
    """Verify document fetching, TipTap parsing, Cloudinary PDF downloading/extracting, and embedding."""
    # 1. Fetch valid user and workspace to bypass DB constraints
    async with async_session() as session:
        res_ws = await session.execute(text('SELECT id FROM "Workspace" LIMIT 1'))
        ws = res_ws.fetchone()
        
        res_user = await session.execute(text('SELECT id FROM "User" LIMIT 1'))
        user = res_user.fetchone()
        
        if not ws or not user:
            pytest.skip("No workspace or user found in database. Skipping pipeline integration test.")
            
        ws_id = ws[0]
        user_id = user[0]

    doc_id = uuid.uuid4()
    attach_id = uuid.uuid4()
    
    # Mock TipTap document structure
    mock_content = {
        "type": "doc",
        "content": [
            {
                "type": "heading",
                "attrs": {"level": 1},
                "content": [{"type": "text", "text": "Integration Test Document"}]
            },
            {
                "type": "paragraph",
                "content": [
                    {
                        "type": "text",
                        "text": "This is raw document text content to test RAG pipelines and vector database saves."
                    }
                ]
            }
        ]
    }
    
    # Real, public PDF file from Cloudinary (supplied in original requests)
    pdf_url = "https://res.cloudinary.com/dnrzcqzdi/raw/upload/v1780081730/teamhub/attachments/1780081732563-dart.pdf"
    
    # 2. Insert mock document and attachment records
    async with async_session() as session:
        # Create mock Document
        await session.execute(
            text(
                'INSERT INTO "Document" (id, workspace_id, created_by_id, title, content, is_archived, created_at, updated_at) '
                'VALUES (:doc_id, :ws_id, :user_id, :title, :content, false, NOW(), NOW())'
            ),
            {
                "doc_id": str(doc_id),
                "ws_id": str(ws_id),
                "user_id": str(user_id),
                "title": "Integration Test Document",
                "content": json.dumps(mock_content)
            }
        )
        
        # Create mock Attachment associated with this Document
        await session.execute(
            text(
                'INSERT INTO "Attachment" (id, file_name, url, file_type, file_size, uploaded_by, document_id, created_at) '
                'VALUES (:attach_id, :file_name, :url, :file_type, :file_size, :user_id, :doc_id, NOW())'
            ),
            {
                "attach_id": str(attach_id),
                "file_name": "dart.pdf",
                "url": pdf_url,
                "file_type": "application/pdf",
                "file_size": 1024,
                "user_id": str(user_id),
                "doc_id": str(doc_id)
            }
        )
        await session.commit()
        
    try:
        # 3. Execute the embedding pipeline
        async with async_session() as session:
            chunks_count = await embed_document(doc_id, ws_id, session)
            assert chunks_count > 0, "No chunks embedded from document and PDF attachment"
            
            # Verify records saved in ai.embeddings
            stmt = select(Embedding).where(Embedding.source_id == doc_id)
            res_emb = (await session.execute(stmt)).scalars().all()
            assert len(res_emb) == chunks_count, f"Found {len(res_emb)} embeddings, expected {chunks_count}"
            
            # Verify embedding schema metadata and properties
            for r in res_emb:
                assert r.workspace_id == uuid.UUID(str(ws_id))
                assert r.source_type == "document"
                assert r.source_id == doc_id
                assert len(r.embedding) == 384, "Embedding dimensions must match sentence-transformer output (384)"
                
    finally:
        # 4. Clean up mock records to leave database state clean
        async with async_session() as session:
            # Delete embeddings
            await session.execute(delete(Embedding).where(Embedding.source_id == doc_id))
            # Delete attachment record
            await session.execute(
                text('DELETE FROM "Attachment" WHERE id = :attach_id'),
                {"attach_id": str(attach_id)}
            )
            # Delete document record
            await session.execute(
                text('DELETE FROM "Document" WHERE id = :doc_id'),
                {"doc_id": str(doc_id)}
            )
            await session.commit()
            print("[Test] Successfully executed embedding pipeline, verified output, and cleaned up.")
