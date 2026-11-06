from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from db.database import get_db_connection
from engine.models_v1 import (
    PopulationOverview, CitizenRecord, EconomyOverview, ResourceBalances,
    InfrastructureOverview, MetricHistoryPoint
)
from engine.simulation_v1 import format_currency

router = APIRouter(tags=["Population, Economy & Resources"])


@router.get("/worlds/{id}/population", response_model=PopulationOverview)
async def get_population_overview(id: str):
    conn = get_db_connection()
    econ = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (id,)).fetchone()
    if not econ:
        conn.close()
        raise HTTPException(status_code=404, detail=f"World '{id}' not found")

    # Demographic breakdown
    rows = conn.execute("SELECT occupation, COUNT(*) as count FROM citizens WHERE world_id = ? GROUP BY occupation", (id,)).fetchall()
    conn.close()

    breakdown = {r["occupation"]: r["count"] for r in rows}
    if not breakdown:
        breakdown = {"Scholar": 25, "Engineer": 25, "Farmer": 25, "Builder": 25}

    return PopulationOverview(
        world_id=id,
        total_population=econ["population"],
        growth_rate=econ["population_growth_rate"],
        happiness=econ["happiness"],
        health=0.88,
        education=0.82,
        employment_rate=econ["employment_rate"],
        birth_rate=0.032,
        death_rate=0.008,
        migration_rate=0.012,
        demographics_breakdown=breakdown
    )


@router.get("/worlds/{id}/citizens", response_model=List[CitizenRecord])
async def get_citizens(
    id: str,
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    occupation: Optional[str] = None
):
    conn = get_db_connection()
    query = "SELECT * FROM citizens WHERE world_id = ?"
    params: List[Any] = [id]
    if occupation:
        query += " AND occupation = ?"
        params.append(occupation)
    query += " ORDER BY id LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = conn.execute(query, params).fetchall()
    conn.close()

    return [
        CitizenRecord(
            id=r["id"],
            world_id=r["world_id"],
            age=r["age"],
            occupation=r["occupation"],
            wealth=r["wealth"],
            x=r["x"],
            y=r["y"],
            hunger=r["hunger"],
            energy=r["energy"],
            wellbeing=r["wellbeing"],
            education_level=r["education_level"],
            health=r["health"],
            independent_reasoning=r["independent_reasoning"],
            problem_solving=r["problem_solving"],
            critical_evaluation=r["critical_evaluation"],
            creativity=r["creativity"],
            knowledge_retention=r["knowledge_retention"],
            ai_dependency=r["ai_dependency"],
            is_alive=bool(r["is_alive"])
        )
        for r in rows
    ]


@router.get("/worlds/{id}/economy", response_model=EconomyOverview)
async def get_economy(id: str):
    conn = get_db_connection()
    econ = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (id,)).fetchone()
    conn.close()

    if not econ:
        raise HTTPException(status_code=404, detail=f"World '{id}' not found")

    gdp_val = econ["gdp"]
    econ_health = round((econ["employment_rate"] * 0.5) + ((1.0 - econ["gini_coefficient"]) * 0.5), 2)

    return EconomyOverview(
        world_id=id,
        gdp=gdp_val,
        gdp_formatted=format_currency(gdp_val),
        gdp_growth_rate=econ["gdp_growth_rate"],
        employment_rate=econ["employment_rate"],
        average_income=econ["average_income"],
        gini_coefficient=econ["gini_coefficient"],
        civic_stability=econ["civic_stability"],
        tax_rate=econ["tax_rate"],
        economic_health_score=econ_health
    )


@router.get("/worlds/{id}/resources", response_model=ResourceBalances)
async def get_resources(id: str):
    conn = get_db_connection()
    econ = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (id,)).fetchone()
    conn.close()

    if not econ:
        raise HTTPException(status_code=404, detail=f"World '{id}' not found")

    return ResourceBalances(
        world_id=id,
        food=round(econ["food"], 1),
        food_rate=econ["food_rate"],
        water=round(econ["water"], 1),
        water_rate=econ["water_rate"],
        energy=round(econ["energy"], 1),
        energy_rate=econ["energy_rate"],
        materials=round(econ["materials"], 1),
        materials_rate=econ["materials_rate"],
        research_points=round(econ["research_points"], 1),
        research_rate=econ["research_rate"],
        genesis_research_credits=round(econ["genesis_research_credits"], 1),
        happiness=econ["happiness"],
        environmental_health=econ["environmental_health"],
        pollution=econ["pollution"]
    )


@router.get("/worlds/{id}/infrastructure", response_model=InfrastructureOverview)
async def get_infrastructure_stats(id: str):
    conn = get_db_connection()
    buildings = conn.execute("SELECT * FROM buildings WHERE world_id = ?", (id,)).fetchall()
    conn.close()

    total_bld = len(buildings)
    active_bld = sum(1 for b in buildings if b["status"] == "active")
    constructing_bld = sum(1 for b in buildings if b["status"] != "active")
    res_cap = sum(b["capacity"] for b in buildings if b["type"] == "Residential")
    energy_mw = sum(b["level"] * 1.8 for b in buildings)
    maint_cost = sum(b["level"] * 120.0 for b in buildings)

    cats = {}
    for b in buildings:
        t = b["type"]
        cats[t] = cats.get(t, 0) + 1

    return InfrastructureOverview(
        world_id=id,
        total_buildings=total_bld,
        active_buildings=active_bld,
        under_construction=constructing_bld,
        residential_capacity=res_cap,
        total_energy_consumption_mw=round(energy_mw, 1),
        total_maintenance_cost=round(maint_cost, 2),
        buildings_by_category=cats
    )


@router.get("/worlds/{id}/metrics/history", response_model=List[MetricHistoryPoint])
async def get_metrics_history(
    id: str,
    limit: int = Query(default=60, ge=1, le=500)
):
    conn = get_db_connection()
    rows = conn.execute("""
    SELECT * FROM metrics_history WHERE world_id = ? ORDER BY id DESC LIMIT ?
    """, (id, limit)).fetchall()
    conn.close()

    # Return chronological order
    rows = list(reversed(rows))
    return [
        MetricHistoryPoint(
            tick=r["tick"],
            year=r["year"],
            day=r["day"],
            population=r["population"],
            gdp=r["gdp"],
            happiness=r["happiness"],
            employment=r["employment"],
            environment=r["environment"],
            gini=r["gini"],
            civic_stability=r["civic_stability"],
            macro_innovation=r["macro_innovation"],
            avg_ai_dependency=r["avg_ai_dependency"],
            avg_reasoning=r["avg_reasoning"],
            food=r["food"],
            energy=r["energy"],
            materials=r["materials"]
        )
        for r in rows
    ]

