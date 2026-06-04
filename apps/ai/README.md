# TeamHub AI Service

FastAPI service handling document intelligence, semantic search, vector embeddings, and LLM-powered features.

## Getting Started

1. Set up virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\Activate.ps1   # PowerShell
   # or
   .venv\Scripts\activate.bat   # CMD
   ```

2. Install dependencies:
   ```bash
   pip install -e ".[dev]"
   ```

3. Set up environment variables in `.env` (configured for local development).

4. Run the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
