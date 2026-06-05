# TeamHub AI Service

An intelligent FastAPI-based microservice managing document intelligence, semantic search, vector embeddings, and LLM-powered features. It integrates with PostgreSQL (via `pgvector`) and utilizes LangChain with Groq models.

---

## 🛠️ Prerequisites

Ensure you have the following installed on your local machine:
- **Python >= 3.11**
- **PostgreSQL** with the `pgvector` extension enabled.

---

## 🚀 Getting Started

Follow these steps to set up and run the service locally:

### 1. Set up Virtual Environment
Create and activate a virtual environment:

```bash
# Clone/navigate to the folder: apps/ai
python -m venv .venv

# Activate on Windows (PowerShell):
.venv\Scripts\Activate.ps1

# Activate on Windows (CMD):
.venv\Scripts\activate.bat

# Activate on macOS/Linux:
source .venv/bin/activate
```

### 2. Install Dependencies
Install the project packages and development tools:

```bash
pip install -e ".[dev]"
```

### 3. Configure Environment Variables
Copy the `.env.example` file to `.env` and fill in your values:

```bash
cp .env.example .env
```

Make sure to configure the correct database connection string, Groq API key, and shared authentication token matching the API Gateway:
- `DATABASE_URL`: Must use the `asyncpg` dialect for asynchronous SQLAlchemy operations (e.g., `postgresql+asyncpg://...`).
- `GROQ_API_KEY`: Obtain an API key from the [Groq Cloud Console](https://console.groq.com/).
- `AI_SERVICE_TOKEN`: A secret string shared between the main API Gateway and the AI service for authentication.

---

## 🗄️ Database Migrations

Database tables and schema updates are managed using Alembic. 

To run existing migrations and apply the schemas (including vector embeddings tables and pgvector extension registration) to your database:

```bash
# Run migrations up to latest
alembic upgrade head

# Create a new migration after model changes:
alembic revision --autogenerate -m "description_of_changes"
```

---

## 💻 Running the Server

Start the FastAPI application in development mode with auto-reload. You can run it either by activating the virtual environment or directly calling the scripts:

### Method A: With active virtual environment (Recommended)
```bash
# Activate your venv first, then run:
uvicorn app.main:app --reload --port 8000
```

### Method B: Directly using virtual environment paths (No activation needed)
```bash
# Windows (PowerShell):
.\.venv\Scripts\uvicorn app.main:app --reload --port 8000

# Windows (CMD):
.venv\Scripts\uvicorn app.main:app --reload --port 8000

# macOS/Linux:
./.venv/bin/uvicorn app.main:app --reload --port 8000
```

Once running, the interactive API documentation is accessible at:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🧪 Testing and Quality Checks

### Running Tests
Execute the test suite using `pytest`:

```bash
pytest
```

### Linting and Formatting
Check code style and format using `ruff`:

```bash
# Check code style issues
ruff check

# Auto-format the code
ruff format
```

---

## 📂 Project Structure

```
apps/ai/
├── alembic/            # Database migration scripts
├── alembic.ini         # Alembic configuration
├── app/
│   ├── api/            # API endpoints & routing (search, streaming summaries, tags, Q&A)
│   ├── core/           # Configuration, security, database sessions, and dependencies
│   ├── models/         # SQLAlchemy database models (Vector Documents & Chunks)
│   ├── schemas/        # Pydantic schemas for request/response validation
│   ├── services/       # Core business logic (LLMs, Embeddings, Parsers, Vector Store)
│   └── main.py         # Application entrypoint
├── tests/              # Test suite (integration and unit tests)
├── pyproject.toml      # Project packaging & dependencies
└── README.md           # This file
```
