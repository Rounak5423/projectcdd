import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends
from db.database import get_db_connection
from engine.models_v1 import (
    WorldCreateRequest, WorldUpdateRequest, WorldSummary, WorldDetail
)
from auth.security import get_current_user_optional

router = APIRouter(tags=["World Management"])


@router.post("/worlds", response_model=WorldDetail, status_code=status.HTTP_201_CREATED)
async def create_world(
    req: WorldCreateRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional)
):
    world_id = f"world_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    owner_id = current_user["id"] if current_user else "usr_player1_001"

    conn = get_db_connection()
    with conn:
        conn.execute("""
        INSERT INTO worlds (
            id, name, parent_world_id, owner_id, tick, year, day,
            simulation_status, simulation_speed, climate, technology_level,
            grid_size, created_at, updated_at
        ) VALUES (?, ?, NULL, ?, 0, 2026, 1, 'paused', '1x', ?, ?, ?, ?, ?)
        """, (world_id, req.name, owner_id, req.climate, req.technology_level, req.grid_size, now, now))

        # Initial economy and resources
        food_init = 10000.0
        water_init = 10000.0
        energy_init = 8000.0
        materials_init = 5000.0
        if req.initial_resources:
            food_init = req.initial_resources.get("food", food_init)
            water_init = req.initial_resources.get("water", water_init)
            energy_init = req.initial_resources.get("energy", energy_init)
            materials_init = req.initial_resources.get("materials", materials_init)

        conn.execute("""
        INSERT INTO economy_resources (
            world_id, population, population_growth_rate, gdp, gdp_growth_rate,
            employment_rate, average_income, gini_coefficient, civic_stability,
            tax_rate, food, food_rate, water, water_rate, energy, energy_rate,
            materials, materials_rate, research_points, research_rate,
            genesis_research_credits, happiness, environmental_health, pollution
        ) VALUES (
            ?, ?, 0.02, 10000000.0, 0.03, 0.90, 45000.0, 0.28, 0.77, 0.15,
            ?, 80.0, ?, 120.0, ?, 70.0, ?, 45.0, 1000.0, 25.0,
            1000.0, 0.75, 0.85, 0.10
        )
        """, (world_id, req.initial_population, food_init, water_init, energy_init, materials_init))

        # Progression
        conn.execute("""
        INSERT INTO progression (world_id, xp, level, title, thriving_score, grc_balance)
        VALUES (?, 0, 1, 'Level 1 Civilisation', 0.75, 1000.0)
        """, (world_id,))

        # Initial government center
        center = req.grid_size / 2.0
        conn.execute("""
        INSERT INTO buildings (
            id, world_id, name, type, level, x, y, z, width, length, height,
            orientation, status, capacity, construction_cost, upgrade_cost, effects
        ) VALUES (?, ?, 'Civic Center', 'Government', 1, ?, ?, 0.0, 3.0, 3.0, 4.0, 0.0, 'active', 50, '{}', '{}', '{}')
        """, (f"bld_{uuid.uuid4().hex[:8]}", world_id, center, center))

        # Initial event
        conn.execute("""
        INSERT INTO events (id, world_id, year, day, title, category, description, created_at)
        VALUES (?, ?, 2026, 1, 'Civilisation Founded', 'milestone', 'The foundation of the civilisation was laid.', ?)
        """, (f"evt_{uuid.uuid4().hex[:8]}", world_id, now))

    row = conn.execute("""
    SELECT w.*, e.population, e.gdp, p.level, p.thriving_score, p.grc_balance
    FROM worlds w
    JOIN economy_resources e ON w.id = e.world_id
    JOIN progression p ON w.id = p.world_id
    WHERE w.id = ?
    """, (world_id,)).fetchone()
    conn.close()

    return WorldDetail(
        id=row["id"],
        name=row["name"],
        parent_world_id=row["parent_world_id"],
        owner_id=row["owner_id"] if "owner_id" in row.keys() else None,
        tick=row["tick"],
        year=row["year"],
        day=row["day"],
        simulation_status=row["simulation_status"],
        simulation_speed=row["simulation_speed"],
        climate=row["climate"],
        technology_level=row["technology_level"],
        grid_size=row["grid_size"],
        population_count=row["population"],
        gdp=row["gdp"],
        thriving_score=row["thriving_score"],
        level=row["level"],
        grc_balance=row["grc_balance"],
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )


@router.get("/worlds", response_model=List[WorldSummary])
async def list_worlds():
    conn = get_db_connection()
    rows = conn.execute("""
    SELECT w.*, e.population, e.gdp, p.level, p.thriving_score
    FROM worlds w
    LEFT JOIN economy_resources e ON w.id = e.world_id
    LEFT JOIN progression p ON w.id = p.world_id
    ORDER BY w.updated_at DESC
    """).fetchall()
    conn.close()

    return [
        WorldSummary(
            id=r["id"],
            name=r["name"],
            parent_world_id=r["parent_world_id"],
            owner_id=r["owner_id"] if "owner_id" in r.keys() else None,
            tick=r["tick"],
            year=r["year"],
            day=r["day"],
            simulation_status=r["simulation_status"],
            simulation_speed=r["simulation_speed"],
            population=r["population"] or 0,
            gdp=r["gdp"] or 0.0,
            thriving_score=r["thriving_score"] or 0.0,
            level=r["level"] or 1,
            climate=r["climate"],
            technology_level=r["technology_level"],
            created_at=r["created_at"],
            updated_at=r["updated_at"]
        )
        for r in rows
    ]


@router.get("/worlds/{world_id}", response_model=WorldDetail)
@router.get("/civilizations/{world_id}", response_model=WorldDetail, include_in_schema=False)
async def get_world(world_id: str):
    conn = get_db_connection()
    row = conn.execute("""
    SELECT w.*, e.population, e.gdp, p.level, p.thriving_score, p.grc_balance
    FROM worlds w
    JOIN economy_resources e ON w.id = e.world_id
    JOIN progression p ON w.id = p.world_id
    WHERE w.id = ?
    """, (world_id,)).fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"World '{world_id}' not found")

    return WorldDetail(
        id=row["id"],
        name=row["name"],
        parent_world_id=row["parent_world_id"],
        owner_id=row["owner_id"] if "owner_id" in row.keys() else None,
        tick=row["tick"],
        year=row["year"],
        day=row["day"],
        simulation_status=row["simulation_status"],
        simulation_speed=row["simulation_speed"],
        climate=row["climate"],
        technology_level=row["technology_level"],
        grid_size=row["grid_size"],
        population_count=row["population"],
        gdp=row["gdp"],
        thriving_score=row["thriving_score"],
        level=row["level"],
        grc_balance=row["grc_balance"],
        created_at=row["created_at"],
        updated_at=row["updated_at"]
    )


@router.put("/worlds/{world_id}", response_model=WorldDetail)
async def update_world(world_id: str, req: WorldUpdateRequest):
    conn = get_db_connection()
    row = conn.execute("SELECT id FROM worlds WHERE id = ?", (world_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"World '{world_id}' not found")

    updates = []
    params = []
    if req.name is not None:
        updates.append("name = ?")
        params.append(req.name)
    if req.climate is not None:
        updates.append("climate = ?")
        params.append(req.climate)
    if req.technology_level is not None:
        updates.append("technology_level = ?")
        params.append(req.technology_level)
    if req.simulation_speed is not None:
        updates.append("simulation_speed = ?")
        params.append(req.simulation_speed)

    updates.append("updated_at = ?")
    params.append(datetime.now(timezone.utc).isoformat())
    params.append(world_id)

    with conn:
        conn.execute(f"UPDATE worlds SET {', '.join(updates)} WHERE id = ?", params)

    conn.close()
    return await get_world(world_id)


@router.delete("/worlds/{world_id}")
async def delete_world(world_id: str):
    conn = get_db_connection()
    row = conn.execute("SELECT id FROM worlds WHERE id = ?", (world_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"World '{world_id}' not found")

    with conn:
        conn.execute("DELETE FROM worlds WHERE id = ?", (world_id,))

    conn.close()
    return {"status": "deleted", "world_id": world_id}
