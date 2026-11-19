"""
Causal Coupling API Endpoints.
Provides causal diagnostics, vital signs time-series, causal dependency graphs,
and interactive system dynamics intervention / controlled shock simulations.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from db.database import get_db_connection
from engine.causal import global_causal_engine
from engine.causal.state import CausalVitalsSnapshot, CausalTraceGraph, DeathsByCause, UnmetNeeds
from engine.simulation_v1 import advance_world_simulation

router = APIRouter(tags=["Causal Simulation"])


def resolve_world_id(world_id: str) -> str:
    if not world_id or world_id in ["civ-aurora-01", "civ-default", "civ-new-frontier", "prime", "default"]:
        return "aurora-prime"
    return world_id


class VitalsTimeSeriesResponse(BaseModel):
    world_id: str
    count: int
    data: List[CausalVitalsSnapshot]


class InterventionSimulationRequest(BaseModel):
    intervention_type: str = Field(..., description="e.g. 'emergency_food_relief', 'expand_hospital', 'cut_food', 'cut_hospital_capacity', 'emergency_water', 'civic_accord'")
    ticks: int = Field(default=5, ge=1, le=50)


class InterventionSimulationResponse(BaseModel):
    success: bool = True
    world_id: str
    intervention_type: str
    ticks: int
    message: str
    vitals: Optional[CausalVitalsSnapshot] = None
    trace_graph: Optional[CausalTraceGraph] = None


def _ensure_causal_vitals_seeded(world_id: str):
    """Ensures at least 5-10 historical data points exist in memory/DB for rich charts."""
    cached = global_causal_engine.get_vitals_history(world_id, limit=60)
    if len(cached) >= 5:
        return
    conn = get_db_connection()
    w_row = conn.execute("SELECT id FROM worlds WHERE id = ?", (world_id,)).fetchone()
    if not w_row:
        now = datetime.now(timezone.utc).isoformat()
        try:
            with conn:
                conn.execute("""
                INSERT INTO worlds (
                    id, name, parent_world_id, owner_id, tick, year, day,
                    simulation_status, simulation_speed, climate, technology_level,
                    grid_size, created_at, updated_at
                ) VALUES (?, ?, NULL, 'usr_player1_001', 1, 2026, 1, 'running', '1x', 'Temperate', 'Automated', 32, ?, ?)
                """, (world_id, f"World {world_id}", now, now))
                conn.execute("""
                INSERT INTO economy_resources (
                    world_id, population, population_growth_rate, gdp, gdp_growth_rate,
                    employment_rate, average_income, gini_coefficient, civic_stability,
                    tax_rate, food, food_rate, water, water_rate, energy, energy_rate,
                    materials, materials_rate, research_points, research_rate,
                    genesis_research_credits, happiness, environmental_health, pollution
                ) VALUES (
                    ?, 100000, 0.02, 1000000.0, 0.02,
                    0.95, 45000.0, 0.25, 0.85,
                    0.15, 20000.0, 100.0, 25000.0, 150.0, 15000.0, 80.0,
                    10000.0, 50.0, 500.0, 10.0,
                    1000.0, 0.85, 0.80, 0.10
                )
                """, (world_id,))
                conn.execute("""
                INSERT INTO progression (
                    world_id, xp, level, title, thriving_score, grc_balance
                ) VALUES (?, 0, 1, 'Level 1 Civilisation', 0.80, 1000.0)
                """, (world_id,))
                conn.execute("""
                INSERT INTO buildings (
                    id, world_id, name, type, level, x, y, z, width, length, height, status, capacity
                ) VALUES (?, ?, 'General Medical Center', 'Healthcare', 1, 10.0, 0.5, 10.0, 3.0, 3.0, 3.0, 'active', 500)
                """, (f"bld_hosp_{uuid.uuid4().hex[:6]}", world_id))
        except Exception:
            pass

    count_row = conn.execute("SELECT COUNT(*) as c FROM causal_vitals WHERE world_id = ?", (world_id,)).fetchone()
    count = count_row["c"] if count_row else 0
    conn.close()
    if count < 5:
        ticks_to_advance = max(1, 5 - count)
        try:
            advance_world_simulation(world_id, ticks=ticks_to_advance)
        except Exception:
            pass


@router.get("/worlds/{id}/causal-trace", response_model=CausalTraceGraph)
@router.get("/causal/trace", response_model=CausalTraceGraph, include_in_schema=False)
def get_world_causal_trace(id: str = "aurora-prime"):
    """
    Returns the per-tick causal dependency graph, contributing factors,
    and link strengths for deaths, hospital pressure, and civil protests.
    """
    id = resolve_world_id(id)
    _ensure_causal_vitals_seeded(id)

    trace = global_causal_engine.get_causal_trace(id)
    if trace:
        return trace

    # Fallback to query recent causal_vitals from database
    conn = get_db_connection()
    row = conn.execute(
        "SELECT * FROM causal_vitals WHERE world_id = ? ORDER BY tick DESC LIMIT 1",
        (id,)
    ).fetchone()
    w_row = conn.execute("SELECT * FROM worlds WHERE id = ?", (id,)).fetchone()
    e_row = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (id,)).fetchone()
    conn.close()

    if not row or not w_row:
        # Auto-step 1 tick to generate authoritative causal trace
        try:
            advance_world_simulation(id, ticks=1)
            trace = global_causal_engine.get_causal_trace(id)
            if trace:
                return trace
        except Exception:
            pass

        conn = get_db_connection()
        row = conn.execute(
            "SELECT * FROM causal_vitals WHERE world_id = ? ORDER BY tick DESC LIMIT 1",
            (id,)
        ).fetchone()
        w_row = conn.execute("SELECT * FROM worlds WHERE id = ?", (id,)).fetchone()
        e_row = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (id,)).fetchone()
        conn.close()

    if not row or not w_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"No causal vitals recorded for world '{id}'")

    vitals = CausalVitalsSnapshot(
        world_id=id,
        tick=row["tick"],
        year=row["year"],
        day=row["day"],
        population=row["population"],
        births=row["births"],
        deaths=row["deaths"],
        deaths_by_cause=DeathsByCause(
            aging=row["deaths_aging"],
            starvation=row["deaths_starvation"],
            dehydration=row["deaths_dehydration"],
            hospital_overload=row["deaths_hospital_overload"],
            pollution=row["deaths_pollution"],
            trauma=row["deaths_trauma"],
        ),
        unmet_needs=UnmetNeeds(
            food=row["unmet_food"],
            water=row["unmet_water"],
            energy=row["unmet_energy"],
            healthcare=row["unmet_healthcare"],
            shelter=row["unmet_shelter"],
        ),
        health_index=row["health_index"],
        hospital_admissions=row["hospital_admissions"],
        bed_capacity=row["bed_capacity"],
        bed_occupancy_pct=row["bed_occupancy_pct"],
        overflow_patients=row["overflow_patients"],
        protest_intensity=row["protest_intensity"],
        protest_participants=row["protest_participants"],
        grievance_score=row["grievance_score"],
        happiness=row["happiness"],
        civic_stability=row["civic_stability"],
        environmental_health=row["environmental_health"],
        created_at=row["created_at"],
    )

    return global_causal_engine._build_trace_graph(
        world_id=id,
        tick=row["tick"],
        year=row["year"],
        day=row["day"],
        vitals=vitals,
        food_stock=e_row["food"] if e_row else 10000.0,
        water_stock=e_row["water"] if e_row else 10000.0,
        energy_stock=e_row["energy"] if e_row else 8000.0,
        pollution_level=e_row["pollution"] if (e_row and "pollution" in e_row.keys() and e_row["pollution"] is not None) else 0.15,
    )


@router.get("/worlds/{id}/vitals", response_model=VitalsTimeSeriesResponse)
@router.get("/causal/vitals", response_model=VitalsTimeSeriesResponse, include_in_schema=False)
def get_world_vitals_timeseries(
    id: str = "aurora-prime",
    limit: int = Query(default=60, ge=1, le=300, description="Max history snapshots to return")
):
    """
    Returns high-resolution time-series of vital statistics:
    births, deaths by cause (aging, starvation, dehydration, hospital overload, pollution),
    hospital bed occupancy, unmet basic needs, and protest intensity.
    """
    id = resolve_world_id(id)
    _ensure_causal_vitals_seeded(id)

    # First attempt from in-memory cache
    cached = global_causal_engine.get_vitals_history(id, limit=limit)
    if len(cached) >= min(10, limit):
        return VitalsTimeSeriesResponse(world_id=id, count=len(cached), data=cached)

    # Query from persistent database
    conn = get_db_connection()
    rows = conn.execute(
        """
        SELECT * FROM causal_vitals
        WHERE world_id = ?
        ORDER BY tick ASC
        LIMIT ?
        """,
        (id, limit)
    ).fetchall()
    conn.close()

    data: List[CausalVitalsSnapshot] = []
    for r in rows:
        data.append(CausalVitalsSnapshot(
            world_id=id,
            tick=r["tick"],
            year=r["year"],
            day=r["day"],
            population=r["population"],
            births=r["births"],
            deaths=r["deaths"],
            deaths_by_cause=DeathsByCause(
                aging=r["deaths_aging"],
                starvation=r["deaths_starvation"],
                dehydration=r["deaths_dehydration"],
                hospital_overload=r["deaths_hospital_overload"],
                pollution=r["deaths_pollution"],
                trauma=r["deaths_trauma"],
            ),
            unmet_needs=UnmetNeeds(
                food=r["unmet_food"],
                water=r["unmet_water"],
                energy=r["unmet_energy"],
                healthcare=r["unmet_healthcare"],
                shelter=r["unmet_shelter"],
            ),
            health_index=r["health_index"],
            hospital_admissions=r["hospital_admissions"],
            bed_capacity=r["bed_capacity"],
            bed_occupancy_pct=r["bed_occupancy_pct"],
            overflow_patients=r["overflow_patients"],
            protest_intensity=r["protest_intensity"],
            protest_participants=r["protest_participants"],
            grievance_score=r["grievance_score"],
            happiness=r["happiness"],
            civic_stability=r["civic_stability"],
            environmental_health=r["environmental_health"],
            created_at=r["created_at"],
        ))

    return VitalsTimeSeriesResponse(world_id=id, count=len(data), data=data)


@router.post("/worlds/{id}/intervene", response_model=InterventionSimulationResponse)
@router.post("/causal/intervene", response_model=InterventionSimulationResponse, include_in_schema=False)
def simulate_causal_intervention(id: str = "aurora-prime", req: InterventionSimulationRequest = None):
    """
    Executes a controlled causal shock or policy intervention on the simulation dynamics.
    Applies the resource/capacity delta, advances the simulation by N ticks,
    records an event dispatch, and returns the updated vitals and causal graph.
    """
    id = resolve_world_id(id)
    _ensure_causal_vitals_seeded(id)
    if req is None:
        req = InterventionSimulationRequest(intervention_type="emergency_food_relief", ticks=5)

    itype = req.intervention_type.lower()
    conn = get_db_connection()
    now_iso = datetime.now(timezone.utc).isoformat()
    evt_title = "Causal Intervention Executed"
    evt_desc = f"Simulated intervention '{req.intervention_type}' across {req.ticks} ticks."

    # 1. Apply physical/economic intervention shock
    with conn:
        if itype in ["emergency_food", "emergency_food_relief"]:
            conn.execute("""
            UPDATE economy_resources
            SET food = food + 8000.0,
                happiness = MIN(1.0, happiness + 0.12)
            WHERE world_id = ?
            """, (id,))
            evt_title = "Strategic Grain Reserves Released"
            evt_desc = "Mobilized strategic national granaries with 8,000 units of emergency rations. Starvation halted."

        elif itype in ["expand_hospital", "expand_hospitals"]:
            # Boost hospital capacities or add temporary field hospital
            conn.execute("""
            UPDATE buildings
            SET capacity = capacity + 500
            WHERE world_id = ? AND type = 'Healthcare'
            """, (id,))
            # If no hospital existed, insert temporary pavilion
            h_count = conn.execute("SELECT COUNT(*) as c FROM buildings WHERE world_id = ? AND type = 'Healthcare'", (id,)).fetchone()
            if not h_count or h_count["c"] == 0:
                conn.execute("""
                INSERT INTO buildings (id, world_id, name, type, level, x, y, z, width, length, height, status, capacity)
                VALUES (?, ?, 'Emergency Field Infirmary', 'Healthcare', 1, 16.0, 0.6, 16.0, 4.0, 4.0, 4.0, 'active', 2000)
                """, (f"bld_surge_hosp_{uuid.uuid4().hex[:6]}", id))
            evt_title = "Field Infirmaries & Surge Beds Deployed"
            evt_desc = "Deployed acute trauma pavilions adding surge hospital beds. Bed occupancy returned to safe threshold."

        elif itype in ["emergency_water"]:
            conn.execute("""
            UPDATE economy_resources
            SET water = water + 8000.0,
                happiness = MIN(1.0, happiness + 0.08)
            WHERE world_id = ?
            """, (id,))
            evt_title = "Aqueduct & Aquifer Floodgates Opened"
            evt_desc = "Dispatched emergency clean water convoys. Municipal dehydration crisis averted."

        elif itype in ["civic_accord"]:
            conn.execute("""
            UPDATE economy_resources
            SET civic_stability = MIN(1.0, civic_stability + 0.25),
                happiness = MIN(1.0, happiness + 0.10)
            WHERE world_id = ?
            """, (id,))
            evt_title = "Imperial Civic Accord Proclaimed"
            evt_desc = "Addressed key citizen grievance petitions and declared civic concord. Civil strike risk suppressed."

        elif itype in ["cut_food"]:
            # Severe food deficit shock
            conn.execute("""
            UPDATE economy_resources
            SET food = 0.0,
                happiness = MAX(0.10, happiness - 0.25)
            WHERE world_id = ?
            """, (id,))
            conn.execute("UPDATE citizens SET hunger = 0.05 WHERE world_id = ?", (id,))
            evt_title = "Ration Deficit Stress Test Induced"
            evt_desc = "Strategic food stores ablated to zero to measure societal resistance and time-to-protest propagation."

        elif itype in ["cut_hospital_capacity"]:
            # Healthcare brownout shock
            conn.execute("""
            UPDATE buildings
            SET capacity = 20, status = 'damaged'
            WHERE world_id = ? AND type = 'Healthcare'
            """, (id,))
            evt_title = "Medical Facility Brownout Shock"
            evt_desc = "Clinical bed capacity restricted to test emergency overflow patient casualties and hospital deficit risk."

        # Fetch current world year & day for event logging
        w_row = conn.execute("SELECT tick, year, day FROM worlds WHERE id = ?", (id,)).fetchone()
        cur_tick = w_row["tick"] if w_row else 1
        cur_year = w_row["year"] if w_row else 1
        cur_day = w_row["day"] if w_row else 1

        # Register event in events table for Causal Event Feed
        try:
            conn.execute("""
            INSERT INTO events (id, world_id, year, day, title, category, description, created_at)
            VALUES (?, ?, ?, ?, ?, 'intervention', ?, ?)
            """, (f"evt_{uuid.uuid4().hex[:8]}", id, cur_year, cur_day, evt_title, evt_desc, now_iso))
        except Exception:
            pass

    conn.close()

    # 2. Advance the world simulation by the requested ticks
    step_res = {}
    try:
        step_res = advance_world_simulation(id, ticks=req.ticks)
    except Exception as e:
        pass

    # Also sync AuthoritativeSimulationCore singleton if active
    from engine.modules.core import _SIMULATION_CORES
    if id in _SIMULATION_CORES:
        try:
            core = _SIMULATION_CORES[id]
            if itype in ["emergency_food", "emergency_food_relief"]:
                core.resources_module.food_stock += 8000.0
                for c in core.population_module.citizens.values():
                    c.hunger = 1.0
            elif itype in ["emergency_water"]:
                core.resources_module.water_stock += 8000.0
                for c in core.population_module.citizens.values():
                    c.thirst = 1.0
            elif itype in ["civic_accord"]:
                core.gov_module.public_trust = min(1.0, core.gov_module.public_trust + 0.25)
                core.gov_module.protest_intensity = 0.0
                core.gov_module.grievance_index = max(0.0, core.gov_module.grievance_index - 0.40)
            elif itype in ["cut_food"]:
                core.resources_module.food_stock = 0.0
                for c in core.population_module.citizens.values():
                    c.hunger = 0.05
            elif itype in ["cut_hospital_capacity"]:
                for b in core.buildings.values():
                    if b.type == "Healthcare":
                        b.status = "abandoned"
            core.advance_tick(req.ticks)
        except Exception:
            pass

    # 3. Retrieve the fresh trace graph and vitals snapshot
    trace = global_causal_engine.get_causal_trace(id)
    vitals_hist = global_causal_engine.get_vitals_history(id, limit=60)
    latest_vitals = vitals_hist[-1] if vitals_hist else None

    if latest_vitals is None and "vitals" in step_res:
        try:
            latest_vitals = CausalVitalsSnapshot(**step_res["vitals"])
        except Exception:
            pass

    if trace is None and "trace_graph" in step_res:
        try:
            trace = CausalTraceGraph(**step_res["trace_graph"])
        except Exception:
            pass

    return InterventionSimulationResponse(
        success=True,
        world_id=id,
        intervention_type=req.intervention_type,
        ticks=req.ticks,
        message=f"Applied intervention '{req.intervention_type}' across {req.ticks} ticks: {evt_desc}",
        vitals=latest_vitals,
        trace_graph=trace
    )
