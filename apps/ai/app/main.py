from contextlib import asynccontextmanager
from fastapi import FastAPI
from sentence_transformers import SentenceTransformer

from app.config import settings

# Global embedding model — loaded once at startup
embedding_model: SentenceTransformer | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load heavy resources at startup, clean up on shutdown."""
    global embedding_model
    # Load embedding model into memory (~90MB)
    # This downloads and initializes the sentence transformer model
    embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
    yield
    # Cleanup
    embedding_model = None

app = FastAPI(
    title="TeamHub AI Service",
    version="0.1.0",
    lifespan=lifespan,
)

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "embedding_model": settings.EMBEDDING_MODEL,
        "embedding_loaded": embedding_model is not None,
    }
