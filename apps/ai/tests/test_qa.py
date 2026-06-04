import asyncio
import httpx
from app.config import settings

async def main():
    headers = {
        "X-Service-Token": settings.AI_SERVICE_TOKEN,
        "X-Workspace-Id": "e0f9a1e1-2d85-433a-b9d6-b43a593b6afb",
        "X-User-Id": "00000000-0000-0000-0000-000000000000",
        "Content-Type": "application/json"
    }
    
    doc_id = "e2d06f5c-21c4-40a1-8a63-528dd8bcb7ab"
    payload = {
        "question": "What is cosine similarity?"
    }
    
    async with httpx.AsyncClient() as client:
        # Test QA (RAG)
        url = f"http://localhost:8000/documents/{doc_id}/qa"
        print(f"Testing RAG Q&A at: {url}...")
        print(f"Question: {payload['question']}\n")
        try:
            res = await client.post(url, json=payload, headers=headers, timeout=20.0)
            print(f"Status: {res.status_code}")
            if res.status_code == 200:
                data = res.json()
                print("Answer:")
                print(data["answer"])
                print("\nSources retrieved:")
                for idx, src in enumerate(data.get("sources", [])):
                    print(f"  Source {idx + 1}: Section: '{src['section_title']}', Similarity: {src['similarity']:.4f}")
                    print(f"    Snippet: {src['chunk_text'][:120]}...")
            else:
                print(f"Response: {res.text}\n")
        except Exception as e:
            print(f"Request failed: {e}\n")

if __name__ == "__main__":
    asyncio.run(main())
