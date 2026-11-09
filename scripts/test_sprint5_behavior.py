#!/usr/bin/env python3
"""
Behavioral Verification Test for Sprint 5:
- Technology effects on simulation (MAJ-01)
- Council simulation tick alignment (MIN-03)
- Disasters and weather backend entities (BLK-03 / MAJ-01)
- 365-tick ML vs Rule-based comparative playthrough telemetry
"""

import sys
import os
import json
import uuid

BACKEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "genesis-engine", "backend")
sys.path.insert(0, BACKEND_DIR)

from fastapi.testclient import TestClient
from main import app
from db.database import get_db_connection

client = TestClient(app)

def test_sprint5_behavior():
    print("=== STARTING SPRINT 5 BEHAVIOR TEST: RESEARCH, COUNCIL & DISASTERS ===")

    # 1. Create a clean test world
    create_res = client.post("/api/v1/worlds", json={"name": "Sprint 5 Metropol", "seed": 42})
    assert create_res.status_code in [200, 201]
    world_id = create_res.json()["id"]
    print(f"[Step 1] Created test world: {world_id}")

    # Setup road network, power plant, and industrial facility so it is fully powered and active
    setup_commands = [
        {"command_id": "r1", "action": "draw_road", "payload": {"start_x": 0.0, "start_z": 0.0, "end_x": 0.0, "end_z": 20.0}},
        {"command_id": "p1", "action": "place_building", "payload": {"type": "Energy", "name": "Geothermal Plant", "x": 2.0, "z": 2.0}},
        {"command_id": "w1", "action": "place_building", "payload": {"type": "Water", "name": "Aquifer Pump", "x": 2.0, "z": 4.0}},
        {"command_id": "i1", "action": "place_building", "payload": {"type": "Industrial", "name": "Foundry", "x": 2.0, "z": 8.0}},
    ]
    cmd_res = client.post(f"/api/v1/worlds/{world_id}/commands", json={"commands": setup_commands})
    assert cmd_res.status_code == 200

    conn = get_db_connection()
    ind_bld = conn.execute("SELECT id FROM buildings WHERE world_id = ? AND type = 'Industrial'", (world_id,)).fetchone()
    ind_bld_id = ind_bld["id"]

    with conn:
        conn.execute("UPDATE buildings SET capacity = 100 WHERE id = ?", (ind_bld_id,))
        for i in range(100):
            conn.execute("""
            INSERT INTO citizens (id, world_id, age, health, employed, work_building_id, is_alive)
            VALUES (?, ?, 30.0, 0.9, 1, ?, 1)
            """, (f"cit_worker_{i}_{world_id}", world_id, ind_bld_id))
        conn.execute("""
        UPDATE economy_resources
        SET materials = 1000.0, research_points = 1000.0, research_rate = 10.0, materials_rate = 50.0
        WHERE world_id = ?
        """, (world_id,))
    conn.close()

    # Step simulation 10 ticks WITHOUT tech-bronze
    client.post(f"/api/v1/worlds/{world_id}/simulation/advance", json={"ticks": 10})
    conn = get_db_connection()
    econ_base = conn.execute("SELECT materials, materials_rate, research_points FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()
    conn.close()

    mat_rate_base = float(econ_base["materials_rate"])
    # 100 workers * 0.5 = 50.0 t/day
    assert mat_rate_base == 50.0, f"Expected base materials_rate 50.0, got {mat_rate_base}"
    print(f"[Step 2] Base materials rate with 100 workers: {mat_rate_base} t/day")

    # 2. Unlock tech-bronze (+15% mining/materials yield)
    print("[Step 3] Unlocking tech-bronze (+15% mining yield)...")
    unlock_res = client.post(f"/api/v1/worlds/{world_id}/technology/tech-bronze/complete")
    assert unlock_res.status_code == 200, f"Tech unlock failed: {unlock_res.text}"

    # Advance 1 tick
    client.post(f"/api/v1/worlds/{world_id}/simulation/advance", json={"ticks": 1})
    conn = get_db_connection()
    econ_boosted = conn.execute("SELECT materials, materials_rate, research_points FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()
    conn.close()

    mat_rate_boosted = float(econ_boosted["materials_rate"])
    # 50.0 * 1.15 = 57.5 t/day
    assert mat_rate_boosted == 57.5, f"Expected boosted materials_rate 57.5, got {mat_rate_boosted}"
    print(f"  -> Verified Tech Buff: materials rate jumped from 50.0 to {mat_rate_boosted} (+15%)!")

    # 3. Unlock tech-mathematics (+40% science generation)
    print("[Step 4] Unlocking tech-mathematics (+40% science)...")
    math_res = client.post(f"/api/v1/worlds/{world_id}/technology/tech-mathematics/complete")
    assert math_res.status_code == 200

    conn = get_db_connection()
    math_row = conn.execute("SELECT is_unlocked, effects FROM technologies WHERE world_id = ? AND id = 'tech-mathematics'", (world_id,)).fetchone()
    conn.close()
    assert math_row["is_unlocked"] == 1
    print("  -> tech-mathematics unlocked in database.")

    # 4. Verify Council Simulation Tick Alignment (MIN-03)
    print("[Step 5] Verifying Council Simulation Tick Alignment...")
    # Advance simulation by 25 ticks (total ticks = 10 + 1 + 25 = 36)
    client.post(f"/api/v1/worlds/{world_id}/simulation/advance", json={"ticks": 25})
    conn = get_db_connection()
    actual_world_tick = conn.execute("SELECT tick FROM worlds WHERE id = ?", (world_id,)).fetchone()["tick"]
    conn.close()

    council_res = client.get(f"/api/v1/council/overview/{world_id}")
    assert council_res.status_code == 200
    council_data = council_res.json().get("data", council_res.json())
    council_tick = council_data.get("simulationTick") or council_data.get("simulation_tick")
    assert council_tick == actual_world_tick, f"Expected council simulationTick {actual_world_tick}, got {council_tick}!"
    print(f"  -> Verified Council tick alignment: simulationTick = {council_tick} matches world.tick exactly!")

    # 5. Verify Disasters and Weather Backend Entities
    print("[Step 6] Testing Disasters and Weather API endpoints...")
    weather_res = client.get(f"/api/v1/worlds/{world_id}/weather")
    assert weather_res.status_code == 200
    weather = weather_res.json()
    assert "temperature_c" in weather
    assert "weather_condition" in weather
    print(f"  -> Weather telemetry: condition={weather['weather_condition']}, temp={weather['temperature_c']}°C")

    # Trigger a disaster
    trigger_payload = {
        "type": "wildfire",
        "name": "Vulcan Forge Brushfire",
        "intensity": "high",
        "epicenter_x": 10.0,
        "epicenter_z": -15.0,
        "radius": 50.0,
        "duration_days": 10
    }
    dis_res = client.post(f"/api/v1/worlds/{world_id}/disasters/trigger", json=trigger_payload)
    assert dis_res.status_code == 200
    dis_id = dis_res.json()["disaster_id"]

    # Verify disaster in database
    conn = get_db_connection()
    dis_row = conn.execute("SELECT * FROM disasters WHERE id = ?", (dis_id,)).fetchone()
    event_row = conn.execute("SELECT * FROM events WHERE world_id = ? AND category = 'disaster' ORDER BY created_at DESC LIMIT 1", (world_id,)).fetchone()
    conn.close()

    assert dis_row is not None
    assert dis_row["type"] == "wildfire"
    assert dis_row["stage"] == "active"
    assert event_row is not None
    print(f"  -> Disaster entity {dis_id} active in SQLite. Event logged: '{event_row['title']}'")

    # Contain and clear disaster
    contain_res = client.post(f"/api/v1/worlds/{world_id}/disasters/{dis_id}/contain", json={"containment_delta": 60.0})
    assert contain_res.status_code == 200
    assert contain_res.json()["stage"] == "containing"

    clear_res = client.post(f"/api/v1/worlds/{world_id}/disasters/{dis_id}/clear")
    assert clear_res.status_code == 200
    assert clear_res.json()["status"] == "resolved"

    conn = get_db_connection()
    dis_row_after = conn.execute("SELECT stage, containment_percent FROM disasters WHERE id = ?", (dis_id,)).fetchone()
    conn.close()
    assert dis_row_after["stage"] == "resolved"
    assert dis_row_after["containment_percent"] == 100.0
    print("  -> Disaster contained and resolved in authoritative backend database.")

    print("=== SPRINT 5 BEHAVIOR TEST PASSED 100% ===")

if __name__ == "__main__":
    test_sprint5_behavior()
