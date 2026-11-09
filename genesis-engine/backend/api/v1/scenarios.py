import json
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query, status
from db.database import get_db_connection
from engine.models_v1 import (
    SnapshotCreateRequest, SnapshotRecord, ScenarioCreateRequest,
    ScenarioRunRequest, ScenarioResultResponse, ScenarioCompareResponse,
    ExperimentCreateRequest, ExperimentResultResponse
)

router = APIRouter(tags=["Future Simulator & Scenarios"])


@router.post("/worlds/{id}/snapshots", response_model=SnapshotRecord, status_code=status.HTTP_201_CREATED)
async def create_snapshot(id: str, req: SnapshotCreateRequest):
    conn = get_db_connection()
    world = conn.execute("SELECT * FROM worlds WHERE id = ?", (id,)).fetchone()
    if not world:
        conn.close()
        raise HTTPException(status_code=404, detail=f"World '{id}' not found")

    econ = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (id,)).fetchone()
    buildings = conn.execute("SELECT * FROM buildings WHERE world_id = ?", (id,)).fetchall()
    policies = conn.execute("SELECT * FROM policies WHERE world_id = ?", (id,)).fetchall()

    snap_id = f"snap_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    state_dict = {
        "world": dict(world),
        "economy": dict(econ) if econ else {},
        "buildings": [dict(b) for b in buildings],
        "policies": [dict(p) for p in policies]
    }

    with conn:
        conn.execute("""
        INSERT INTO snapshots (id, world_id, name, tick, year, day, state_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (snap_id, id, req.name, world["tick"], world["year"], world["day"], json.dumps(state_dict), now))

    conn.close()

    return SnapshotRecord(
        id=snap_id,
        world_id=id,
        name=req.name,
        tick=world["tick"],
        year=world["year"],
        day=world["day"],
        created_at=now
    )


@router.get("/worlds/{id}/snapshots", response_model=List[SnapshotRecord])
async def list_snapshots(id: str):
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM snapshots WHERE world_id = ? ORDER BY tick DESC", (id,)).fetchall()
    conn.close()

    return [
        SnapshotRecord(
            id=r["id"],
            world_id=r["world_id"],
            name=r["name"],
            tick=r["tick"],
            year=r["year"],
            day=r["day"],
            created_at=r["created_at"]
        )
        for r in rows
    ]


@router.post("/scenarios", response_model=ScenarioResultResponse, status_code=status.HTTP_201_CREATED)
async def create_scenario(req: ScenarioCreateRequest):
    conn = get_db_connection()
    snap = conn.execute("SELECT * FROM snapshots WHERE id = ?", (req.snapshot_id,)).fetchone()
    if not snap:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Snapshot '{req.snapshot_id}' not found")

    # Check GRC credit balance
    prog = conn.execute("SELECT grc_balance FROM progression WHERE world_id = ?", (req.world_id,)).fetchone()
    credit_cost = 150.0 + (req.simulation_horizon_ticks * 1.5)

    if not prog or prog["grc_balance"] < credit_cost:
        conn.close()
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient Genesis Research Credits (GRC). Required: {credit_cost} GRC, Available: {prog['grc_balance'] if prog else 0} GRC"
        )

    scenario_id = f"scen_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()
    overrides = req.policy_overrides or {}

    # Deduct credits
    with conn:
        conn.execute("UPDATE progression SET grc_balance = grc_balance - ? WHERE world_id = ?", (credit_cost, req.world_id))
        conn.execute("UPDATE economy_resources SET genesis_research_credits = genesis_research_credits - ? WHERE world_id = ?", (credit_cost, req.world_id))

        conn.execute("""
        INSERT INTO scenarios (
            id, world_id, snapshot_id, name, status, credit_cost,
            simulation_horizon_ticks, current_tick, policy_overrides,
            results_summary, history_json, created_at
        ) VALUES (?, ?, ?, ?, 'queued', ?, ?, ?, ?, '{}', '[]', ?)
        """, (
            scenario_id, req.world_id, req.snapshot_id, req.name,
            credit_cost, req.simulation_horizon_ticks, snap["tick"],
            json.dumps(overrides), now
        ))

    conn.close()

    # Automatically run projected scenario
    return await run_scenario(scenario_id, ScenarioRunRequest(ticks=req.simulation_horizon_ticks))


@router.post("/scenarios/{id}/run", response_model=ScenarioResultResponse)
async def run_scenario(id: str, req: ScenarioRunRequest):
    conn = get_db_connection()
    scen = conn.execute("SELECT * FROM scenarios WHERE id = ?", (id,)).fetchone()
    if not scen:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Scenario '{id}' not found")

    snap = conn.execute("SELECT * FROM snapshots WHERE id = ?", (scen["snapshot_id"],)).fetchone()
    snap_state = json.loads(snap["state_json"])
    base_econ = snap_state.get("economy", {})

    ticks = req.ticks or scen["simulation_horizon_ticks"]
    overrides = json.loads(scen["policy_overrides"] or "{}")

    # Counterfactual simulation projection
    scaffolding_active = overrides.get("cognitive_scaffolding", True)
    ubi_active = overrides.get("universal_basic_income", True)

    history = []
    base_pop = base_econ.get("population", 1200000)
    base_gdp = base_econ.get("gdp", 45000000000.0)
    base_gini = base_econ.get("gini_coefficient", 0.28)
    base_stability = base_econ.get("civic_stability", 0.77)
    base_reasoning = 0.79
    base_dependency = 0.18

    start_tick = scen["current_tick"]
    start_year = snap["year"]

    for t in range(1, ticks + 1):
        tick_num = start_tick + t
        year_num = start_year + (t * 0.1)

        # Policy modifiers
        if scaffolding_active:
            base_reasoning = min(0.95, base_reasoning + 0.002)
            base_dependency = min(0.60, base_dependency + 0.005)
        else:
            base_reasoning = max(0.15, base_reasoning - 0.012)
            base_dependency = min(1.0, base_dependency + 0.02)

        if ubi_active:
            base_gini = max(0.18, base_gini - 0.002)
            base_stability = min(0.95, base_stability + 0.003)

        base_pop = int(base_pop * 1.002)
        base_gdp = round(base_gdp * 1.004, 2)
        innovation = round(0.6 * base_reasoning + 0.4 * (1.0 - base_dependency), 3)

        history.append({
            "tick": tick_num,
            "year": round(year_num, 1),
            "population": base_pop,
            "gdp": base_gdp,
            "gini": round(base_gini, 3),
            "civic_stability": round(base_stability, 3),
            "avg_reasoning": round(base_reasoning, 3),
            "avg_ai_dependency": round(base_dependency, 3),
            "macro_innovation": innovation
        })

    final_point = history[-1]
    summary = {
        "final_year": final_point["year"],
        "projected_population": final_point["population"],
        "projected_gdp": final_point["gdp"],
        "projected_gini": final_point["gini"],
        "projected_stability": final_point["civic_stability"],
        "projected_innovation": final_point["macro_innovation"],
        "reasoning_retained_pct": round((final_point["avg_reasoning"] / 0.79) * 100, 1),
        "dependency_risk": "Low" if final_point["avg_ai_dependency"] < 0.4 else "Critical"
    }

    with conn:
        conn.execute("""
        UPDATE scenarios SET
            status = 'completed',
            current_tick = ?,
            results_summary = ?,
            history_json = ?
        WHERE id = ?
        """, (start_tick + ticks, json.dumps(summary), json.dumps(history), id))

    conn.close()

    return ScenarioResultResponse(
        id=id,
        scenario_id=id,
        world_id=scen["world_id"],
        name=scen["name"],
        status="completed",
        credit_cost=scen["credit_cost"],
        ticks_projected=ticks,
        policy_overrides=overrides,
        results_summary=summary,
        history=history
    )


@router.get("/scenarios/{id}/results", response_model=ScenarioResultResponse)
async def get_scenario_results(id: str):
    conn = get_db_connection()
    scen = conn.execute("SELECT * FROM scenarios WHERE id = ?", (id,)).fetchone()
    conn.close()

    if not scen:
        raise HTTPException(status_code=404, detail=f"Scenario '{id}' not found")

    return ScenarioResultResponse(
        id=scen["id"],
        scenario_id=scen["id"],
        world_id=scen["world_id"],
        name=scen["name"],
        status=scen["status"],
        credit_cost=scen["credit_cost"],
        ticks_projected=scen["simulation_horizon_ticks"],
        policy_overrides=json.loads(scen["policy_overrides"] or "{}"),
        results_summary=json.loads(scen["results_summary"] or "{}"),
        history=json.loads(scen["history_json"] or "[]")
    )


@router.get("/scenarios/compare", response_model=ScenarioCompareResponse)
async def compare_scenarios(
    scenario_a: str = Query(..., description="First scenario ID (or baseline)"),
    scenario_b: str = Query(..., description="Second scenario ID")
):
    conn = get_db_connection()
    scen_a = conn.execute("SELECT * FROM scenarios WHERE id = ?", (scenario_a,)).fetchone()
    scen_b = conn.execute("SELECT * FROM scenarios WHERE id = ?", (scenario_b,)).fetchone()
    conn.close()

    if not scen_a or not scen_b:
        raise HTTPException(status_code=404, detail="One or both scenario IDs not found")

    hist_a = json.loads(scen_a["history_json"] or "[]")
    hist_b = json.loads(scen_b["history_json"] or "[]")
    sum_a = json.loads(scen_a["results_summary"] or "{}")
    sum_b = json.loads(scen_b["results_summary"] or "{}")

    divergence = {
        "gini_delta": round((sum_b.get("projected_gini", 0) - sum_a.get("projected_gini", 0)), 4),
        "stability_delta": round((sum_b.get("projected_stability", 0) - sum_a.get("projected_stability", 0)), 4),
        "innovation_delta": round((sum_b.get("projected_innovation", 0) - sum_a.get("projected_innovation", 0)), 4),
        "gdp_delta": round((sum_b.get("projected_gdp", 0) - sum_a.get("projected_gdp", 0)), 2),
        "population_delta": sum_b.get("projected_population", 0) - sum_a.get("projected_population", 0)
    }

    return ScenarioCompareResponse(
        baseline_id=scen_a["id"],
        baseline_name=scen_a["name"],
        scenario_id=scen_b["id"],
        scenario_name=scen_b["name"],
        divergence_summary=divergence,
        baseline_trajectory=hist_a,
        scenario_trajectory=hist_b
    )


@router.post("/experiments", response_model=ExperimentResultResponse, status_code=status.HTTP_201_CREATED)
async def create_experiment(req: ExperimentCreateRequest):
    conn = get_db_connection()
    prog = conn.execute("SELECT grc_balance FROM progression WHERE world_id = ?", (req.world_id,)).fetchone()
    if not prog or prog["grc_balance"] < req.credit_cost:
        conn.close()
        raise HTTPException(
            status_code=402,
            detail=f"Insufficient GRC credits. Required: {req.credit_cost} GRC, Available: {prog['grc_balance'] if prog else 0} GRC"
        )

    exp_id = f"exp_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    baseline = {"avg_reasoning": 0.79, "avg_ai_dependency": 0.18, "macro_innovation": 0.84}
    outcome = {"avg_reasoning": 0.82, "avg_ai_dependency": 0.35, "macro_innovation": 0.88}
    findings = f"Empirical confirmation: Enforcing cognitive scaffolding during {req.variable_tested} mitigates cognitive atrophy by 82% compared to unchecked AI delegation."

    with conn:
        conn.execute("UPDATE progression SET grc_balance = grc_balance - ? WHERE world_id = ?", (req.credit_cost, req.world_id))
        conn.execute("""
        INSERT INTO experiments (
            id, world_id, title, research_question, variable_tested, credit_cost,
            status, baseline_metrics, outcome_metrics, findings, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?)
        """, (
            exp_id, req.world_id, req.title, req.research_question, req.variable_tested,
            req.credit_cost, json.dumps(baseline), json.dumps(outcome), findings, now
        ))

    conn.close()

    return ExperimentResultResponse(
        id=exp_id,
        experiment_id=exp_id,
        world_id=req.world_id,
        title=req.title,
        research_question=req.research_question,
        variable_tested=req.variable_tested,
        status="completed",
        credit_cost=req.credit_cost,
        baseline_metrics=baseline,
        outcome_metrics=outcome,
        findings=findings,
        created_at=now
    )


@router.get("/experiments/{id}/results", response_model=ExperimentResultResponse)
async def get_experiment_results(id: str):
    conn = get_db_connection()
    r = conn.execute("SELECT * FROM experiments WHERE id = ?", (id,)).fetchone()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail=f"Experiment '{id}' not found")

    return ExperimentResultResponse(
        id=r["id"],
        experiment_id=r["id"],
        world_id=r["world_id"],
        title=r["title"],
        research_question=r["research_question"],
        variable_tested=r["variable_tested"],
        status=r["status"],
        credit_cost=r["credit_cost"],
        baseline_metrics=json.loads(r["baseline_metrics"] or "{}"),
        outcome_metrics=json.loads(r["outcome_metrics"] or "{}"),
        findings=r["findings"],
        created_at=r["created_at"]
    )
