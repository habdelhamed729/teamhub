import hmac
import hashlib
import base64
import json
import time
import uuid
from fastapi import APIRouter, Query, HTTPException, status
from sse_starlette.sse import EventSourceResponse
from sqlalchemy import text
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

from app.config import settings
from app.database import async_session
from app.embeddings.parsers import parse_tiptap_document
from app.prompts.loader import load_prompt
from app.utils.streaming import stream_langchain_chain
import app.main as main_app

router = APIRouter(prefix="/stream", tags=["streaming"])

def verify_stream_token(token: str, secret: str) -> dict | None:
    """Verify HMAC signed short-lived stream token."""
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        
        payload_b64, signature = parts[0], parts[1]
        
        # Calculate expected signature
        expected_sig = hmac.new(
            secret.encode("utf-8"),
            payload_b64.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(expected_sig, signature):
            return None
            
        # Add padding back if necessary
        padding = len(payload_b64) % 4
        if padding:
            payload_b64 += "=" * (4 - padding)
            
        # Decode payload
        payload_bytes = base64.urlsafe_b64decode(payload_b64.encode("utf-8"))
        payload = json.loads(payload_bytes.decode("utf-8"))
        
        # Check expiration (e.g. 5 minutes)
        if payload.get("exp", 0) < time.time():
            return None
            
        return payload
    except Exception as e:
        print(f"[StreamAuth] Token verification failed: {e}")
        return None

async def generate_stream(payload: dict):
    """Generator that runs the actual LLM Q&A or summarization pipeline and streams chunks."""
    action = payload.get("action")
    document_id = payload.get("document_id")
    workspace_id = payload.get("workspace_id")
    args = payload.get("payload", {})

    try:
        doc_uuid = uuid.UUID(str(document_id))
        ws_uuid = uuid.UUID(str(workspace_id))
    except ValueError:
        yield {
            "event": "error",
            "data": json.dumps({"message": "Invalid UUID format in token."})
        }
        return

    # Create a new DB session since SSE runs independently of HTTP request lifecycle
    async with async_session() as db:
        if action == "qa":
            question = args.get("question")
            if not question:
                yield {
                    "event": "error",
                    "data": json.dumps({"message": "Question argument missing."})
                }
                return

            # RAG logic: Embed question
            if main_app.embedding_model is None:
                from sentence_transformers import SentenceTransformer
                main_app.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
            query_vector = main_app.embedding_model.encode(question).tolist()

            # Retrieve top-5 relevant chunks
            query_sql = text("""
                SELECT chunk_text, metadata,
                       1 - (embedding <=> CAST(:query_vector AS vector)) AS similarity
                FROM ai.embeddings
                WHERE source_id = :document_id
                  AND workspace_id = :workspace_id
                  AND source_type = 'document'
                ORDER BY similarity DESC
                LIMIT 5
            """)
            res = await db.execute(
                query_sql,
                {
                    "document_id": doc_uuid,
                    "workspace_id": ws_uuid,
                    "query_vector": str(query_vector),
                }
            )
            rows = res.fetchall()

            if not rows:
                yield {
                    "event": "token",
                    "data": json.dumps({"content": "This document has not been processed for Q&A yet (no embeddings found)."})
                }
                yield {
                    "event": "done",
                    "data": json.dumps({"status": "completed"})
                }
                return

            # Format context and sources
            context_chunks = []
            sources = []
            for row in rows:
                chunk_text = row[0]
                meta = row[1]
                similarity = float(row[2])
                section_title = meta.get("section_title") if meta else None
                source_label = f"Section: {section_title}" if section_title else "Document Content"
                
                context_chunks.append(f"[{source_label}]\n{chunk_text}")
                sources.append({
                    "chunk_text": chunk_text,
                    "similarity": similarity,
                    "section_title": section_title,
                })
            
            context_str = "\n\n---\n\n".join(context_chunks)

            # Build QA chain
            system_prompt = load_prompt("qa_v1.txt")
            prompt = ChatPromptTemplate.from_messages([
                ("system", system_prompt),
                ("human", "Context from document:\n{context}\n\nQuestion: {question}")
            ])
            llm = ChatGroq(
                api_key=settings.GROQ_API_KEY,
                model_name=settings.DEFAULT_LLM_MODEL,
                temperature=0.0,
            )
            chain = prompt | llm

            # Stream LLM response
            async for chunk in stream_langchain_chain(
                chain=chain,
                input_data={"context": context_str, "question": question},
                sources=sources
            ):
                yield chunk

        elif action == "summarize":
            length = args.get("length", "medium")
            
            # Fetch document text
            doc_stmt = text(
                'SELECT content FROM "Document" '
                'WHERE id = :doc_id AND workspace_id = :workspace_id AND is_archived = false'
            )
            res = await db.execute(doc_stmt, {"doc_id": str(doc_uuid), "workspace_id": str(ws_uuid)})
            row = res.fetchone()
            if not row:
                yield {
                    "event": "error",
                    "data": json.dumps({"message": "Document not found in this workspace."})
                }
                return
            
            content_json = row[0]
            parsed_text = parse_tiptap_document(content_json).strip()
            if not parsed_text:
                yield {
                    "event": "error",
                    "data": json.dumps({"message": "Document content is empty."})
                }
                return

            # Build summarization chain
            length_guidelines = {
                "short": "Generate a concise summary of 2-3 sentences max.",
                "medium": "Generate a single paragraph summarizing the core theme, followed by 3-5 bullet points of key takeaways.",
                "long": "Generate a detailed, section-by-section summary. Break it down using markdown subheadings and clear bullet points for key details."
            }
            guideline = length_guidelines.get(length.lower(), length_guidelines["medium"])
            system_prompt = load_prompt("summarize_v1.txt").format(guideline=guideline)

            prompt = ChatPromptTemplate.from_messages([
                ("system", system_prompt),
                ("human", "Summarize the following content:\n\n{text}")
            ])
            llm = ChatGroq(
                api_key=settings.GROQ_API_KEY,
                model_name=settings.DEFAULT_LLM_MODEL,
                temperature=0.3,
            )
            chain = prompt | llm

            # Stream LLM response
            async for chunk in stream_langchain_chain(
                chain=chain,
                input_data={"text": parsed_text}
            ):
                yield chunk
        else:
            yield {
                "event": "error",
                "data": json.dumps({"message": f"Unsupported stream action: {action}"})
            }

@router.get(
    "/{stream_id}",
    summary="Direct SSE endpoint for token-by-token streaming of Q&A or summarization responses"
)
async def stream_response(
    stream_id: str,
    token: str = Query(..., description="Short-lived signed token containing workspace, document, and action payload")
):
    """
    Establish SSE connection for real-time text generation.
    Verifies token validity and permission using shared secret.
    """
    payload = verify_stream_token(token, settings.AI_SERVICE_TOKEN)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid, expired, or tampered stream token"
        )
        
    return EventSourceResponse(generate_stream(payload))
