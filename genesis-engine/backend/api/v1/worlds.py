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

        # Initial economy and resources (starter pioneer supplies)
        food_init = 1200.0
        water_init = 1500.0
        energy_init = 800.0
        materials_init = 2500.0
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
            ?, ?, 0.02, 50000.0, 0.01, 1.0, 32000.0, 0.15, 0.90, 0.10,
            ?, 20.0, ?, 25.0, ?, 15.0, ?, 10.0, 100.0, 5.0,
            500.0, 0.88, 0.95, 0.02
        )
        """, (world_id, req.initial_population, food_init, water_init, energy_init, materials_init))

        # Progression
        conn.execute("""
        INSERT INTO progression (world_id, xp, level, title, thriving_score, grc_balance)
        VALUES (?, 0, 1, 'Pioneer Settlement', 0.85, 500.0)
        """, (world_id,))

        # Initial starter Frontier Colony Outpost
        center = req.grid_size / 2.0
        conn.execute("""
        INSERT INTO buildings (
            id, world_id, name, type, level, x, y, z, width, length, height,
            orientation, status, capacity, construction_cost, upgrade_cost, effects
        ) VALUES (?, ?, 'Frontier Colony Outpost', 'Government', 1, ?, ?, 0.0, 3.0, 3.0, 3.0, 0.0, 'active', 10, '{}', '{}', '{}')
        """, (f"bld_{uuid.uuid4().hex[:8]}", world_id, center, center))

        # Founding pioneer citizens
        pioneer_occupations = [
            'Expedition Commander', 'Botanist & Agronomist', 'Civil Infrastructure Engineer',
            'Energy Systems Technician', 'Hydrological Specialist', 'Materials Fabricator',
            'Field Medic', 'Cartographer & Surveyor', 'Biosphere Ecologist', 'Data & Comms Specialist'
        ]
        for i in range(min(req.initial_population, 20)):
            occ = pioneer_occupations[i % len(pioneer_occupations)]
            conn.execute("""
            INSERT INTO citizens (
                id, world_id, age, occupation, wealth, x, y, hunger, energy, wellbeing,
                education_level, health, independent_reasoning, problem_solving, critical_evaluation,
                creativity, knowledge_retention, ai_dependency, is_alive
            ) VALUES (?, ?, ?, ?, 100.0, ?, ?, 0.1, 0.9, 0.85, 0.8, 0.95, 0.8, 0.85, 0.75, 0.8, 0.85, 0.05, 1)
            """, (f"cit_{world_id}_{i+1:02d}", world_id, 28.0 + (i % 12), occ, center + (i % 3) * 0.5, center + (i // 3) * 0.5))

        # Initial event
        conn.execute("""
        INSERT INTO events (id, world_id, year, day, title, category, description, created_at)
        VALUES (?, ?, 1, 1, 'Civilisation Founded', 'milestone', 'Your founding pioneers have arrived to establish the colony.', ?)
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

    forecast_data = None
    try:
        from ml.config import ML_ENABLED
        if ML_ENABLED:
            from ml.inference.registry import predict_civilisation_forecast
            forecast_data = predict_civilisation_forecast(
                {"population": row["population"], "treasury": row["gdp"], "year": row["year"]},
                horizon_years=5
            )
    except Exception:
        pass

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
        updated_at=row["updated_at"],
        forecast=forecast_data
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


# ==============================================================================
# SAVE SLOTS & AUTOSAVES
# ==============================================================================

@router.post("/worlds/{id}/saves", status_code=status.HTTP_201_CREATED)
async def create_world_save(id: str, payload: Optional[Dict[str, Any]] = None):
    conn = get_db_connection()
    world = conn.execute("SELECT * FROM worlds WHERE id = ?", (id,)).fetchone()
    if not world:
        conn.close()
        raise HTTPException(status_code=404, detail=f"World '{id}' not found")

    econ = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (id,)).fetchone()
    prog = conn.execute("SELECT * FROM progression WHERE world_id = ?", (id,)).fetchone()
    buildings = conn.execute("SELECT * FROM buildings WHERE world_id = ?", (id,)).fetchall()

    save_id = f"save_{uuid.uuid4().hex[:8]}"
    slot_type = (payload or {}).get("slot_type", "manual")
    name = (payload or {}).get("name") or f"{world['name']} Save ({slot_type.capitalize()})"
    now = datetime.now(timezone.utc).isoformat()

    full_state = {
        "world": dict(world),
        "economy": dict(econ) if econ else {},
        "progression": dict(prog) if prog else {},
        "buildings": [dict(b) for b in buildings],
        "saved_at": now
    }

    with conn:
        conn.execute("""
        INSERT INTO world_saves (id, world_id, name, slot_type, tick, year, day, state_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            save_id, id, name, slot_type,
            world["tick"], world["year"], world["day"],
            json.dumps(full_state), now
        ))

    conn.close()
    return {
        "id": save_id,
        "world_id": id,
        "name": name,
        "slot_type": slot_type,
        "tick": world["tick"],
        "year": world["year"],
        "day": world["day"],
        "created_at": now
    }


@router.get("/worlds/{id}/saves")
async def list_world_saves(id: str):
    conn = get_db_connection()
    saves = conn.execute(
        "SELECT id, world_id, name, slot_type, tick, year, day, created_at FROM world_saves WHERE world_id = ? ORDER BY created_at DESC",
        (id,)
    ).fetchall()
    conn.close()
    return [dict(s) for s in saves]


@router.post("/worlds/{id}/saves/{save_id}/restore")
async def restore_world_save(id: str, save_id: str):
    conn = get_db_connection()
    save_row = conn.execute("SELECT * FROM world_saves WHERE id = ? AND world_id = ?", (save_id, id)).fetchone()
    if not save_row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Save slot '{save_id}' not found for world '{id}'")

    state_data = json.loads(save_row["state_json"])
    w_data = state_data.get("world", {})
    e_data = state_data.get("economy", {})

    with conn:
        conn.execute("""
        UPDATE worlds SET tick = ?, year = ?, day = ?, simulation_status = 'paused', updated_at = ?
        WHERE id = ?
        """, (
            save_row["tick"], save_row["year"], save_row["day"],
            datetime.now(timezone.utc).isoformat(), id
        ))

        if e_data:
            conn.execute("""
            UPDATE economy_resources SET
                population = ?, gdp = ?, food = ?, water = ?, energy = ?,
                materials = ?, research_points = ?, genesis_research_credits = ?,
                happiness = ?, civic_stability = ?
            WHERE world_id = ?
            """, (
                e_data.get("population", 1000), e_data.get("gdp", 100000.0),
                e_data.get("food", 5000.0), e_data.get("water", 5000.0), e_data.get("energy", 5000.0),
                e_data.get("materials", 3000.0), e_data.get("research_points", 1000.0),
                e_data.get("genesis_research_credits", 500.0), e_data.get("happiness", 0.75),
                e_data.get("civic_stability", 0.75), id
            ))

    conn.close()
    return {
        "status": "restored",
        "world_id": id,
        "save_id": save_id,
        "restored_tick": save_row["tick"],
        "restored_year": save_row["year"],
        "restored_day": save_row["day"]
    }


@router.delete("/worlds/{id}/saves/{save_id}")
async def delete_world_save(id: str, save_id: str):
    conn = get_db_connection()
    row = conn.execute("SELECT id FROM world_saves WHERE id = ? AND world_id = ?", (save_id, id)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Save '{save_id}' not found")

    with conn:
        conn.execute("DELETE FROM world_saves WHERE id = ?", (save_id,))

    conn.close()
    return {"status": "deleted", "save_id": save_id}
