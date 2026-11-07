#!/bin/bash
# ==============================================================================
# GENESIS Engine v2.0 Launcher: Master Simulation & Glassmorphic Command Center
# ==============================================================================
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PYTHON_BIN="$DIR/../genesis-engine/backend/venv/bin/python3"

if [ ! -f "$PYTHON_BIN" ]; then
    PYTHON_BIN="python3"
fi

echo "=================================================================="
echo "  Launching GENESIS Engine v2.0 Master Server..."
echo "  Server & Command Dashboard: http://127.0.0.1:8000"
echo "  Interactive API Docs:        http://127.0.0.1:8000/docs"
echo "=================================================================="

exec "$PYTHON_BIN" "$DIR/genesis_engine_v2.py"
