import io
import httpx
from pypdf import PdfReader
from docx import Document as DocxDocument

async def extract_text_from_attachment(url: str, file_type: str) -> str:
    """Download attachment file from Cloudinary and extract text."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            if response.status_code != 200:
                print(f"[Attachment] Failed to download {url}: Status code {response.status_code}")
                return ""
            
            content = response.content
            
            # Handle PDFs
            if "application/pdf" in file_type or url.lower().endswith(".pdf"):
                try:
                    pdf_file = io.BytesIO(content)
                    reader = PdfReader(pdf_file)
                    text = ""
                    for page in reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
                    return text.strip()
                except Exception as e:
                    print(f"[Attachment] Error parsing PDF {url}: {e}")
                    return ""
                    
            # Handle DOCX Word documents
            elif "wordprocessingml" in file_type or url.lower().endswith(".docx"):
                try:
                    docx_file = io.BytesIO(content)
                    doc = DocxDocument(docx_file)
                    text = "\n".join([p.text for p in doc.paragraphs])
                    return text.strip()
                except Exception as e:
                    print(f"[Attachment] Error parsing DOCX {url}: {e}")
                    return ""
                    
            # Handle plain text / markdown / csv / json
            elif "text/" in file_type or url.lower().endswith((".txt", ".md", ".json", ".csv")):
                try:
                    return content.decode("utf-8", errors="ignore").strip()
                except Exception as e:
                    print(f"[Attachment] Error decoding text {url}: {e}")
                    return ""
                    
            print(f"[Attachment] Unsupported file type {file_type} for URL {url}")
            return ""  # Unsupported or image type (skipping OCR)
    except Exception as e:
        print(f"[Attachment] Network or unexpected error downloading {url}: {e}")
        return ""
