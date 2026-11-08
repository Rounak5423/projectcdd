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


@router.post("/worlds/{id}/simulation/advance", response_model=SimulationStatusResponse)
@router.post("/civilizations/{id}/simulate", response_model=SimulationStatusResponse, include_in_schema=False)
async def advance_simulation(id: str, req: SimulationAdvanceRequest):
    try:
        # Thread-safe, lock-guaranteed advance avoiding concurrent race conditions (Task 2 & 5)
        res = await simulation_scheduler.advance_world(id, ticks=req.ticks)
        try:
            from realtime import rt_ws_manager, delta_engine, EventPriority
            ev_type, delta_payload, base_v, new_v = delta_engine.compute_state_delta(id, res)
            await rt_ws_manager.broadcast(id, {
                "type": "tick_update",
                "event_type": ev_type,
                "delta": delta_payload,
                **res
            }, priority=EventPriority.NORMAL)
        except Exception:
            pass
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return await get_simulation_status(id)


@router.get("/worlds/{id}/simulation/status", response_model=SimulationStatusResponse)
async def get_simulation_status(id: str):
    conn = get_db_connection()
    world = conn.execute("SELECT * FROM worlds WHERE id = ?", (id,)).fetchone()
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

