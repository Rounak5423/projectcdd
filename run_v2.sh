#!/bin/bash
# ==============================================================================
# GENESIS Engine v2.0 Launcher: Master Simulation & Glassmorphic Command Center
# ==============================================================================
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
exec bash "$DIR/genesis_v2_simulation/run_simulation.sh"
