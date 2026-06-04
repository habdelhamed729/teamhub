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
        "length": "medium"
    }
    
    async with httpx.AsyncClient() as client:
        # Test Summarize
        url = f"http://localhost:8000/documents/{doc_id}/summarize"
        print(f"Testing Summarization at: {url}...")
        try:
            res = await client.post(url, json=payload, headers=headers, timeout=15.0)
            print(f"Status: {res.status_code}")
            print(f"Response: {res.text}\n")
        except Exception as e:
            print(f"Request failed: {e}\n")

if __name__ == "__main__":
    asyncio.run(main())
