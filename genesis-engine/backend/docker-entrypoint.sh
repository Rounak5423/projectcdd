#!/bin/sh
set -e

# ==============================================================================
# GENESIS Civilisation Engine — Authoritative Backend Entrypoint
# Handles idempotent DB initialization, production invariant checks, and signal trapping
# ==============================================================================

echo "==> [GENESIS Backend] Starting container entrypoint..."

# 1. Ensure required runtime storage directories exist
mkdir -p /app/db /app/ml/models /app/ml/runs /app/ml/data /app/uploads

# 2. In production mode, validate critical configuration invariants
if [ "${ENVIRONMENT:-development}" = "production" ]; then
    echo "==> [GENESIS Backend] Validating production security invariants..."
    python -c "from config import settings; settings.validate_production_invariants()"
    echo "==> [GENESIS Backend] Production configuration validated successfully."
fi

# 3. Idempotently initialize SQLite database schema & seed tables if not present
echo "==> [GENESIS Backend] Verifying database schema & idempotent seeding..."
python -c "
import sys
sys.path.insert(0, '/app')
from db.database import init_db
init_db()
print('==> [GENESIS Backend] Database ready.')
"

# 4. Execute the main container process (exec replaces PID 1 so SIGTERM reaches uvicorn cleanly)
echo "==> [GENESIS Backend] Launching service: $@"
exec "$@"
