"""
================================================================================
GENESIS Engine: Cities: Skylines II Simulation Depth Test Suite
================================================================================
Comprehensive verification of:
- Graph Road Network & A* Routing with BPR Congestion
- Continuous 2D Urban Diffusion Fields
- Citizen Agent Daily Schedules & Commute Friction
- Multi-Channel Info Views (Electricity, Water, Traffic, Pollution, Land Value)
- Dynamic RCI Demand & Economic Drivers
- Districts & Localized Policies
- Municipal Budget & Supply Chain Commodity Ledger
- Emergent Disasters & Response Protocols
"""

import pytest
from fastapi.testclient import TestClient
from main import app
from engine.simulation import seed_aurora_prime_if_not_exists
from engine.cs2_simulation import RoadGraph, UrbanDiffusionFields, CitizenAgent
import db.database

client = TestClient(app)


@pytest.fixture(autouse=True, scope="module")
def setup_cs2_db(tmp_path_factory):
    test_db = str(tmp_path_factory.mktemp("cs2_db") / "test_cs2.db")
    db.database.DB_PATH = test_db
    db.database.init_db()
    seed_aurora_prime_if_not_exists()


def test_road_network_and_astar_routing():
    graph = RoadGraph()
    # Add triangular road triangle
    graph.add_node("A", 0.0, 0.0)
    graph.add_node("B", 10.0, 0.0)
    graph.add_node("C", 10.0, 10.0)

    # Fast direct path A -> B -> C
    graph.add_segment("seg_AB", "A", "B", speed_limit=80.0, capacity=1000, current_traffic=100)
    graph.add_segment("seg_BC", "B", "C", speed_limit=80.0, capacity=1000, current_traffic=100)

    # Slow bypass A -> C
    graph.add_segment("seg_AC", "A", "C", speed_limit=20.0, capacity=200, current_traffic=190)

    path, cost = graph.find_shortest_path("A", "C")
    assert path == ["A", "B", "C"]
    assert cost > 0.0


def test_urban_diffusion_fields():
    fields = UrbanDiffusionFields(size=16)
    assert fields.air_pollution[5][5] == 0.0

    # Inject heavy industrial smokestack pollution
    fields.apply_point_source(fields.air_pollution, 5.0, 5.0, intensity=80.0, radius=3.0)
    assert fields.air_pollution[5][5] == 80.0
    assert fields.air_pollution[6][5] > 0.0

    # Diffuse with eastward wind
    fields.step(wind_vector=(0.5, 0.0))
    assert fields.air_pollution[7][5] > 0.0


def test_citizen_agent_daily_schedule():
    agent = CitizenAgent("cit_001", "Dr. Vance", age=34.0, wealth=120.0, home_pos=(5.0, 5.0), work_pos=(20.0, 20.0))
    assert agent.schedule_state == "home"

    # Morning rush hour (07:00)
    agent.advance_schedule(hour=7, traffic_congestion_factor=1.5)
    assert agent.schedule_state == "commuting_work"
    assert agent.commute_time_minutes > 18.0

    # Working hours (10:00)
    agent.advance_schedule(hour=10)
    assert agent.schedule_state == "at_work"
    assert agent.current_pos == [20.0, 20.0]

    # Nighttime (22:00)
    agent.advance_schedule(hour=22)
    assert agent.schedule_state == "home"
    assert agent.current_pos == [5.0, 5.0]


def test_cs2_infoviews_and_rci_endpoints():
    # 1. Info Views
    info_res = client.get("/api/v1/worlds/aurora-prime/cs2/infoviews")
    assert info_res.status_code == 200
    info_data = info_res.json()
    assert "electricity" in info_data
    assert "water" in info_data
    assert "traffic" in info_data
    assert "pollution" in info_data
    assert "land_value" in info_data
    assert "rci_demand" in info_data

    # 2. Detailed RCI demand
    rci_res = client.get("/api/v1/worlds/aurora-prime/cs2/rci")
    assert rci_res.status_code == 200
    rci_data = rci_res.json()
    assert 0 <= rci_data["residential"] <= 100
    assert 0 <= rci_data["commercial"] <= 100
    assert 0 <= rci_data["industrial"] <= 100
    assert 0 <= rci_data["office"] <= 100
    assert "factors" in rci_data


def test_cs2_citizens_sample_and_traffic():
    # 1. Sample Citizens Dossiers
    cit_res = client.get("/api/v1/worlds/aurora-prime/cs2/citizens/sample?limit=15")
    assert cit_res.status_code == 200
    cits = cit_res.json()
    assert len(cits) == 15
    first_cit = cits[0]
    assert "name" in first_cit
    assert "life_stage" in first_cit
    assert "schedule_state" in first_cit
    assert "commute_duration_mins" in first_cit
    assert "transport_mode" in first_cit

    # 2. Road Network and Transit Lines
    traf_res = client.get("/api/v1/worlds/aurora-prime/cs2/traffic")
    assert traf_res.status_code == 200
    traf = traf_res.json()
    assert traf["total_nodes"] > 0
    assert traf["total_segments"] > 0
    assert len(traf["transit_lines"]) >= 2


def test_cs2_districts_budget_and_events():
    # 1. Districts
    dist_res = client.get("/api/v1/worlds/aurora-prime/cs2/districts")
    assert dist_res.status_code == 200
    districts = dist_res.json()
    assert len(districts) >= 3

    # Create new district
    new_dist = client.post("/api/v1/worlds/aurora-prime/cs2/districts", json={
        "name": "Solar Research Heights",
        "color": "#a855f7",
        "boundaries": [[2, 2], [8, 2], [8, 8], [2, 8]],
        "residential_tax": 0.11,
        "policies": ["Clean Energy Mandate"]
    })
    assert new_dist.status_code == 201

    # 2. Municipal Budget & Supply Chain
    budget_res = client.get("/api/v1/worlds/aurora-prime/cs2/economy/budget")
    assert budget_res.status_code == 200
    budget = budget_res.json()
    assert "monthly_summary" in budget
    assert "tax_revenues" in budget
    assert "service_budgets" in budget

    supply_res = client.get("/api/v1/worlds/aurora-prime/cs2/supplychain")
    assert supply_res.status_code == 200
    assert len(supply_res.json()["commodities"]) >= 5

    # 3. Active Disasters and Crisis Response
    events_res = client.get("/api/v1/worlds/aurora-prime/cs2/events/active")
    assert events_res.status_code == 200
    events = events_res.json()
    assert len(events) >= 1
    evt_id = events[0]["id"]

    resp_res = client.post(f"/api/v1/worlds/aurora-prime/cs2/events/{evt_id}/respond", json={
        "response_id": "resp_battery"
    })
    assert resp_res.status_code == 200
    assert resp_res.json()["status"] == "resolved"

    # 4. Milestones
    m_res = client.get("/api/v1/worlds/aurora-prime/cs2/milestones")
    assert m_res.status_code == 200
    assert m_res.json()["current_milestone"] >= 4
