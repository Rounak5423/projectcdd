import asyncio
from typing import Dict, Optional, Any
from fastapi import APIRouter, HTTPException
from db.database import get_db_connection
from engine.models_v1 import (
    SimulationStartRequest, SimulationAdvanceRequest, SimulationStatusResponse
)
from engine.simulation_v1 import advance_world_simulation
from engine.scheduler import simulation_scheduler, SPEED_INTERVALS

router = APIRouter(tags=["Simulation Controls"])


async def _execute_tick_async(world_id: str, ticks: int) -> Dict[str, Any]:
    """Runs synchronous CPU/DB simulation tick inside default thread pool executor (Task 5)."""
    return await asyncio.to_thread(advance_world_simulation, world_id, ticks)


# Register tick executor with scheduler
simulation_scheduler.set_default_tick_handler(_execute_tick_async)


@router.post("/worlds/{id}/simulation/start", response_model=SimulationStatusResponse)
async def start_simulation(id: str, req: SimulationStartRequest):
    conn = get_db_connection()
    world = conn.execute("SELECT * FROM worlds WHERE id = ?", (id,)).fetchone()
    if not world:
        conn.close()
        raise HTTPException(status_code=404, detail=f"World '{id}' not found")

    with conn:
        conn.execute("UPDATE worlds SET simulation_status = 'running', simulation_speed = ? WHERE id = ?", (req.speed, id))
    conn.close()

    # Controlled start through centralized fixed-timestep scheduler (Task 2)
    simulation_scheduler.start_world(id, speed=req.speed)

    return await get_simulation_status(id)


@router.post("/worlds/{id}/simulation/pause", response_model=SimulationStatusResponse)
async def pause_simulation(id: str):
    conn = get_db_connection()
    world = conn.execute("SELECT * FROM worlds WHERE id = ?", (id,)).fetchone()
    if not world:
        conn.close()
        raise HTTPException(status_code=404, detail=f"World '{id}' not found")

    with conn:
        conn.execute("UPDATE worlds SET simulation_status = 'paused' WHERE id = ?", (id,))
    conn.close()

    # Pause through scheduler
    simulation_scheduler.pause_world(id)

    return await get_simulation_status(id)


@router.post("/worlds/{id}/simulation/resume", response_model=SimulationStatusResponse)
async def resume_simulation(id: str):
    conn = get_db_connection()
    world = conn.execute("SELECT * FROM worlds WHERE id = ?", (id,)).fetchone()
    if not world:
        conn.close()
        raise HTTPException(status_code=404, detail=f"World '{id}' not found")

    speed = world["simulation_speed"] or "1x"
    with conn:
        conn.execute("UPDATE worlds SET simulation_status = 'running' WHERE id = ?", (id,))
    conn.close()

    # Resume through scheduler
    simulation_scheduler.start_world(id, speed=speed)

    return await get_simulation_status(id)


def _resolve_world_id(id: str) -> str:
    conn = get_db_connection()
    row = conn.execute("SELECT id FROM worlds WHERE id = ?", (id,)).fetchone()
    conn.close()
    if row:
        return id
    if id in ["civ-aurora-01", "civ-default", "prime", "default"]:
        return "aurora-prime"
    return id


@router.post("/worlds/{id}/simulation/advance", response_model=SimulationStatusResponse)
@router.post("/worlds/{id}/simulate", response_model=SimulationStatusResponse)
@router.post("/civilizations/{id}/simulate", response_model=SimulationStatusResponse, include_in_schema=False)
async def advance_simulation(id: str, req: SimulationAdvanceRequest):
    target_id = _resolve_world_id(id)
    try:
        # Thread-safe, lock-guaranteed advance avoiding concurrent race conditions (Task 2 & 5)
        res = await simulation_scheduler.advance_world(target_id, ticks=req.ticks)
        try:
            from realtime import rt_ws_manager, delta_engine, EventPriority
            ev_type, delta_payload, base_v, new_v = delta_engine.compute_state_delta(target_id, res)
            await rt_ws_manager.broadcast(target_id, {
                "type": "tick_update",
                "event_type": ev_type,
                "delta": delta_payload,
                **res
            }, priority=EventPriority.NORMAL)
        except Exception:
            pass
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return await get_simulation_status(target_id)


@router.get("/worlds/{id}/simulation/status", response_model=SimulationStatusResponse)
async def get_simulation_status(id: str):
    target_id = _resolve_world_id(id)
    conn = get_db_connection()
    world = conn.execute("SELECT * FROM worlds WHERE id = ?", (target_id,)).fetchone()
    conn.close()

    if not world:
        raise HTTPException(status_code=404, detail=f"World '{id}' not found")

    status_str = world["simulation_status"]
    speed_str = world["simulation_speed"]
    tick = world["tick"]
    year = world["year"]
    day = world["day"]
    formatted = f"Year {year}, Day {day}"

    # Sync runner status if active
    runner = simulation_scheduler.get_runner(id)
    if runner and runner.status in ("running", "paused"):
        status_str = runner.status

    return SimulationStatusResponse(
        world_id=id,
        simulation_status=status_str,
        simulation_speed=speed_str,
        current_tick=tick,
        year=year,
        day=day,
        formatted_time=formatted
    )


# ==============================================================================
# ADDITIVE v2 AUTHORITATIVE SIMULATION & PERSISTENCE ROUTES
# ==============================================================================

from pydantic import BaseModel, Field

class SimulationSpeedRequest(BaseModel):
    speed: str = Field(default="1x", pattern="^(0.5x|1x|2x|4x|5x|10x)$")

class SaveSlotRequest(BaseModel):
    slot_name: str = "manual_save"
    slot_type: str = "manual"

class ScenarioBranchRequest(BaseModel):
    branch_name: str
    scenario_overrides: Optional[Dict[str, Any]] = None

class ScenarioCompareRequest(BaseModel):
    branch_id: str
    branch_metrics: Dict[str, Any]


@router.post("/worlds/{id}/simulation/speed", response_model=SimulationStatusResponse)
async def set_simulation_speed(id: str, req: SimulationSpeedRequest):
    target_id = _resolve_world_id(id)
    conn = get_db_connection()
    world = conn.execute("SELECT * FROM worlds WHERE id = ?", (target_id,)).fetchone()
    if not world:
        conn.close()
        raise HTTPException(status_code=404, detail=f"World '{id}' not found")

    with conn:
        conn.execute("UPDATE worlds SET simulation_speed = ? WHERE id = ?", (req.speed, target_id))
    conn.close()

    runner = simulation_scheduler.get_runner(target_id)
    if runner and runner.status == "running":
        simulation_scheduler.start_world(target_id, speed=req.speed)

    return await get_simulation_status(target_id)


@router.get("/worlds/{id}/state/v2")
async def get_authoritative_world_state_v2(id: str):
    target_id = _resolve_world_id(id)
    from engine.modules.core import get_authoritative_simulation
    core = get_authoritative_simulation(target_id)
    return core.get_full_world_state()


@router.post("/worlds/{id}/saves")
async def create_world_save_slot(id: str, req: SaveSlotRequest):
    target_id = _resolve_world_id(id)
    from engine.modules.core import get_authoritative_simulation
    core = get_authoritative_simulation(target_id)
    slot_id = core.save_to_slot(slot_name=req.slot_name, slot_type=req.slot_type)
    return {"status": "saved", "slot_id": slot_id, "slot_name": req.slot_name, "tick": core.tick}


@router.get("/worlds/{id}/saves")
async def list_world_save_slots(id: str):
    target_id = _resolve_world_id(id)
    conn = get_db_connection()
    rows = conn.execute("SELECT id, name, slot_type, tick, year, day, created_at FROM world_saves WHERE world_id = ? ORDER BY tick DESC", (target_id,)).fetchall()
    conn.close()
    return {"world_id": target_id, "saves": [dict(r) for r in rows]}


@router.post("/worlds/{id}/saves/{slot_name}/load")
async def load_world_save_slot(id: str, slot_name: str):
    target_id = _resolve_world_id(id)
    from engine.modules.core import get_authoritative_simulation
    core = get_authoritative_simulation(target_id)
    success = core.load_from_slot(slot_name)
    if not success:
        raise HTTPException(status_code=404, detail=f"Save slot '{slot_name}' not found for world '{id}'")
    return {"status": "loaded", "slot_name": slot_name, "tick": core.tick, "year": core.year, "day": core.day}


@router.post("/worlds/{id}/policies/{policy_id}/enact")
async def enact_world_policy(id: str, policy_id: str):
    target_id = _resolve_world_id(id)
    from engine.modules.core import get_authoritative_simulation
    core = get_authoritative_simulation(target_id)
    result = core.gov_module.enact_policy(policy_id)
    return result


@router.post("/worlds/{id}/policies/{policy_id}/revoke")
async def revoke_world_policy(id: str, policy_id: str):
    target_id = _resolve_world_id(id)
    from engine.modules.core import get_authoritative_simulation
    core = get_authoritative_simulation(target_id)
    result = core.gov_module.revoke_policy(policy_id)
    return result


@router.post("/worlds/{id}/branch")
async def create_world_scenario_branch(id: str, req: ScenarioBranchRequest):
    target_id = _resolve_world_id(id)
    from engine.modules.core import get_authoritative_simulation
    core = get_authoritative_simulation(target_id)
    state = core.get_full_world_state()
    result = core.future_module.create_scenario_branch(
        branch_name=req.branch_name,
        current_state_dict=state,
        scenario_overrides=req.scenario_overrides
    )
    return result


@router.post("/worlds/{id}/compare")
async def compare_world_scenario(id: str, req: ScenarioCompareRequest):
    target_id = _resolve_world_id(id)
    from engine.modules.core import get_authoritative_simulation
    core = get_authoritative_simulation(target_id)
    base_state = core.get_full_world_state()
    base_metrics = {
        "population": base_state["population"]["total"],
        "gdp": base_state["economy"]["gdp"],
        "average_happiness": base_state["population"]["average_happiness"],
        "composite_pollution_index": base_state["environment"]["environmental_health_index"]
    }
    result = core.future_module.compare_trajectories(base_metrics, req.branch_id, req.branch_metrics)
    return result


