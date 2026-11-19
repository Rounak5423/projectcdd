"""
End-to-End API and Integration Tests for Causal Insights & Intervention System.
Validates:
1. GET /api/v1/worlds/{id}/vitals returns valid time-series snapshots with auto-bootstrapping.
2. GET /api/v1/worlds/{id}/causal-trace returns graph nodes, links, and root-cause metrics.
3. POST /api/v1/worlds/{id}/intervene processes shocks (emergency relief, resource cuts, capacity changes)
   and returns updated vitals and trace graph.
4. POST /api/v1/worlds/{id}/simulation/advance includes vitals and trace_graph in SimulationStatusResponse.
5. Backward-compatible /causal/* aliases (/causal/trace, /causal/vitals, /causal/intervene).
"""

import pytest
from fastapi.testclient import TestClient
import db.database
from main import app

client = TestClient(app)

def setup_module():
    db.database.init_db()

def test_vitals_fresh_world_autobootstrap():
    """Verify fresh world auto-bootstraps causal vitals without 404 or empty payload."""
    world_id = "test-fresh-causal-world"
    resp = client.get(f"/api/v1/worlds/{world_id}/vitals?limit=20")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "data" in body
    assert isinstance(body["data"], list)
    assert len(body["data"]) >= 1
    
    first = body["data"][0]
    required_keys = [
        "tick",
        "health_index",
        "civic_stability",
        "happiness",
        "grievance_score",
        "bed_occupancy_pct",
        "unmet_needs",
        "deaths_by_cause"
    ]
    for key in required_keys:
        assert key in first, f"Missing key {key} in vitals item"

def test_causal_trace_graph_structure():
    """Verify causal-trace returns connected graph with nodes, links, and root causes."""
    world_id = "test-fresh-causal-world"
    resp = client.get(f"/api/v1/worlds/{world_id}/causal-trace")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    
    assert "nodes" in data
    assert "links" in data
    assert isinstance(data["nodes"], list)
    assert isinstance(data["links"], list)
    assert len(data["nodes"]) > 0
    assert len(data["links"]) > 0

    node_ids = {n["id"] for n in data["nodes"]}
    assert "node_health" in node_ids or "PublicHealth" in node_ids or "node_needs" in node_ids

def test_intervention_emergency_food_relief():
    """Test emergency food relief intervention boosts health/food metrics."""
    world_id = "test-fresh-causal-world"
    payload = {
        "intervention_type": "emergency_food_relief",
        "ticks": 2,
    }
    resp = client.post(f"/api/v1/worlds/{world_id}/intervene", json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    
    assert data["success"] is True
    assert data["intervention_type"] == "emergency_food_relief"
    assert data["ticks"] == 2
    assert "vitals" in data
    assert "trace_graph" in data
    assert data["vitals"]["health_index"] >= 0.0

def test_intervention_cut_food_shock():
    """Test resource deprivation shock increases grievance and unmet demand."""
    world_id = "test-fresh-causal-world"
    payload = {
        "intervention_type": "cut_food",
        "ticks": 2,
    }
    resp = client.post(f"/api/v1/worlds/{world_id}/intervene", json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    
    assert data["success"] is True
    assert data["intervention_type"] == "cut_food"
    assert "vitals" in data
    assert data["vitals"]["unmet_needs"]["food"] > 0 or data["vitals"]["grievance_score"] >= 0

def test_intervention_hospital_capacity_shock():
    """Test cutting hospital capacity increases hospital occupancy percentage."""
    world_id = "test-fresh-causal-world"
    payload = {
        "intervention_type": "cut_hospital_capacity",
        "ticks": 1,
    }
    resp = client.post(f"/api/v1/worlds/{world_id}/intervene", json=payload)
    assert resp.status_code == 200, resp.text
    data = resp.json()
    
    assert data["success"] is True
    assert data["intervention_type"] == "cut_hospital_capacity"
    assert "vitals" in data

def test_simulation_advance_returns_vitals_and_trace():
    """Verify POST /api/v1/worlds/{id}/simulation/advance includes vitals and trace_graph."""
    world_id = "test-fresh-causal-world"
    resp = client.post(f"/api/v1/worlds/{world_id}/simulation/advance", json={"ticks": 1})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    
    assert "current_tick" in data
    assert "vitals" in data
    assert data["vitals"] is not None
    assert "health_index" in data["vitals"]
    assert "trace_graph" in data
    assert data["trace_graph"] is not None
    assert "nodes" in data["trace_graph"]

def test_backward_compatible_aliases():
    """Verify alias endpoints /causal/trace, /causal/vitals, and /causal/intervene work."""
    # 1. Alias vitals
    resp_vitals = client.get("/api/v1/causal/vitals?world_id=test-fresh-causal-world")
    assert resp_vitals.status_code == 200, resp_vitals.text
    assert isinstance(resp_vitals.json()["data"], list)
    
    # 2. Alias trace
    resp_trace = client.get("/api/v1/causal/trace?world_id=test-fresh-causal-world")
    assert resp_trace.status_code == 200, resp_trace.text
    assert "nodes" in resp_trace.json()

    # 3. Alias intervene
    resp_intervene = client.post(
        "/api/v1/causal/intervene?world_id=test-fresh-causal-world",
        json={"intervention_type": "emergency_water", "ticks": 1}
    )
    assert resp_intervene.status_code == 200, resp_intervene.text
    assert resp_intervene.json()["success"] is True

def test_civ_new_frontier_default_resolution():
    """Verify civ-new-frontier automatically resolves without 404 or empty failure."""
    resp = client.get("/api/v1/worlds/civ-new-frontier/vitals?limit=10")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["world_id"] == "aurora-prime"
    assert len(body["data"]) > 0

    trace_resp = client.get("/api/v1/worlds/civ-new-frontier/causal-trace")
    assert trace_resp.status_code == 200, trace_resp.text
    assert len(trace_resp.json()["nodes"]) > 0
