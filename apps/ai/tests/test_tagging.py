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
        # 1. Test Tag Generation
        tag_url = f"http://localhost:8000/documents/{doc_id}/generate-tags"
        print(f"Testing Tag Generation at: {tag_url}...")
        try:
            res_tags = await client.post(tag_url, headers=headers, timeout=15.0)
            print(f"Status: {res_tags.status_code}")
            print(f"Response: {res_tags.text}\n")
        except Exception as e:
            print(f"Request failed: {e}\n")
            
        # 2. Test Title Generation
        title_url = f"http://localhost:8000/documents/{doc_id}/generate-title"
        print(f"Testing Title Suggestion at: {title_url}...")
        try:
            res_title = await client.post(title_url, headers=headers, timeout=15.0)
            print(f"Status: {res_title.status_code}")
            print(f"Response: {res_title.text}\n")
        except Exception as e:
            print(f"Request failed: {e}\n")

if __name__ == "__main__":
    asyncio.run(main())
