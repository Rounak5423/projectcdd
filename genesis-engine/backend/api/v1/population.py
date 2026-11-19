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
    from engine.modules.core import _SIMULATION_CORES

    # 1. If world is currently active in authoritative simulation engine, read live authoritative state
    if id in _SIMULATION_CORES:
        sim = _SIMULATION_CORES[id]
        pop_mod = sim.population_module
        living_cits = pop_mod.get_living_citizens()
        total_pop = len(living_cits)
        avg_health = pop_mod.get_average_health()
        avg_happiness = pop_mod.get_average_happiness()
        avg_edu = pop_mod.get_average_education()
        b_rate = pop_mod.get_annual_birth_rate()
        d_rate = pop_mod.get_annual_death_rate()
        m_rate = pop_mod.get_annual_net_migration_rate()
        growth_rate = round(b_rate - d_rate + m_rate, 4)
        natural_growth = round(b_rate - d_rate, 4)
        cohorts = pop_mod.get_age_cohorts()
        accounting = pop_mod.last_step_accounting
        deaths_by_cause = dict(pop_mod.deaths_by_cause)
        infant_mortality = round(pop_mod.cumulative_infant_deaths / max(1, pop_mod.cumulative_births), 4)

        working_age = [c for c in living_cits if 18.0 <= c.age < 65.0]
        employed = sum(1 for c in working_age if c.employed == 1)
        emp_rate = round(float(employed) / max(1, len(working_age)), 3)

        breakdown: Dict[str, int] = {}
        for c in living_cits:
            breakdown[c.occupation] = breakdown.get(c.occupation, 0) + 1

        # Check if macro population in DB is higher (e.g. metropolitan scaling)
        conn = get_db_connection()
        econ_row = conn.execute("SELECT population, population_growth_rate FROM economy_resources WHERE world_id = ?", (id,)).fetchone()
        conn.close()
        macro_pop = int(econ_row["population"]) if econ_row and econ_row["population"] else total_pop
        reported_pop = max(total_pop, macro_pop)

        return PopulationOverview(
            world_id=id,
            total_population=reported_pop,
            growth_rate=growth_rate,
            happiness=avg_happiness,
            health=avg_health,
            education=avg_edu,
            employment_rate=emp_rate,
            birth_rate=round(b_rate, 4),
            death_rate=round(d_rate, 4),
            migration_rate=round(m_rate, 4),
            demographics_breakdown=breakdown,
            demographic_accounting=accounting,
            age_cohorts=cohorts,
            deaths_by_cause=deaths_by_cause,
            infant_mortality_rate=infant_mortality,
            natural_growth_rate=natural_growth,
            crude_birth_rate=round(b_rate * 1000.0, 2),
            crude_death_rate=round(d_rate * 1000.0, 2),
            net_migration_rate=round(m_rate * 1000.0, 2)
        )

    # 2. Otherwise hydrate directly from database
    conn = get_db_connection()
    econ = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (id,)).fetchone()
    if not econ:
        conn.close()
        raise HTTPException(status_code=404, detail=f"World '{id}' not found")

    living_stats = conn.execute(
        "SELECT COUNT(*) as living_count, AVG(health) as avg_health, AVG(education_level) as avg_edu, AVG(wellbeing) as avg_wellbeing FROM citizens WHERE world_id = ? AND is_alive = 1",
        (id,)
    ).fetchone()

    age_rows = conn.execute("SELECT age FROM citizens WHERE world_id = ? AND is_alive = 1", (id,)).fetchall()
    cohorts = {"Infant": 0, "Child": 0, "Youth": 0, "Young Adult": 0, "Prime Adult": 0, "Mature Adult": 0, "Senior": 0, "Elder": 0}
    for ar in age_rows:
        age_val = float(ar["age"])
        if age_val < 2.0:
            cohorts["Infant"] += 1
        elif age_val < 13.0:
            cohorts["Child"] += 1
        elif age_val < 18.0:
            cohorts["Youth"] += 1
        elif age_val < 25.0:
            cohorts["Young Adult"] += 1
        elif age_val < 55.0:
            cohorts["Prime Adult"] += 1
        elif age_val < 65.0:
            cohorts["Mature Adult"] += 1
        elif age_val < 80.0:
            cohorts["Senior"] += 1
        else:
            cohorts["Elder"] += 1

    # Demographic breakdown by occupation
    rows = conn.execute("SELECT occupation, COUNT(*) as count FROM citizens WHERE world_id = ? AND is_alive = 1 GROUP BY occupation", (id,)).fetchall()
    conn.close()

    breakdown = {r["occupation"]: r["count"] for r in rows}
    if not breakdown:
        breakdown = {"Scholar": 25, "Engineer": 25, "Farmer": 25, "Builder": 25}

    macro_pop = int(econ["population"]) if econ and econ["population"] is not None else 0
    agent_pop = int(living_stats["living_count"]) if living_stats and living_stats["living_count"] is not None else 0
    actual_pop = max(agent_pop, macro_pop)
    avg_health = round(float(living_stats["avg_health"]), 3) if living_stats and living_stats["avg_health"] is not None else 0.88
    avg_edu = round(float(living_stats["avg_edu"]), 3) if living_stats and living_stats["avg_edu"] is not None else 0.82
    avg_happiness = round(float(living_stats["avg_wellbeing"]), 3) if living_stats and living_stats["avg_wellbeing"] is not None else float(econ["happiness"] or 0.85)

    return PopulationOverview(
        world_id=id,
        total_population=actual_pop,
        growth_rate=float(econ["population_growth_rate"] or 0.024),
        happiness=avg_happiness,
        health=avg_health,
        education=avg_edu,
        employment_rate=float(econ["employment_rate"] or 0.85),
        birth_rate=0.020,
        death_rate=0.008,
        migration_rate=0.005,
        demographics_breakdown=breakdown,
        age_cohorts=cohorts,
        infant_mortality_rate=0.024,
        natural_growth_rate=0.012,
        crude_birth_rate=20.0,
        crude_death_rate=8.0,
        net_migration_rate=5.0
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
        economic_health_score=econ_health,
        happiness=round(econ["happiness"], 3) if "happiness" in econ.keys() and econ["happiness"] is not None else 0.78
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

