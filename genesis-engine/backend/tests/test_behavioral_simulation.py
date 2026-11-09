"""
================================================================================
GENESIS Engine: Behavioral & Security Integration Test Suite
================================================================================
Tests real simulation dynamics:
1. Power plant construction raises energy generation rate
2. Demolition / bulldozing refunds exactly 70% of construction cost
3. Severe resource shortages actively degrade citizen happiness & stability
4. Save slot creation, listing, and state restoration
5. Login rate limiting (HTTP 429 after threshold)
6. WebSocket authentication and delta streaming
"""

import pytest
import json
import time
from fastapi.testclient import TestClient
from main import app
from engine.simulation import seed_aurora_prime_if_not_exists
import db.database

client = TestClient(app)


@pytest.fixture(autouse=True, scope="module")
def setup_behavior_db(tmp_path_factory):
    test_db = str(tmp_path_factory.mktemp("behavior_db") / "test_behavior.db")
    db.database.DB_PATH = test_db
    db.database.init_db()
    seed_aurora_prime_if_not_exists()


def test_power_plant_construction_raises_energy_supply():
    # 1. Inspect initial energy rate
    res_before = client.get("/api/v1/worlds/aurora-prime/resources").json()
    initial_energy_rate = res_before["energy_rate"]

    # 2. Build Geothermal Power Plant (type: Energy)
    build_res = client.post("/api/v1/worlds/aurora-prime/buildings", json={
        "name": "Apex Geothermal Unit",
        "type": "Energy",
        "x": 12.0,
        "y": 18.0
    })
    assert build_res.status_code == 201
    bld_data = build_res.json()
    bld_id = bld_data["id"]

    # 3. Assert energy rate increased
    res_after = client.get("/api/v1/worlds/aurora-prime/resources").json()
    assert res_after["energy_rate"] > initial_energy_rate
    assert pytest.approx(res_after["energy_rate"] - initial_energy_rate, 0.1) == 80.0

    # Clean up
    client.delete(f"/api/v1/buildings/{bld_id}")


def test_bulldozing_refunds_seventy_percent():
    # 1. Construct an Industrial Materials Foundry
    build_res = client.post("/api/v1/worlds/aurora-prime/buildings", json={
        "name": "Heavy Fabrication Hub",
        "type": "Industry",
        "x": 22.0,
        "y": 14.0
    })
    assert build_res.status_code == 201
    bld_id = build_res.json()["id"]
    cost = build_res.json()["construction_cost"]

    # 2. Inspect resources before bulldozing
    res_before = client.get("/api/v1/worlds/aurora-prime/resources").json()
    mat_before = res_before["materials"]
    grc_before = res_before["genesis_research_credits"]

    # 3. Bulldoze building
    del_res = client.delete(f"/api/v1/buildings/{bld_id}")
    assert del_res.status_code == 200
    del_data = del_res.json()
    assert del_data["refund_rate"] == 0.70
    assert del_data["refunded_materials"] == round(cost.get("materials", 0.0) * 0.70, 2)
    assert del_data["refunded_credits"] == round(cost.get("credits", 0.0) * 0.70, 2)

    # 4. Verify refund added back to resources
    res_after = client.get("/api/v1/worlds/aurora-prime/resources").json()
    assert res_after["materials"] == mat_before + del_data["refunded_materials"]
    assert res_after["genesis_research_credits"] == grc_before + del_data["refunded_credits"]


def test_resource_shortage_degrades_happiness():
    # 1. Create a dedicated colony for shortage testing
    colony = client.post("/api/v1/worlds", json={
        "name": "Shortage Colony",
        "climate": "Arid",
        "technology_level": "Automated",
        "initial_population": 500
    }).json()
    c_id = colony["id"]

    # 2. Artificially deplete energy and food in database
    conn = db.database.get_db_connection()
    with conn:
        conn.execute("UPDATE economy_resources SET energy = 0.0, food = 0.0, energy_rate = 0.0, food_rate = 0.0, happiness = 0.80 WHERE world_id = ?", (c_id,))
    conn.close()

    # 3. Advance simulation 5 ticks under zero energy and food
    adv_res = client.post(f"/api/v1/worlds/{c_id}/simulation/advance", json={"ticks": 5})
    assert adv_res.status_code == 200

    # 4. Assert happiness dropped below baseline
    econ = client.get(f"/api/v1/worlds/{c_id}/economy").json()
    assert econ["happiness"] < 0.80
    assert econ["civic_stability"] < 0.80


def test_save_slot_creation_and_restoration():
    # 1. Save current baseline state of Aurora Prime
    save_res = client.post("/api/v1/worlds/aurora-prime/saves", json={
        "name": "Pre-Crisis Golden Age",
        "slot_type": "manual"
    })
    assert save_res.status_code == 201
    save_data = save_res.json()
    save_id = save_data["id"]
    saved_tick = save_data["tick"]

    # 2. Advance world by 15 ticks
    client.post("/api/v1/worlds/aurora-prime/simulation/advance", json={"ticks": 15})
    advanced_stat = client.get("/api/v1/worlds/aurora-prime/simulation/status").json()
    assert advanced_stat["current_tick"] == saved_tick + 15

    # 3. Restore save slot
    rest_res = client.post(f"/api/v1/worlds/aurora-prime/saves/{save_id}/restore")
    assert rest_res.status_code == 200
    rest_data = rest_res.json()
    assert rest_data["status"] == "restored"
    assert rest_data["restored_tick"] == saved_tick

    # 4. Verify restored state
    restored_stat = client.get("/api/v1/worlds/aurora-prime/simulation/status").json()
    assert restored_stat["current_tick"] == saved_tick

    # 5. Clean up save
    del_save = client.delete(f"/api/v1/worlds/aurora-prime/saves/{save_id}")
    assert del_save.status_code == 200


def test_login_rate_limiting():
    # Fire 5 failed attempts for rate limit test user
    test_user = "rate_limit_target"
    for _ in range(5):
        res = client.post("/api/v1/auth/login", json={
            "username": test_user,
            "password": "WrongPassword!"
        })
        assert res.status_code == 401

    # 6th attempt must be rejected with HTTP 429
    blocked_res = client.post("/api/v1/auth/login", json={
        "username": test_user,
        "password": "WrongPassword!"
    })
    assert blocked_res.status_code == 429
    assert "Too many failed login attempts" in blocked_res.json()["detail"]


def test_websocket_authentication_and_deltas():
    # 1. Login to obtain access token
    token = client.post("/api/v1/auth/login", json={
        "username": "player1",
        "password": "UserPassword123!"
    }).json()["access_token"]

    # 2. Connect to WebSocket with token
    with client.websocket_connect(f"/ws/world/aurora-prime?token={token}") as websocket:
        init_msg = websocket.receive_json()
        assert init_msg["type"] == "initial_state"
        assert init_msg["world_id"] == "aurora-prime"

        # 3. Send tick command and receive delta packet
        websocket.send_json({"type": "tick", "ticks": 1})
        delta_msg = websocket.receive_json()
        assert delta_msg["type"] in ["tick_delta", "tick_update"]
        assert "delta" in delta_msg
        assert "population" in delta_msg["delta"]
        assert "resources" in delta_msg["delta"]
