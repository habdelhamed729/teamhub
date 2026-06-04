import hashlib
import json
import uuid
from sqlalchemy import text, select, delete
from sqlalchemy.ext.asyncio import AsyncSession

import app.main as main_app
from app.config import settings
from app.models.embedding import Embedding
from app.embeddings.parsers import extract_sections, clean_text
from app.embeddings.chunker import chunk_by_sections
from app.utils.attachments import extract_text_from_attachment

async def embed_document(document_id: str, workspace_id: str, db: AsyncSession) -> int:
    """
    Orchestrate the document embedding pipeline:
    1. Fetch document from PostgreSQL ("Document" table)
    2. Parse the TipTap JSON content to raw text sections
    3. Query all attachments associated with this document ("Attachment" table)
    4. Download and extract text from supported attachments
    5. Append attachment texts as additional document sections
    6. Hash compiled content and skip re-embedding if unchanged
    7. Split sections into chunks prepending section header context
    8. Generate embeddings locally with sentence-transformers
    9. Atomically delete old embeddings and save new ones
    """
    try:
        # Convert string parameters to UUIDs for SQLAlchemy queries
        doc_uuid = uuid.UUID(str(document_id))
        ws_uuid = uuid.UUID(str(workspace_id))
    except ValueError as e:
        print(f"[Pipeline] Invalid UUID format: {e}")
        return 0

    print(f"[Pipeline] Starting embedding pipeline for document: {doc_uuid}...")

    # 1. Fetch document
    doc_stmt = text('SELECT title, content FROM "Document" WHERE id = :doc_id AND is_archived = false')
    res = await db.execute(doc_stmt, {"doc_id": str(doc_uuid)})
    doc = res.fetchone()
    
    if not doc:
        print(f"[Pipeline] Document {doc_uuid} not found or is archived. Aborting.")
        return 0
        
    doc_title, doc_content = doc[0], doc[1]

    # 2. Parse TipTap JSON to structured sections
    sections = extract_sections(doc_content)
    
    # Prepend an introduction section header if sections don't have titles
    if sections and sections[0]["title"] == "Introduction" and doc_title:
        sections[0]["title"] = doc_title

    # 3. Query associated attachments
    attach_stmt = text('SELECT file_name, url, file_type FROM "Attachment" WHERE document_id = :doc_id')
    res_attach = await db.execute(attach_stmt, {"doc_id": str(doc_uuid)})
    attachments = res_attach.fetchall()

    # 4. Download and parse attachments
    for att in attachments:
        file_name, url, file_type = att[0], att[1], att[2]
        print(f"[Pipeline] Processing linked attachment: '{file_name}'...")
        att_text = clean_text(await extract_text_from_attachment(url, file_type))
        if att_text:
            sections.append({
                "title": f"Attachment: {file_name}",
                "text": att_text
            })

    if not sections or (len(sections) == 1 and not sections[0]["text"].strip()):
        print(f"[Pipeline] Document {doc_uuid} has no textual content. Cleaning up existing embeddings.")
        await db.execute(delete(Embedding).where(Embedding.source_id == doc_uuid))
        await db.commit()
        return 0

    # 5. Compute SHA-256 hash of the compiled sections to check for changes
    sections_hash_input = json.dumps(sections, sort_keys=True)
    content_hash = hashlib.sha256(sections_hash_input.encode("utf-8")).hexdigest()

    # 6. Check if content hash matches existing embeddings
    stmt_hash = select(Embedding.content_hash).where(Embedding.source_id == doc_uuid).limit(1)
    existing_hash = (await db.execute(stmt_hash)).scalar_one_or_none()
    
    if existing_hash == content_hash:
        print(f"[Pipeline] Document {doc_uuid} content is unchanged. Skipping re-embedding.")
        return 0

    # 7. Split into optimal chunks
    chunks = chunk_by_sections(sections)
    if not chunks:
        print(f"[Pipeline] Chunks generated were empty. Deleting old embeddings.")
        await db.execute(delete(Embedding).where(Embedding.source_id == doc_uuid))
        await db.commit()
        return 0

    # 8. Generate embeddings
    chunk_texts = [c["chunk_text"] for c in chunks]
    
    # Ensure local sentence-transformers model is loaded
    if main_app.embedding_model is None:
        print("[Pipeline] Embedding model not in memory. Loading model...")
        from sentence_transformers import SentenceTransformer
        main_app.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)

    print(f"[Pipeline] Generating vector embeddings for {len(chunk_texts)} chunks...")
    embeddings_list = main_app.embedding_model.encode(chunk_texts).tolist()

    # 9. Atomically clear old and insert new embeddings
    await db.execute(delete(Embedding).where(Embedding.source_id == doc_uuid))
    
    for idx, chunk in enumerate(chunks):
        emb_rec = Embedding(
            workspace_id=ws_uuid,
            source_type="document",
            source_id=doc_uuid,
            chunk_index=chunk["chunk_index"],
            chunk_text=chunk["chunk_text"],
            content_hash=content_hash,
            metadata_={"section_title": chunk["section_title"]},
            embedding=embeddings_list[idx]
        )
        db.add(emb_rec)
        
    await db.commit()
    print(f"[Pipeline] Successfully saved {len(chunks)} embeddings in ai.embeddings.")
    return len(chunks)
