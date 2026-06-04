from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.utils.auth import verify_service_token
from app.embeddings.retriever import semantic_search

router = APIRouter(prefix="/search", tags=["search"])

class SemanticSearchRequest(BaseModel):
    query: str = Field(..., description="The query string to search for")
    limit: int = Field(10, ge=1, le=50, description="Maximum number of results to return")
    similarity_threshold: float = Field(0.35, ge=0.0, le=1.0, description="Minimum cosine similarity score")

class SearchResultItem(BaseModel):
    document_id: str
    chunk_index: int
    chunk_text: str
    section_title: str | None
    document_title: str
    similarity: float

class SemanticSearchResponse(BaseModel):
    results: list[SearchResultItem]

@router.post(
    "/semantic",
    response_model=SemanticSearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Perform workspace-isolated semantic search on documents",
)
async def search_semantic(
    request: SemanticSearchRequest,
    context: dict = Depends(verify_service_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Perform a semantic search across all non-archived documents in the active workspace.
    Requires header service authentication and workspace validation.
    """
    workspace_id = context["workspace_id"]
    results = await semantic_search(
        query=request.query,
        workspace_id=workspace_id,
        db=db,
        source_type="document",  # Limit search to document type for step 5
        limit=request.limit,
        similarity_threshold=request.similarity_threshold,
    )
    return {"results": results}
