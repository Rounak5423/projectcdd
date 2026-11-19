# syntax=docker/dockerfile:1
# ==============================================================================
# GENESIS Civilisation Engine — Backend Multi-Stage Dockerfile
# Base: Python 3.12-slim
# Architecture: Single-process SQLite WAL writer + Discrete Simulation Core
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build virtual environment and wheels
# ------------------------------------------------------------------------------
FROM python:3.12-slim AS builder

WORKDIR /build

# Install minimal build tools for building potential binary wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install pinned production dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip "setuptools>=78.1.1" wheel && \
    pip install --no-cache-dir -r requirements.txt

# ------------------------------------------------------------------------------
# Stage 2: Minimal runtime image
# ------------------------------------------------------------------------------
FROM python:3.12-slim AS runner

# Security hardening: Update OS packages to remediate base CVEs, create non-root user
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/* && \
    groupadd -g 10001 genesis && \
    useradd -u 10001 -g genesis -s /bin/bash -m -d /home/genesis genesis

# Set environment variables
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH="/app" \
    PORT=8000 \
    HOST=0.0.0.0

WORKDIR /app

# Copy virtual environment from builder stage
COPY --from=builder /opt/venv /opt/venv

# Copy application source code (filtered by .dockerignore)
COPY . /app/

# Copy entrypoint script and ensure execution permissions
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create persistent storage directories with appropriate ownership
RUN mkdir -p /app/db /app/ml/models /app/ml/runs /app/ml/data /app/uploads && \
    chown -R genesis:genesis /app /home/genesis /opt/venv

# Run as non-privileged user
USER genesis

# Expose backend port (internal container network)
EXPOSE 8000

# Health check against real FastAPI readiness/health endpoint
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health').read()" || exit 1

# Graceful shutdown: SIGTERM allows FastAPI lifespan to flush SQLite WAL and scheduler
STOPSIGNAL SIGTERM

ENTRYPOINT ["docker-entrypoint.sh"]

# NOTE: SQLite WAL mode and the deterministic tick loop mandate a single writer process.
# Running with multiple uvicorn workers or multi-replica clustering without distributed
# consensus would corrupt SQLite WAL locks. Keep workers=1.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
