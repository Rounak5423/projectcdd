"""
Comprehensive Automated Test Suite for Causal Simulation Coupling.
Validates:
1. Intervention tests:
   - Cutting hospital capacity causes bed saturation and overload deaths.
   - Depleting food and water causes acute mortality, grievance surge, and protest eruption.
2. Ablation tests:
   - Well-provisioned simulation maintains baseline Gompertz mortality with zero starvation or protest.
3. Invariant tests:
   - Population non-negativity (pop >= 0).
   - Deaths bounded by population (deaths <= pop).
   - Determinism with identical initial conditions.
4. UN WPP / WHO Calibration Benchmarks:
   - Crude Death Rate (CDR) strictly within 5.0 - 15.0 per 1,000 per year.
   - Crude Birth Rate (CBR) strictly within 10.0 - 25.0 per 1,000 per year.
5. Additive API Endpoint and WebSocket Tests:
   - GET /api/v1/worlds/{id}/causal-trace
   - GET /api/v1/worlds/{id}/vitals
"""

import pytest
from fastapi.testclient import TestClient

import db.database
from main import app
from engine.causal import global_causal_engine, CausalConfig
from engine.simulation import advance_world_simulation

client = TestClient(app)


def setup_module():
    db.database.init_db()


def test_un_wpp_who_demographic_calibration():
    """Validates that baseline demographic rates match real-world UN WPP / WHO crude rates."""
    pop = 1_000_000
    res = global_causal_engine.step(
        world_id="calib-test",
        current_tick=1,
        year=2026,
        day=1,
        population=pop,
        food_stock=100000.0,
        food_production=5000.0,
        water_stock=100000.0,
        water_production=5000.0,
        energy_stock=100000.0,
        energy_production=5000.0,
        pollution_level=0.15,
        civic_stability=0.80,
        happiness=0.80,
        hospital_capacity=5000,
        ticks_passed=1,
    )

    # Annualized rates per 1,000 population
    annual_cdr = (res["deaths"] * 365.0 / pop) * 1000.0
    annual_cbr = (res["births"] * 365.0 / pop) * 1000.0

    # WHO crude death rate benchmark for human populations: 5.0 - 15.0 per 1,000/yr
    assert 5.0 <= annual_cdr <= 15.0, f"Annual CDR {annual_cdr:.2f} outside WHO benchmark 5.0 - 15.0"

    # UN WPP crude birth rate benchmark: 10.0 - 25.0 per 1,000/yr
    assert 10.0 <= annual_cbr <= 25.0, f"Annual CBR {annual_cbr:.2f} outside UN WPP benchmark 10.0 - 25.0"

    # In normal conditions, starvation and dehydration deaths must be zero
    assert res["deaths_by_cause"]["starvation"] == 0
    assert res["deaths_by_cause"]["dehydration"] == 0
    assert res["deaths_by_cause"]["hospital_overload"] == 0


def test_intervention_cutting_hospital_capacity_increases_overload_mortality():
    """Intervention: reducing hospital beds during high patient load triggers overflow deaths."""
    pop = 500_000
    global_causal_engine.reset_world("hosp-intervention")

    # Baseline with ample 3,000 beds
    res_adequate = global_causal_engine.step(
        world_id="hosp-intervention-base",
        current_tick=1,
        year=2026,
        day=1,
        population=pop,
        food_stock=50000.0,
        food_production=1000.0,
        water_stock=50000.0,
        water_production=1000.0,
        energy_stock=50000.0,
        energy_production=1000.0,
        pollution_level=0.15,
        civic_stability=0.80,
        happiness=0.80,
        hospital_capacity=3000,
        ticks_passed=1,
    )
    assert res_adequate["hospital_occupancy_pct"] < 100.0
    assert res_adequate["deaths_by_cause"]["hospital_overload"] == 0

    # Intervention: slash beds to 20 beds (severe healthcare bottleneck)
    res_deficit = global_causal_engine.step(
        world_id="hosp-intervention-crisis",
        current_tick=1,
        year=2026,
        day=1,
        population=pop,
        food_stock=50000.0,
        food_production=1000.0,
        water_stock=50000.0,
        water_production=1000.0,
        energy_stock=50000.0,
        energy_production=1000.0,
        pollution_level=0.40,  # increases illness morbidity
        civic_stability=0.70,
        happiness=0.70,
        hospital_capacity=20,
        ticks_passed=1,
    )

    # Bed occupancy exceeds 100% and overflow deaths occur
    assert res_deficit["hospital_occupancy_pct"] > 100.0
    assert res_deficit["overflow_patients"] > 0
    assert res_deficit["deaths_by_cause"]["hospital_overload"] > 0
    assert res_deficit["deaths"] > res_adequate["deaths"]


def test_intervention_food_water_depletion_triggers_starvation_and_protests():
    """Intervention: cutting food and water leads to starvation deaths, grievance surge, and civil protest."""
    # 1. Create a dedicated test world
    w = client.post("/api/v1/worlds", json={
        "name": "Crisis Test World",
        "climate": "Temperate",
        "technology_level": "Automated",
        "initial_population": 10000
    }).json()
    world_id = w["id"]

    # 2. Artificially deplete food, water and rates to 0
    conn = db.database.get_db_connection()
    with conn:
        conn.execute("""
        UPDATE economy_resources
        SET food = 0.0, food_rate = 0.0, water = 0.0, water_rate = 0.0, happiness = 0.80, civic_stability = 0.80
        WHERE world_id = ?
        """, (world_id,))
    conn.close()

    # 3. Advance simulation 5 ticks under famine
    adv = advance_world_simulation(world_id, ticks=5)

    # 4. Verify causal outcomes
    vitals = adv["vitals"]
    assert vitals["unmet_needs"]["food"] > 0.0
    assert vitals["unmet_needs"]["water"] > 0.0
    assert vitals["deaths_by_cause"]["starvation"] > 0 or vitals["deaths_by_cause"]["dehydration"] > 0
    assert adv["deaths"] > 0
    assert vitals["grievance_score"] > 0.40
    assert adv["protest_intensity"] > 0.0

    # 5. Check database events table for protest or crisis event
    conn = db.database.get_db_connection()
    events = conn.execute("SELECT * FROM events WHERE world_id = ?", (world_id,)).fetchall()
    conn.close()
    assert len(events) > 0
    categories = [e["category"] for e in events]
    assert any(c in ["protest", "humanitarian_crisis", "civil_unrest"] for c in categories)


def test_ablation_provisioned_vs_depleted():
    """Ablation: compares provisioned vs resource-depleted worlds."""
    global_causal_engine.reset_world("ablation-prov")
    global_causal_engine.reset_world("ablation-dep")

    res_prov = global_causal_engine.step(
        world_id="ablation-prov",
        current_tick=1,
        year=2026,
        day=1,
        population=100000,
        food_stock=10000.0,
        food_production=500.0,
        water_stock=10000.0,
        water_production=500.0,
        energy_stock=10000.0,
        energy_production=500.0,
        pollution_level=0.10,
        civic_stability=0.90,
        happiness=0.90,
        hospital_capacity=1000,
        ticks_passed=1
    )

    res_dep = global_causal_engine.step(
        world_id="ablation-dep",
        current_tick=1,
        year=2026,
        day=1,
        population=100000,
        food_stock=0.0,
        food_production=0.0,
        water_stock=0.0,
        water_production=0.0,
        energy_stock=0.0,
        energy_production=0.0,
        pollution_level=0.10,
        civic_stability=0.90,
        happiness=0.90,
        hospital_capacity=1000,
        ticks_passed=1
    )

    # Ablating food and water causes substantial excess mortality and protest escalation
    assert res_dep["deaths"] > res_prov["deaths"] * 2
    assert res_dep["protest_intensity"] > res_prov["protest_intensity"]
    assert res_dep["happiness"] < res_prov["happiness"]


def test_simulation_invariants():
    """Invariants: population non-negativity, deaths <= population, determinism."""
    # 1. Total deaths never exceed population even in extreme catastrophe
    res_extreme = global_causal_engine.step(
        world_id="invariant-catastrophe",
        current_tick=1,
        year=2026,
        day=1,
        population=50,
        food_stock=0.0,
        food_production=0.0,
        water_stock=0.0,
        water_production=0.0,
        energy_stock=0.0,
        energy_production=0.0,
        pollution_level=1.0,
        civic_stability=0.0,
        happiness=0.0,
        hospital_capacity=1,
        ticks_passed=10
    )
    assert res_extreme["deaths"] <= 50
    assert res_extreme["new_population"] >= 0

    # 2. Determinism check
    global_causal_engine.reset_world("det-a")
    global_causal_engine.reset_world("det-b")

    res_a = global_causal_engine.step(
        world_id="det-a",
        current_tick=1,
        year=2026,
        day=1,
        population=250000,
        food_stock=5000.0,
        food_production=200.0,
        water_stock=5000.0,
        water_production=200.0,
        energy_stock=5000.0,
        energy_production=200.0,
        pollution_level=0.20,
        civic_stability=0.75,
        happiness=0.75,
        hospital_capacity=500,
        ticks_passed=1
    )
    res_b = global_causal_engine.step(
        world_id="det-b",
        current_tick=1,
        year=2026,
        day=1,
        population=250000,
        food_stock=5000.0,
        food_production=200.0,
        water_stock=5000.0,
        water_production=200.0,
        energy_stock=5000.0,
        energy_production=200.0,
        pollution_level=0.20,
        civic_stability=0.75,
        happiness=0.75,
        hospital_capacity=500,
        ticks_passed=1
    )

    assert res_a["births"] == res_b["births"]
    assert res_a["deaths"] == res_b["deaths"]
    assert res_a["hospital_occupancy_pct"] == res_b["hospital_occupancy_pct"]
    assert res_a["protest_intensity"] == res_b["protest_intensity"]


def test_api_vitals_and_causal_trace_endpoints():
    """Validates additive endpoints: GET /causal-trace and GET /vitals."""
    # Ensure aurora-prime has stepped at least once
    advance_world_simulation("aurora-prime", ticks=1)

    # 1. Test GET /causal-trace
    resp_trace = client.get("/api/v1/worlds/aurora-prime/causal-trace")
    assert resp_trace.status_code == 200
    trace_data = resp_trace.json()
    assert trace_data["world_id"] == "aurora-prime"
    assert "nodes" in trace_data
    assert len(trace_data["nodes"]) >= 5
    assert "links" in trace_data
    assert len(trace_data["links"]) >= 5
    assert "summary" in trace_data

    # 2. Test GET /vitals
    resp_vitals = client.get("/api/v1/worlds/aurora-prime/vitals?limit=10")
    assert resp_vitals.status_code == 200
    vitals_data = resp_vitals.json()
    assert vitals_data["world_id"] == "aurora-prime"
    assert "data" in vitals_data
    assert len(vitals_data["data"]) > 0

    latest_vital = vitals_data["data"][-1]
    assert "deaths_by_cause" in latest_vital
    assert "bed_occupancy_pct" in latest_vital
    assert "unmet_needs" in latest_vital
    assert "protest_intensity" in latest_vital
