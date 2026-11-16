#!/bin/bash
set -e

BACKEND_URL="${BACKEND_URL:-http://backend:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://frontend:8080}"

echo "========================================================================"
echo "          GENESIS ENGINE CONTAINERIZED AUTOMATED TEST RUNNER            "
echo "========================================================================"
echo "Backend Target:  $BACKEND_URL"
echo "Frontend Target: $FRONTEND_URL"

# 1. Wait for Backend Readiness
echo "--> Waiting for backend readiness at $BACKEND_URL/health..."
for i in {1..30}; do
  if curl -sf "$BACKEND_URL/health" >/dev/null 2>&1; then
    echo "--> Backend is healthy and responding!"
    break
  fi
  sleep 1
done

# 2. Wait for Frontend Readiness
echo "--> Waiting for frontend readiness at $FRONTEND_URL/..."
for i in {1..30}; do
  if curl -sf "$FRONTEND_URL/" >/dev/null 2>&1; then
    echo "--> Frontend is responding!"
    break
  fi
  sleep 1
done

# 3. Run Backend Pytest Suite
echo "========================================================================"
echo "                   STEP 1: BACKEND PYTEST SUITE                         "
echo "========================================================================"
cd /app/backend
pytest tests -v --tb=short

# 4. Run Live Engine Simulation Verification (365 Ticks)
echo "========================================================================"
echo "            STEP 2: LIVE ENGINE DETERMINISTIC VERIFICATION              "
echo "========================================================================"
cd /app
python3 scripts/verify_live_engine_365.py

# 5. Run Playwright E2E Suite
echo "========================================================================"
echo "                  STEP 3: PLAYWRIGHT E2E SUITE                          "
echo "========================================================================"
cd /app
export PLAYWRIGHT_BASE_URL="$FRONTEND_URL"
npx playwright test frontend/e2e/blanks/find-blanks.spec.ts frontend/e2e/causal_coupling.spec.ts --reporter=list

echo "========================================================================"
echo "      ALL CONTAINERIZED TEST SUITES COMPLETED AND VERIFIED 100%!        "
echo "========================================================================"
