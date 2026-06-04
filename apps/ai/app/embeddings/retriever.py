import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import app.main as main_app
from app.config import settings
from app.models.embedding import Embedding

async def semantic_search(
    query: str,
    workspace_id: str,
    db: AsyncSession,
    source_type: str | None = None,
    limit: int = 10,
    similarity_threshold: float = 0.35,  # Moderate default threshold for MiniLM
) -> list[dict]:
    """
    Query the vector database for similar chunks in a specific workspace.
    
    Steps:
    1. Embed the search query using the loaded SentenceTransformer.
    2. Run a cosine similarity search against the ai.embeddings table.
    3. Join with the public."Document" table to retrieve titles and filter out archived docs.
    4. Return structured, ranked results.
    """
    # 1. Ensure embedding model is loaded and generate query vector
    if main_app.embedding_model is None:
        from sentence_transformers import SentenceTransformer
        main_app.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        
    query_vector = main_app.embedding_model.encode(query).tolist()

    # 2. Parse UUID
    try:
        ws_uuid = uuid.UUID(str(workspace_id))
    except ValueError:
        print(f"[Retriever] Invalid workspace UUID: {workspace_id}")
        return []

    # 3. Query PostgreSQL using raw SQL for the cross-schema join and vector distance
    # pgvector <=> returns cosine distance, so 1 - <=> is cosine similarity
    query_sql = text("""
        SELECT 
            e.source_id, 
            e.chunk_index, 
            e.chunk_text, 
            e.metadata, 
            d.title AS document_title,
            1 - (e.embedding <=> CAST(:query_vector AS vector)) AS similarity
        FROM ai.embeddings e
        JOIN "Document" d ON CAST(e.source_id AS VARCHAR) = d.id
        WHERE e.workspace_id = :workspace_id
          AND d.is_archived = false
          AND (CAST(:source_type AS VARCHAR) IS NULL OR e.source_type = :source_type)
          AND (1 - (e.embedding <=> CAST(:query_vector AS vector))) >= :threshold
        ORDER BY similarity DESC
        LIMIT :limit
    """)

    try:
        res = await db.execute(
            query_sql,
            {
                "workspace_id": ws_uuid,
                "query_vector": str(query_vector),
                "threshold": similarity_threshold,
                "source_type": source_type,
                "limit": limit,
            }
        )
        
        results = []
        for row in res.fetchall():
            results.append({
                "document_id": str(row[0]),
                "chunk_index": row[1],
                "chunk_text": row[2],
                "section_title": row[3].get("section_title") if row[3] else None,
                "document_title": row[4],
                "similarity": float(row[5]),
            })
        return results
    except Exception as e:
        print(f"[Retriever] Error performing semantic search: {e}")
        return []
