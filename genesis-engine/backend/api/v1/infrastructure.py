import json
import uuid
import math
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, status
from db.database import get_db_connection
from engine.models_v1 import (
    MapTerrainResponse, BuildingRecord, BuildingConstructRequest,
    BuildingUpgradeResponse
)
from cache import data_cache

router = APIRouter(tags=["3D World & Infrastructure"])

BUILDING_DEFAULTS = {
    "Residential": {
        "width": 3.0, "length": 3.0, "height": 4.5, "capacity": 50000,
        "cost": {"materials": 1500, "energy": 600, "credits": 150},
        "effects": {"housing_capacity": 50000, "happiness_bonus": 0.02}
    },
    "Agriculture": {
        "width": 4.0, "length": 4.0, "height": 3.0, "capacity": 100,
        "cost": {"materials": 1200, "energy": 400, "credits": 100},
        "effects": {"food_generation_t": 100.0, "water_demand": 80.0}
    },
    "Industry": {
        "width": 4.0, "length": 3.5, "height": 4.5, "capacity": 1000,
        "cost": {"materials": 2000, "energy": 900, "credits": 250},
        "effects": {"materials_generation_t": 50.0, "pollution_increase": 0.03}
    },
    "Research": {
        "width": 3.5, "length": 3.5, "height": 6.0, "capacity": 200,
        "cost": {"materials": 1800, "energy": 800, "credits": 250},
        "effects": {"research_generation": 40.0, "grc_generation": 10.0}
    },
    "Education": {
        "width": 3.2, "length": 3.2, "height": 4.5, "capacity": 800,
        "cost": {"materials": 1400, "energy": 600, "credits": 180},
        "effects": {"education_boost": 0.05, "independent_reasoning_preservation": 0.8}
    },
    "Healthcare": {
        "width": 3.0, "length": 2.5, "height": 4.0, "capacity": 1200,
        "cost": {"materials": 1300, "energy": 500, "credits": 140},
        "effects": {"health_bonus": 0.06, "mortality_reduction": 0.10}
    },
    "Energy": {
        "width": 3.5, "length": 3.5, "height": 5.0, "capacity": 150,
        "cost": {"materials": 1900, "energy": 300, "credits": 200},
        "effects": {"energy_generation_mw": 80.0, "clean_energy_ratio": 0.85}
    },
    "Government": {
        "width": 4.0, "length": 4.0, "height": 8.0, "capacity": 500,
        "cost": {"materials": 2500, "energy": 1000, "credits": 350},
        "effects": {"civic_stability_bonus": 0.10, "administrative_efficiency": 0.90}
    },
    "Environment": {
        "width": 2.5, "length": 5.0, "height": 8.0, "capacity": 50,
        "cost": {"materials": 1100, "energy": 250, "credits": 90},
        "effects": {"environmental_health_boost": 0.05, "pollution_reduction": 0.08}
    }
}


@router.get("/worlds/{id}/map", response_model=MapTerrainResponse)
async def get_world_map(id: str):
    cache_key = f"map_terrain:{id}"
    cached = data_cache.get(cache_key)
    if cached is not None:
        return cached

    conn = get_db_connection()
    world = conn.execute("SELECT * FROM worlds WHERE id = ?", (id,)).fetchone()
    conn.close()

    if not world:
        raise HTTPException(status_code=404, detail=f"World '{id}' not found")

    grid_size = world["grid_size"]
    climate = world["climate"]

    # Procedural elevation & zoning grid
    elevation = []
    for x in range(grid_size):
        row = []
        for y in range(grid_size):
            dist_from_center = math.sqrt((x - grid_size / 2) ** 2 + (y - grid_size / 2) ** 2)
            # Gentle river valley trough + rolling hills at edges
            elev = round(math.sin(x * 0.3) * math.cos(y * 0.3) * 1.5 + (dist_from_center * 0.1), 2)
            row.append(max(0.0, elev))
        elevation.append(row)

    zones = [
        {"name": "Central District", "type": "Government & Civic", "bounds": {"min_x": 12, "max_x": 20, "min_y": 12, "max_y": 20}},
        {"name": "North Residential Sector", "type": "Residential", "bounds": {"min_x": 4, "max_x": 16, "min_y": 4, "max_y": 12}},
        {"name": "South Residential Sector", "type": "Residential", "bounds": {"min_x": 10, "max_x": 22, "min_y": 20, "max_y": 28}},
        {"name": "East High-Tech Basin", "type": "Research & Education", "bounds": {"min_x": 20, "max_x": 28, "min_y": 14, "max_y": 24}},
        {"name": "West Agri-Valley", "type": "Agriculture & Hydroponics", "bounds": {"min_x": 4, "max_x": 12, "min_y": 18, "max_y": 28}},
        {"name": "Northeast Industrial Ridge", "type": "Industry & Energy", "bounds": {"min_x": 22, "max_x": 30, "min_y": 4, "max_y": 14}}
    ]

    biomes = {
        "climate": climate,
        "vegetation_density": 0.82 if climate in ["Temperate", "Tropical"] else 0.45,
        "water_coverage": 0.28,
        "average_temperature": 21.5 if climate == "Temperate" else 32.0 if climate == "Arid" else 2.0
    }

    result = MapTerrainResponse(
        world_id=id,
        grid_size=grid_size,
        climate=climate,
        zones=zones,
        elevation_grid=elevation,
        biomes=biomes
    )
    data_cache.set(cache_key, result, ttl=180.0)
    return result


@router.get("/worlds/{id}/buildings", response_model=List[BuildingRecord])
@router.get("/civilizations/{id}/buildings", response_model=List[BuildingRecord], include_in_schema=False)
async def get_all_buildings(id: str):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM buildings WHERE world_id = ?", (id,)).fetchall()
    conn.close()

    result = []
    for r in rows:
        result.append(BuildingRecord(
            id=r["id"],
            world_id=r["world_id"],
            name=r["name"],
            type=r["type"],
            level=r["level"],
            x=r["x"],
            y=r["y"],
            z=r["z"],
            width=r["width"],
            length=r["length"],
            height=r["height"],
            orientation=r["orientation"],
            status=r["status"],
            capacity=r["capacity"],
            construction_cost=json.loads(r["construction_cost"] or "{}"),
            upgrade_cost=json.loads(r["upgrade_cost"] or "{}"),
            effects=json.loads(r["effects"] or "{}"),
            coordinates={"x": r["x"], "y": r["y"], "z": r["z"]},
            dimensions={"width": r["width"], "length": r["length"], "height": r["height"]}
        ))
    return result


@router.post("/worlds/{id}/buildings", response_model=BuildingRecord, status_code=status.HTTP_201_CREATED)
@router.post("/civilizations/{id}/buildings", response_model=BuildingRecord, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def construct_building(id: str, req: BuildingConstructRequest):
    conn = get_db_connection()
    world = conn.execute("SELECT id FROM worlds WHERE id = ?", (id,)).fetchone()
    if not world:
        conn.close()
        raise HTTPException(status_code=404, detail=f"World '{id}' not found")

    defaults = BUILDING_DEFAULTS.get(req.type, BUILDING_DEFAULTS["Residential"])
    building_id = f"bld_{uuid.uuid4().hex[:8]}"
    name = req.name or f"{req.type} Facility"
    cost = defaults["cost"]
    upgrade_cost = {k: v * 1.5 for k, v in cost.items()}
    effects = defaults["effects"]

    with conn:
        conn.execute("""
        INSERT INTO buildings (
            id, world_id, name, type, level, x, y, z, width, length, height,
            orientation, status, capacity, construction_cost, upgrade_cost, effects
        ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
        """, (
            building_id, id, name, req.type, req.x, req.y, req.z,
            defaults["width"], defaults["length"], defaults["height"],
            req.orientation, defaults["capacity"],
            json.dumps(cost), json.dumps(upgrade_cost), json.dumps(effects)
        ))

        # Deduct construction cost from resources if available
        conn.execute("""
        UPDATE economy_resources SET
            materials = MAX(0.0, materials - ?),
            energy = MAX(0.0, energy - ?),
            genesis_research_credits = MAX(0.0, genesis_research_credits - ?)
        WHERE world_id = ?
        """, (cost.get("materials", 0.0), cost.get("energy", 0.0), cost.get("credits", 0.0), id))

    conn.close()

    return BuildingRecord(
        id=building_id,
        world_id=id,
        name=name,
        type=req.type,
        level=1,
        x=req.x,
        y=req.y,
        z=req.z,
        width=defaults["width"],
        length=defaults["length"],
        height=defaults["height"],
        orientation=req.orientation,
        status="active",
        capacity=defaults["capacity"],
        construction_cost=cost,
        upgrade_cost=upgrade_cost,
        effects=effects,
        coordinates={"x": req.x, "y": req.y, "z": req.z},
        dimensions={"width": defaults["width"], "length": defaults["length"], "height": defaults["height"]}
    )


@router.get("/buildings/{building_id}", response_model=BuildingRecord)
async def get_building_details(building_id: str):
    conn = get_db_connection()
    r = conn.execute("SELECT * FROM buildings WHERE id = ?", (building_id,)).fetchone()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail=f"Building '{building_id}' not found")

    return BuildingRecord(
        id=r["id"],
        world_id=r["world_id"],
        name=r["name"],
        type=r["type"],
        level=r["level"],
        x=r["x"],
        y=r["y"],
        z=r["z"],
        width=r["width"],
        length=r["length"],
        height=r["height"],
        orientation=r["orientation"],
        status=r["status"],
        capacity=r["capacity"],
        construction_cost=json.loads(r["construction_cost"] or "{}"),
        upgrade_cost=json.loads(r["upgrade_cost"] or "{}"),
        effects=json.loads(r["effects"] or "{}"),
        coordinates={"x": r["x"], "y": r["y"], "z": r["z"]},
        dimensions={"width": r["width"], "length": r["length"], "height": r["height"]}
    )


@router.post("/buildings/{building_id}/upgrade", response_model=BuildingUpgradeResponse)
async def upgrade_building(building_id: str):
    conn = get_db_connection()
    b = conn.execute("SELECT * FROM buildings WHERE id = ?", (building_id,)).fetchone()
    if not b:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Building '{building_id}' not found")

    prev_level = b["level"]
    new_level = prev_level + 1
    new_height = b["height"] + 1.2
    new_capacity = int(b["capacity"] * 1.5)

    current_upgrade_cost = json.loads(b["upgrade_cost"] or "{}")
    next_upgrade_cost = {k: v * 1.6 for k, v in current_upgrade_cost.items()}

    current_effects = json.loads(b["effects"] or "{}")
    updated_effects = {k: (v * 1.4 if isinstance(v, (int, float)) else v) for k, v in current_effects.items()}

    with conn:
        conn.execute("""
        UPDATE buildings SET
            level = ?, height = ?, capacity = ?, upgrade_cost = ?, effects = ?, status = 'active'
        WHERE id = ?
        """, (new_level, new_height, new_capacity, json.dumps(next_upgrade_cost), json.dumps(updated_effects), building_id))

        # Award XP for building upgrade
        conn.execute("""
        UPDATE progression SET xp = xp + ? WHERE world_id = ?
        """, (250 * new_level, b["world_id"]))

    conn.close()

    return BuildingUpgradeResponse(
        building_id=building_id,
        name=b["name"],
        previous_level=prev_level,
        new_level=new_level,
        status="active",
        upgrade_cost=next_upgrade_cost,
        updated_effects=updated_effects
    )


@router.delete("/buildings/{building_id}")
async def remove_building(building_id: str):
    conn = get_db_connection()
    b = conn.execute("SELECT * FROM buildings WHERE id = ?", (building_id,)).fetchone()
    if not b:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Building '{building_id}' not found")

    with conn:
        conn.execute("DELETE FROM buildings WHERE id = ?", (building_id,))

    conn.close()
    return {"status": "removed", "building_id": building_id}

