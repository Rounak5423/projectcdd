# syntax=docker/dockerfile:1
# ==============================================================================
# GENESIS Civilisation Engine — ML & Training Container (Profile: ml)
# Includes full scientific stack: NumPy, SciPy, Pandas, Scikit-Learn, LightGBM, XGBoost
# CPU-based by default with optional NVIDIA GPU acceleration override
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build virtual environment with ML packages
# ------------------------------------------------------------------------------
FROM python:3.12-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt requirements-ml.txt ./
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt -r requirements-ml.txt

# ------------------------------------------------------------------------------
# Stage 2: Hardened runtime with OpenMP support
# ------------------------------------------------------------------------------
FROM python:3.12-slim AS runner

# Install OpenMP runtime library needed for LightGBM and XGBoost
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Security: Non-root user
RUN groupadd -g 10001 genesis && \
    useradd -u 10001 -g genesis -s /bin/bash -m -d /home/genesis genesis

ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH="/app" \
    ML_ENABLED=true

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY . /app/

RUN mkdir -p /app/db /app/ml/models /app/ml/runs /app/ml/data /app/datasets && \
    chown -R genesis:genesis /app /home/genesis /opt/venv

USER genesis

VOLUME ["/app/db", "/app/ml/models", "/app/ml/runs", "/app/ml/data", "/app/datasets"]

# Default training command
CMD ["python", "ml/train_simulation_models.py"]
