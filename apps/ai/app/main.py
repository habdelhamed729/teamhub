import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from sentence_transformers import SentenceTransformer

from app.config import settings
from app.workers import job_worker
from app.routers import search, documents

# Global embedding model — loaded once at startup
embedding_model: SentenceTransformer | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load heavy resources at startup, clean up on shutdown."""
    global embedding_model
    # Load embedding model into memory (~90MB)
    embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
    
    # Start background job worker
    worker_task = asyncio.create_task(job_worker.job_worker_loop())
    
    yield
    
    # Cleanup
    embedding_model = None
    # Stop background worker cleanly
    job_worker.keep_running = False
    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="TeamHub AI Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(search.router)
app.include_router(documents.router)

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "embedding_model": settings.EMBEDDING_MODEL,
        "embedding_loaded": embedding_model is not None,
    }

