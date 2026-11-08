import asyncio
from typing import Dict, Optional, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks
from db.database import get_db_connection
from engine.models_v1 import (
    SimulationStartRequest, SimulationAdvanceRequest, SimulationStatusResponse
)
from engine.simulation_v1 import advance_world_simulation

router = APIRouter(tags=["Simulation Controls"])

# Active background ticker tasks
active_simulation_tasks: Dict[str, asyncio.Task] = {}
SPEED_INTERVALS = {
    "1x": 1.0,
    "2x": 0.5,
    "5x": 0.2,
    "10x": 0.1
}


async def _run_continuous_simulation(world_id: str, speed: str):
    interval = SPEED_INTERVALS.get(speed, 1.0)
    try:
        while True:
            await asyncio.sleep(interval)
            conn = get_db_connection()
            w = conn.execute("SELECT simulation_status, simulation_speed FROM worlds WHERE id = ?", (world_id,)).fetchone()
            conn.close()

            if not w or w["simulation_status"] != "running":
                break

            current_speed = w["simulation_speed"]
            interval = SPEED_INTERVALS.get(current_speed, 1.0)
            advance_world_simulation(world_id, ticks=1)
    except asyncio.CancelledError:
        pass


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

    # Start or update background loop
    if id in active_simulation_tasks:
        active_simulation_tasks[id].cancel()

    task = asyncio.create_task(_run_continuous_simulation(id, req.speed))
    active_simulation_tasks[id] = task

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

    if id in active_simulation_tasks:
        active_simulation_tasks[id].cancel()
        del active_simulation_tasks[id]

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

    if id in active_simulation_tasks:
        active_simulation_tasks[id].cancel()

    task = asyncio.create_task(_run_continuous_simulation(id, speed))
    active_simulation_tasks[id] = task

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
        advance_world_simulation(target_id, ticks=req.ticks)
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

    return SimulationStatusResponse(
        world_id=id,
        simulation_status=status_str,
        simulation_speed=speed_str,
        current_tick=tick,
        year=year,
        day=day,
        formatted_time=formatted
    )

