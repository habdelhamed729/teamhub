import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.utils.auth import verify_service_token
from app.embeddings.parsers import parse_tiptap_document
from app.chains.tagging import generate_tags, generate_title
from app.chains.summarize import summarize_document
from app.chains.qa import document_qa
from app.chains.extraction import extract_action_items

router = APIRouter(prefix="/documents", tags=["documents"])

class TagsResponse(BaseModel):
    tags: list[str]

class TitleResponse(BaseModel):
    title: str

class SummarizeRequest(BaseModel):
    length: str = "medium"  # short, medium, long

class SummarizeResponse(BaseModel):
    summary: str

class ActionItemResponseItem(BaseModel):
    action: str
    assignee: str | None = None
    priority: str
    due_date: str | None = None

class ActionItemsResponse(BaseModel):
    items: list[ActionItemResponseItem]

class QARequest(BaseModel):
    question: str

class QASourceItem(BaseModel):
    chunk_text: str
    similarity: float
    section_title: str | None

class QAResponse(BaseModel):
    answer: str
    sources: list[QASourceItem]
    model: str

async def _get_document_text(document_id: str, workspace_id: str, db: AsyncSession) -> str:
    """Helper to fetch document TipTap content, verify workspace, and parse to plain text."""
    try:
        doc_uuid = uuid.UUID(str(document_id))
        ws_uuid = uuid.UUID(str(workspace_id))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid document or workspace UUID format"
        )
        
    doc_stmt = text(
        'SELECT content FROM "Document" '
        'WHERE id = :doc_id AND workspace_id = :workspace_id AND is_archived = false'
    )
    res = await db.execute(doc_stmt, {"doc_id": str(doc_uuid), "workspace_id": str(ws_uuid)})
    row = res.fetchone()
    
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found in this workspace"
        )
        
    content_json = row[0]
    parsed_text = parse_tiptap_document(content_json).strip()
    
    if not parsed_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document content is empty"
        )
        
    return parsed_text

@router.post(
    "/{document_id}/generate-tags",
    response_model=TagsResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate suggested tags for a document"
)
async def generate_document_tags(
    document_id: str,
    context: dict = Depends(verify_service_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch the document content, verify workspace ownership, and generate 3-7 tags using Groq LLM.
    """
    workspace_id = context["workspace_id"]
    document_text = await _get_document_text(document_id, workspace_id, db)
    
    try:
        tags = await generate_tags(document_text)
        return {"tags": tags}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating tags: {str(e)}"
        )

@router.post(
    "/{document_id}/generate-title",
    response_model=TitleResponse,
    status_code=status.HTTP_200_OK,
    summary="Suggest a title for a document"
)
async def generate_document_title(
    document_id: str,
    context: dict = Depends(verify_service_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch the document content, verify workspace ownership, and suggest a title using Groq LLM.
    """
    workspace_id = context["workspace_id"]
    document_text = await _get_document_text(document_id, workspace_id, db)
    
    try:
        title = await generate_title(document_text)
        return {"title": title}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating title: {str(e)}"
        )

@router.post(
    "/{document_id}/summarize",
    response_model=SummarizeResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate summary for a document"
)
async def generate_document_summary(
    document_id: str,
    request: SummarizeRequest,
    context: dict = Depends(verify_service_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch the document content, verify workspace ownership, and generate a summary using Groq LLM.
    Supports 'short', 'medium', and 'long' summary lengths.
    """
    workspace_id = context["workspace_id"]
    document_text = await _get_document_text(document_id, workspace_id, db)
    
    try:
        summary = await summarize_document(document_text, max_length=request.length)
        return {"summary": summary}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating summary: {str(e)}"
        )

@router.post(
    "/{document_id}/qa",
    response_model=QAResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask a question about a specific document (RAG)"
)
async def generate_document_qa(
    document_id: str,
    request: QARequest,
    context: dict = Depends(verify_service_token),
    db: AsyncSession = Depends(get_db)
):
    """
    RAG pipeline:
    1. Embed query
    2. Fetch top 5 vector matches from this document only
    3. Construct prompt context
    4. Generate grounded LLM response via Groq
    """
    workspace_id = context["workspace_id"]
    
    try:
        qa_result = await document_qa(
            question=request.question,
            document_id=document_id,
            workspace_id=workspace_id,
            db=db
        )
        return qa_result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing document QA: {str(e)}"
        )

@router.post(
    "/{document_id}/extract-actions",
    response_model=ActionItemsResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract structured action items from a document"
)
async def extract_document_action_items(
    document_id: str,
    context: dict = Depends(verify_service_token),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch the document content, verify workspace ownership, and extract structured action items / tasks using Groq LLM.
    """
    workspace_id = context["workspace_id"]
    document_text = await _get_document_text(document_id, workspace_id, db)
    
    try:
        items = await extract_action_items(document_text)
        return {"items": items}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error extracting action items: {str(e)}"
        )


