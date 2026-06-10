FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy python project configuration
COPY pyproject.toml ./

# Install CPU-only PyTorch to avoid downloading massive CUDA binaries (~5GB+)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install python packages
RUN pip install --no-cache-dir .

# Copy application files
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./

EXPOSE 8000
