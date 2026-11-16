"""
Causal Coupling API Endpoints.
Provides read-only causal diagnostics, vital signs time-series, and causal dependency graphs.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from db.database import get_db_connection
from engine.causal import global_causal_engine
from engine.causal.state import CausalVitalsSnapshot, CausalTraceGraph, DeathsByCause, UnmetNeeds

router = APIRouter(tags=["Causal Simulation"])


def resolve_world_id(world_id: str) -> str:
    if world_id in ["civ-aurora-01", "civ-default", "prime", "default"]:
        return "aurora-prime"
    return world_id


class VitalsTimeSeriesResponse(BaseModel):
    world_id: str
    count: int
    data: List[CausalVitalsSnapshot]


class InterventionSimulationRequest(BaseModel):
    intervention_type: str = Field(..., description="e.g. 'cut_food', 'cut_hospital_capacity', 'emergency_food_relief', 'expand_hospital'")
    ticks: int = Field(default=5, ge=1, le=50)


@router.get("/worlds/{id}/causal-trace", response_model=CausalTraceGraph)
def get_world_causal_trace(id: str):
    """
    Returns the per-tick causal dependency graph, contributing factors,
    and link strengths for deaths, hospital pressure, and civil protests.
    """
    id = resolve_world_id(id)
    trace = global_causal_engine.get_causal_trace(id)
    if trace:
        return trace

    # Fallback to query recent causal_vitals from database if in-memory cache was cold
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
def get_world_vitals_timeseries(
    id: str,
    limit: int = Query(default=60, ge=1, le=300, description="Max history snapshots to return")
):
    """
    Returns high-resolution time-series of vital statistics:
    births, deaths by cause (aging, starvation, dehydration, hospital overload, pollution),
    hospital bed occupancy, unmet basic needs, and protest intensity.
    """
    id = resolve_world_id(id)
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

    if not rows:
        # Automatically step 1 tick to initialize causal vitals for new or cold world
        try:
            from engine.simulation import advance_world_simulation
            step_res = advance_world_simulation(id, ticks=1)
            if "vitals" in step_res:
                return VitalsTimeSeriesResponse(
                    world_id=id,
                    count=1,
                    data=[CausalVitalsSnapshot(**step_res["vitals"])]
                )
        except Exception:
            pass

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
