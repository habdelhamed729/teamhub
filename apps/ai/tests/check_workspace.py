import asyncio
from sqlalchemy import text
from app.database import async_session

async def check():
    async with async_session() as session:
        # Check embeddings
        print("--- Embeddings for document ---")
        emb_sql = text("SELECT DISTINCT workspace_id, source_id, source_type FROM ai.embeddings")
        res = await session.execute(emb_sql)
        for row in res.fetchall():
            print(f"Workspace ID: {row[0]}, Source ID: {row[1]}, Source Type: {row[2]}")
            
        print("\n--- Document record in public.Document ---")
        doc_sql = text('SELECT id, workspace_id, title, is_archived FROM "Document" WHERE id = :doc_id')
        res_doc = await session.execute(doc_sql, {"doc_id": "e2d06f5c-21c4-40a1-8a63-528dd8bcb7ab"})
        row_doc = res_doc.fetchone()
        if row_doc:
            print(f"Doc ID: {row_doc[0]}, Workspace ID: {row_doc[1]}, Title: {row_doc[2]}, Archived: {row_doc[3]}")
        else:
            print("Document not found in 'public.Document'")

if __name__ == "__main__":
    asyncio.run(check())
