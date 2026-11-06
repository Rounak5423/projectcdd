import os
import pytest
from fastapi.testclient import TestClient
from main import app
from engine.simulation_v1 import seed_aurora_prime_if_not_exists
import db.database

client = TestClient(app)


@pytest.fixture(autouse=True, scope="session")
def setup_test_db(tmp_path_factory):
    test_db = str(tmp_path_factory.mktemp("db") / "test_genesis.db")
    db.database.DB_PATH = test_db
    db.database.init_db()
    seed_aurora_prime_if_not_exists()


def test_aurora_prime_seeded():
    res = client.get("/api/v1/worlds/aurora-prime")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "aurora-prime"
    assert data["name"] == "Aurora Prime"
    assert data["level"] == 4
    assert data["population_count"] == 1248532
    assert data["gdp"] == 48600000000.0
    assert data["year"] == 12


def test_world_management_crud():
    # 1. Create world
    create_res = client.post("/api/v1/worlds", json={
        "name": "New Horizons Test",
        "climate": "Tropical",
        "technology_level": "Automated",
        "initial_population": 500
    })
    assert create_res.status_code == 201
    w_data = create_res.json()
    w_id = w_data["id"]
    assert w_data["name"] == "New Horizons Test"
    assert w_data["population_count"] == 500

    # 2. Get details
    get_res = client.get(f"/api/v1/worlds/{w_id}")
    assert get_res.status_code == 200
    assert get_res.json()["climate"] == "Tropical"

    # 3. Update world
    put_res = client.put(f"/api/v1/worlds/{w_id}", json={
        "name": "New Horizons Renamed",
        "simulation_speed": "2x"
    })
    assert put_res.status_code == 200
    assert put_res.json()["name"] == "New Horizons Renamed"
    assert put_res.json()["simulation_speed"] == "2x"

    # 4. Delete world
    del_res = client.delete(f"/api/v1/worlds/{w_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"


def test_3d_world_map_and_buildings():
    # Map terrain
    map_res = client.get("/api/v1/worlds/aurora-prime/map")
    assert map_res.status_code == 200
    map_data = map_res.json()
    assert "elevation_grid" in map_data
    assert "zones" in map_data
    assert len(map_data["zones"]) > 0

    # Get buildings
    bld_res = client.get("/api/v1/worlds/aurora-prime/buildings")
    assert bld_res.status_code == 200
    buildings = bld_res.json()
    assert len(buildings) >= 10  # Seeded with 10 buildings
    first_bld = buildings[0]
    assert "x" in first_bld and "y" in first_bld and "height" in first_bld
    assert "orientation" in first_bld
    assert first_bld["status"] in ["active", "constructing", "upgrading"]

    # Construct building
    construct_res = client.post("/api/v1/worlds/aurora-prime/buildings", json={
        "name": "Quantum Computing Lab",
        "type": "Research",
        "x": 20.0,
        "y": 20.0,
        "orientation": 45.0
    })
    assert construct_res.status_code == 201
    new_bld = construct_res.json()
    new_bld_id = new_bld["id"]
    assert new_bld["type"] == "Research"

    # Upgrade building
    up_res = client.post(f"/api/v1/buildings/{new_bld_id}/upgrade")
    assert up_res.status_code == 200
    assert up_res.json()["new_level"] == 2

    # Remove building
    del_bld = client.delete(f"/api/v1/buildings/{new_bld_id}")
    assert del_bld.status_code == 200


def test_population_economy_resources():
    # Population overview
    pop_res = client.get("/api/v1/worlds/aurora-prime/population")
    assert pop_res.status_code == 200
    assert pop_res.json()["total_population"] >= 1248532
    assert pop_res.json()["happiness"] >= 0.70

    # Citizen records
    cit_res = client.get("/api/v1/worlds/aurora-prime/citizens?limit=10")
    assert cit_res.status_code == 200
    citizens = cit_res.json()
    assert len(citizens) == 10
    assert "occupation" in citizens[0]
    assert "ai_dependency" in citizens[0]

    # Economy
    econ_res = client.get("/api/v1/worlds/aurora-prime/economy")
    assert econ_res.status_code == 200
    econ = econ_res.json()
    assert econ["gdp"] >= 48000000000.0
    assert "B" in econ["gdp_formatted"]
    assert econ["employment_rate"] == 0.91

    # Resources
    res_res = client.get("/api/v1/worlds/aurora-prime/resources")
    assert res_res.status_code == 200
    res = res_res.json()
    assert res["food"] > 0
    assert res["water"] > 0
    assert res["energy"] > 0
    assert res["materials"] > 0
    assert res["genesis_research_credits"] > 0

    # Infrastructure overview
    infra_res = client.get("/api/v1/worlds/aurora-prime/infrastructure")
    assert infra_res.status_code == 200
    assert infra_res.json()["total_buildings"] >= 10

    # Metrics history
    hist_res = client.get("/api/v1/worlds/aurora-prime/metrics/history?limit=30")
    assert hist_res.status_code == 200
    assert len(hist_res.json()) >= 1


def test_simulation_controls():
    # Advance ticks
    adv_res = client.post("/api/v1/worlds/aurora-prime/simulation/advance", json={"ticks": 2})
    assert adv_res.status_code == 200
    data = adv_res.json()
    assert data["current_tick"] >= 126
    assert "Year" in data["formatted_time"]

    # Status
    stat_res = client.get("/api/v1/worlds/aurora-prime/simulation/status")
    assert stat_res.status_code == 200
    assert "simulation_status" in stat_res.json()


def test_policies_and_technology():
    # Available policies
    policies_res = client.get("/api/v1/policies")
    assert policies_res.status_code == 200
    assert len(policies_res.json()) >= 4

    # Active policies
    active_res = client.get("/api/v1/worlds/aurora-prime/policies")
    assert active_res.status_code == 200
    assert len(active_res.json()) > 0

    # Tech tree
    tech_res = client.get("/api/v1/worlds/aurora-prime/technology")
    assert tech_res.status_code == 200
    techs = tech_res.json()
    assert len(techs) >= 4


def test_gamification_progression():
    # Progression
    prog_res = client.get("/api/v1/worlds/aurora-prime/progression")
    assert prog_res.status_code == 200
    prog = prog_res.json()
    assert prog["level"] in [4, 5]
    assert "Level" in prog["title"]
    assert prog["grc_balance"] > 0.0

    # Missions
    mis_res = client.get("/api/v1/worlds/aurora-prime/missions")
    assert mis_res.status_code == 200
    missions = mis_res.json()
    assert len(missions) == 4

    # Achievements
    ach_res = client.get("/api/v1/worlds/aurora-prime/achievements")
    assert ach_res.status_code == 200
    assert len(ach_res.json()) >= 4

    # Events
    evt_res = client.get("/api/v1/worlds/aurora-prime/events")
    assert evt_res.status_code == 200
    assert len(evt_res.json()) >= 4


def test_future_simulator_and_experiments():
    # Create snapshot
    snap_res = client.post("/api/v1/worlds/aurora-prime/snapshots", json={"name": "Test Milestone Snapshot"})
    assert snap_res.status_code == 201
    snap_id = snap_res.json()["id"]

    # List snapshots
    snaps_list = client.get("/api/v1/worlds/aurora-prime/snapshots")
    assert snaps_list.status_code == 200
    assert len(snaps_list.json()) >= 1

    # Create & run scenario
    scen_res = client.post("/api/v1/scenarios", json={
        "world_id": "aurora-prime",
        "snapshot_id": snap_id,
        "name": "Universal Scaffolding 10-Year Scenario",
        "simulation_horizon_ticks": 20,
        "policy_overrides": {"cognitive_scaffolding": True, "universal_basic_income": True}
    })
    assert scen_res.status_code == 201
    scen_data = scen_res.json()
    assert scen_data["status"] == "completed"
    assert len(scen_data["history"]) == 20

    # Create Experiment
    exp_res = client.post("/api/v1/experiments", json={
        "world_id": "aurora-prime",
        "title": "AI Scaffolding Atrophy Resistance",
        "research_question": "Does mandatory cognitive friction retain independent reasoning above 80%?",
        "variable_tested": "Socratic Friction Coverage",
        "credit_cost": 150.0
    })
    assert exp_res.status_code == 201
    assert exp_res.json()["status"] == "completed"
    assert "findings" in exp_res.json()
