"""
Unified World State, Commands, Action Logs, and AI Risk Overlays Endpoints
Version: 2.0.0
"""

from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, Depends, Query, status

from auth.security import get_current_user_optional
from engine.world.state import (
    CommandBatchRequest,
    CommandBatchResponse,
    WorldStateSnapshot,
    ActionLogEntry,
    WorldCommand
)
from engine.world.commands import global_command_manager
from engine.world.simulation import get_unified_simulation
from engine.world.features import UnifiedFeatureExtractor

router = APIRouter(tags=["Unified World & Commands"])


def _resolve_world_id(world_id: str) -> str:
    if world_id in ["civ-aurora-01", "civ-default", "prime", "default"]:
        return "aurora-prime"
    return world_id


@router.post("/worlds/{id}/commands", response_model=CommandBatchResponse)
async def execute_world_commands(
    id: str,
    req: CommandBatchRequest,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """
    Executes a batch of state-mutating commands (build, bulldoze, zone, road, policy, budget).
    Provides atomic affordability check, RBAC, idempotency, and action logging.
    """
    canon_id = _resolve_world_id(id)
    sim = get_unified_simulation(canon_id)

    user_id = user["id"] if user else "anonymous_player"
    user_role = user.get("role", "player") if user else "player"

    results, new_version = global_command_manager.execute_command_batch(
        world_id=canon_id,
        commands=req.commands,
        user_id=user_id,
        user_role=user_role,
        current_version=sim.version
    )

    sim.version = new_version
    # Reload entities mutated in SQLite
    sim.load_world_from_db()
    snapshot = sim.get_snapshot()

    has_rejection = any(r.status == "rejected" for r in results)
    batch_status = "partial_rejection" if has_rejection and any(r.status == "accepted" for r in results) else "failed" if all(r.status == "rejected" for r in results) else "success"

    return CommandBatchResponse(
        world_id=canon_id,
        batch_status=batch_status,
        results=results,
        new_version=new_version,
        latest_metrics=snapshot.metrics
    )


@router.post("/worlds/{id}/undo")
async def undo_world_command(
    id: str,
    user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    """Undoes the last reversible user action in the world."""
    canon_id = _resolve_world_id(id)
    user_id = user["id"] if user else None
    res = global_command_manager.undo_last_command(canon_id, user_id=user_id)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message", "Cannot undo"))

    sim = get_unified_simulation(canon_id)
    sim.load_world_from_db()
    return res


@router.get("/worlds/{id}/state", response_model=WorldStateSnapshot)
async def get_unified_world_state(id: str):
    """Returns authoritative snapshot of the city with all entities, networks, and metrics."""
    canon_id = _resolve_world_id(id)
    sim = get_unified_simulation(canon_id)
    return sim.get_snapshot()


@router.get("/worlds/{id}/action-log", response_model=List[ActionLogEntry])
async def get_world_action_log(
    id: str,
    limit: int = Query(default=50, ge=1, le=200)
):
    """Returns chronological audit log of all user commands executed in the world."""
    canon_id = _resolve_world_id(id)
    return global_command_manager.get_action_log(canon_id, limit=limit)


@router.get("/worlds/{id}/risk-overlays")
async def get_world_risk_overlays(id: str):
    """Returns live spatial AI risk heatmaps (blackout, accident, disease, unrest)."""
    canon_id = _resolve_world_id(id)
    sim = get_unified_simulation(canon_id)
    return UnifiedFeatureExtractor.compute_risk_overlays(sim)


@router.post("/worlds/{id}/counterfactual")
async def run_world_counterfactual(
    id: str,
    req: CommandBatchRequest,
    horizon_ticks: int = Query(default=10, ge=1, le=50)
):
    """Simulates forward impact of proposed commands in an in-memory branch copy."""
    canon_id = _resolve_world_id(id)
    return UnifiedFeatureExtractor.simulate_counterfactual(
        world_id=canon_id,
        proposed_commands=req.commands,
        horizon_ticks=horizon_ticks
    )

