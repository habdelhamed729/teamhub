import asyncio
from sqlalchemy import text
from app.database import async_session
import app.main as main_app
from app.config import settings

async def check():
    if main_app.embedding_model is None:
        from sentence_transformers import SentenceTransformer
        main_app.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        
    query_vector = main_app.embedding_model.encode("What is semantic search?").tolist()
    
    async with async_session() as session:
        # Fetch embeddings and calculate similarity
        sql = text("""
            SELECT 
                e.source_id, 
                e.chunk_index, 
                d.title,
                e.embedding <=> CAST(:query_vector AS vector) AS distance,
                1 - (e.embedding <=> CAST(:query_vector AS vector)) AS similarity
            FROM ai.embeddings e
            JOIN "Document" d ON CAST(e.source_id AS VARCHAR) = d.id
        """)
        res = await session.execute(sql, {"query_vector": str(query_vector)})
        rows = res.fetchall()
        print(f"Found {len(rows)} matching rows in JOIN query:")
        for r in rows:
            print(f"Doc ID: {r[0]}, Index: {r[1]}, Title: {r[2]}, Distance: {r[3]}, Similarity: {r[4]}")

if __name__ == "__main__":
    asyncio.run(check())
