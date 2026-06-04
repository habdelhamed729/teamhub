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
    
    async with httpx.AsyncClient() as client:
        # Test Action Item Extraction
        url = f"http://localhost:8000/documents/{doc_id}/extract-actions"
        print(f"Testing Action Item Extraction at: {url}...\n")
        try:
            res = await client.post(url, headers=headers, timeout=20.0)
            print(f"Status: {res.status_code}")
            if res.status_code == 200:
                data = res.json()
                items = data.get("items", [])
                print(f"Extracted {len(items)} action items:\n")
                for idx, item in enumerate(items):
                    print(f"Item {idx + 1}:")
                    print(f"  Action:   {item['action']}")
                    print(f"  Assignee: {item['assignee']}")
                    print(f"  Priority: {item['priority']}")
                    print(f"  Due Date: {item['due_date']}")
                    print("-" * 40)
            else:
                print(f"Response: {res.text}\n")
        except Exception as e:
            print(f"Request failed: {e}\n")

if __name__ == "__main__":
    asyncio.run(main())
