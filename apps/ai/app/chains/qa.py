import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

import app.main as main_app
from app.config import settings
from app.prompts.loader import load_prompt

async def document_qa(
    question: str,
    document_id: str,
    workspace_id: str,
    db: AsyncSession,
) -> dict:
    """
    RAG pipeline:
    1. Embed the question (local sentence-transformers).
    2. Retrieve top-5 relevant chunks from THIS document only.
    3. Build prompt: system message + context chunks + question.
    4. Generate answer with Groq LLM.
    5. Return answer + source chunks (with similarity scores).
    """
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured. Please add it to your .env file.")

    # 1. Parse UUIDs
    try:
        doc_uuid = uuid.UUID(str(document_id))
        ws_uuid = uuid.UUID(str(workspace_id))
    except ValueError:
        raise ValueError("Invalid document or workspace UUID format.")

    # 2. Embed the question
    if main_app.embedding_model is None:
        from sentence_transformers import SentenceTransformer
        main_app.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        
    query_vector = main_app.embedding_model.encode(question).tolist()

    # 3. Retrieve top-5 relevant chunks from THIS document only
    query_sql = text("""
        SELECT 
            chunk_text, 
            metadata,
            1 - (embedding <=> CAST(:query_vector AS vector)) AS similarity
        FROM ai.embeddings
        WHERE source_id = :document_id
          AND workspace_id = :workspace_id
          AND source_type = 'document'
        ORDER BY similarity DESC
        LIMIT 5
    """)

    res = await db.execute(
        query_sql,
        {
            "document_id": doc_uuid,
            "workspace_id": ws_uuid,
            "query_vector": str(query_vector),
        }
    )
    
    rows = res.fetchall()
    
    # If no chunks are found in embeddings, check if document exists at all
    if not rows:
        # Check if document exists
        doc_check = text('SELECT id FROM "Document" WHERE id = :doc_id AND workspace_id = :workspace_id AND is_archived = false')
        doc_res = await db.execute(doc_check, {"doc_id": str(doc_uuid), "workspace_id": str(ws_uuid)})
        if not doc_res.fetchone():
            raise ValueError("Document not found in this workspace.")
        
        # Document exists but has no embeddings
        return {
            "answer": "This document has not been processed for Q&A yet (no vector embeddings found).",
            "sources": [],
            "model": settings.DEFAULT_LLM_MODEL,
        }

    # Format context and sources
    context_chunks = []
    sources = []
    
    for row in rows:
        chunk_text = row[0]
        meta = row[1]
        similarity = float(row[2])
        
        section_title = meta.get("section_title") if meta else None
        source_label = f"Section: {section_title}" if section_title else "Document Content"
        
        context_chunks.append(f"[{source_label}]\n{chunk_text}")
        sources.append({
            "chunk_text": chunk_text,
            "similarity": similarity,
            "section_title": section_title,
        })
        
    context_str = "\n\n---\n\n".join(context_chunks)

    # 4. Generate answer using Groq LLM
    system_prompt = load_prompt("qa_v1.txt")
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", (
            "Context from document:\n"
            "{context}\n\n"
            "Question: {question}"
        ))
    ])

    llm = ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=settings.DEFAULT_LLM_MODEL,
        temperature=0.0,  # low temperature for RAG grounding
    )

    chain = prompt | llm
    result = await chain.ainvoke({
        "context": context_str,
        "question": question,
    })
    
    return {
        "answer": result.content.strip(),
        "sources": sources,
        "model": settings.DEFAULT_LLM_MODEL,
    }
