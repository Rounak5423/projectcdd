#!/bin/bash
# ==============================================================================
# GENESIS Artificial Civilisation Engine - Unified Launcher
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$DIR/genesis-engine/backend"
FRONTEND_DIR="$DIR/genesis-engine/frontend"

echo "=================================================================="
echo "  GENESIS ENGINE: The Artificial Civilisation Engine"
echo "  Starting Simulation Server & 3D Command Center..."
echo "=================================================================="

# Check if frontend build exists
if [ ! -d "$FRONTEND_DIR/dist" ]; then
    echo "Building React frontend in $FRONTEND_DIR..."
    cd "$FRONTEND_DIR"
    npm install
    npm run build
    cd "$DIR"
fi

# Check if venv exists
if [ ! -d "$BACKEND_DIR/venv" ]; then
    echo "Creating virtual environment in $BACKEND_DIR/venv..."
    python3 -m venv "$BACKEND_DIR/venv"
    "$BACKEND_DIR/venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt"
fi

echo "Running simulation tests..."
cd "$BACKEND_DIR"
./venv/bin/pytest -q

PORT="${PORT:-8000}"

echo "------------------------------------------------------------------"
echo "Simulation Engine Ready!"
echo "Server & WebGL Command Center: http://127.0.0.1:$PORT"
echo "WebSocket Telemetry Stream:    ws://127.0.0.1:$PORT/ws/world/prime"
echo "REST API Docs:                 http://127.0.0.1:$PORT/docs"
echo "------------------------------------------------------------------"
echo "Press Ctrl+C to terminate."

./venv/bin/uvicorn main:app --host 127.0.0.1 --port "$PORT" --reload

