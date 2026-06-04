import asyncio
import httpx
from app.config import settings

async def main():
    url = "http://localhost:8000/search/semantic"
    headers = {
        "X-Service-Token": settings.AI_SERVICE_TOKEN,
        "X-Workspace-Id": "e0f9a1e1-2d85-433a-b9d6-b43a593b6afb",
        "X-User-Id": "00000000-0000-0000-0000-000000000000",  # Dummy user id
        "Content-Type": "application/json"
    }
    payload = {
        "query": "What is semantic search?",
        "limit": 5,
        "similarity_threshold": 0.1  # Low threshold for testing
    }
    
    print(f"Sending POST request to {url}...")
    print(f"Payload: {payload}")
    print(f"Headers: {headers}\n")
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers, timeout=10.0)
            print(f"Response Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                results = data.get("results", [])
                print(f"Found {len(results)} results:\n")
                for i, r in enumerate(results):
                    print(f"Result {i+1}:")
                    print(f"  Document Title: {r['document_title']}")
                    print(f"  Document ID:    {r['document_id']}")
                    print(f"  Chunk Index:    {r['chunk_index']}")
                    print(f"  Section Title:  {r['section_title']}")
                    print(f"  Similarity:     {r['similarity']:.4f}")
                    print(f"  Snippet:        {r['chunk_text'][:150]}...")
                    print("-" * 50)
            else:
                print(f"Error details: {response.text}")
        except Exception as e:
            print(f"Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
