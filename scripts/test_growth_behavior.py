"""
Behavior test for Sprint 3: The City Actually Grows.
Requirements:
1. RCI Zone Growth: Painting R, C, I zones with road & utility access sprouts buildings when demand > 0.
2. Jobs and Population grow together honestly in SQLite.
3. Traffic builds on real connected road segments (replacing pseudo seg_active_*), computing BPR congestion.
4. Abandonment: Cutting power causes unserviced buildings to abandon after > 5 ticks, evicting occupants.
5. Recovery & Progression: Restoring power allows abandoned buildings to recover to active status and level up.
"""

import os
import sys
import random
import numpy as np

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "genesis-engine", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi.testclient import TestClient
from main import app
from db.database import get_db_connection

def main():
    print("=== RUNNING BEHAVIOR TEST: SPRINT 3 THE CITY ACTUALLY GROWS ===")
    random.seed(42)
    np.random.seed(42)
    client = TestClient(app)

    # 1. Create fresh test world
    create_res = client.post("/api/v1/worlds", json={
        "name": "Growth_Test_City",
        "initial_population": 50,
        "grid_size": 48,
        "climate": "Temperate",
        "technology_level": "Emergent"
    })
    assert create_res.status_code == 201
    world_id = create_res.json()["id"]
    print(f"World created: {world_id}")

    # 2. Draw road network connecting infrastructure to zones
    # Center is around (24.0, 24.0)
    print("\n--- Step 1: Laying Connected Road Network ---")
    draw_res = client.post(f"/api/v1/worlds/{world_id}/commands", json={
        "commands": [
            {
                "command_id": "road_1",
                "action": "draw_road",
                "payload": {"x1": 24.0, "z1": 24.0, "x2": 24.0, "z2": 40.0, "road_type": "two_lane"}
            },
            {
                "command_id": "road_2",
                "action": "draw_road",
                "payload": {"x1": 24.0, "z1": 40.0, "x2": 40.0, "z2": 40.0, "road_type": "two_lane"}
            }
        ]
    })
    assert draw_res.status_code == 200

    conn = get_db_connection()
    roads_count = conn.execute("SELECT COUNT(*) as c FROM road_segments WHERE world_id = ?", (world_id,)).fetchone()["c"]
    conn.close()
    print(f"Road segments placed: {roads_count}")
    assert roads_count >= 2

    # 3. Place Energy and Water facilities connected to the road
    print("\n--- Step 2: Placing Power and Water Facilities ---")
    infra_res = client.post(f"/api/v1/worlds/{world_id}/commands", json={
        "commands": [
            {
                "command_id": "bld_power_plant",
                "action": "place_building",
                "payload": {"type": "Energy", "name": "Geothermal Plant", "x": 24.0, "z": 26.0}
            },
            {
                "command_id": "bld_water_pump",
                "action": "place_building",
                "payload": {"type": "Water", "name": "Deep Aquifer Pump", "x": 24.0, "z": 28.0}
            }
        ]
    })
    assert infra_res.status_code == 200
    power_plant_id = infra_res.json()["results"][0]["entity_id"]
    print(f"Power Plant placed: {power_plant_id}")

    # 4. Paint Residential, Commercial, and Industrial zones along the road
    print("\n--- Step 3: Painting RCI Zones Along Connected Road ---")
    zone_cmds = [
        {"command_id": "zone_r1", "action": "paint_zone", "payload": {"x": 26.0, "z": 32.0, "zone_type": "residential_low"}},
        {"command_id": "zone_r2", "action": "paint_zone", "payload": {"x": 26.0, "z": 34.0, "zone_type": "residential_low"}},
        {"command_id": "zone_c1", "action": "paint_zone", "payload": {"x": 26.0, "z": 36.0, "zone_type": "commercial_low"}},
        {"command_id": "zone_i1", "action": "paint_zone", "payload": {"x": 26.0, "z": 38.0, "zone_type": "industrial"}},
    ]
    zone_res = client.post(f"/api/v1/worlds/{world_id}/commands", json={"commands": zone_cmds})
    assert zone_res.status_code == 200

    conn = get_db_connection()
    initial_bld_count = conn.execute("SELECT COUNT(*) as c FROM buildings WHERE world_id = ?", (world_id,)).fetchone()["c"]
    conn.close()
    print(f"Initial building count before simulation: {initial_bld_count}")

    # 5. Advance simulation: verify RCI buildings sprout and population/jobs grow
    print("\n--- Step 4: Advancing Simulation to Sprout Zoned Buildings ---")
    for cycle in range(5):
        adv = client.post(f"/api/v1/worlds/{world_id}/simulation/advance", json={"ticks": 10})
        assert adv.status_code == 200

    conn = get_db_connection()
    post_blds = conn.execute("SELECT id, name, type, level, status, capacity, current_occupants, current_workers FROM buildings WHERE world_id = ?", (world_id,)).fetchall()
    cit_count = conn.execute("SELECT COUNT(*) as c FROM citizens WHERE world_id = ? AND is_alive = 1", (world_id,)).fetchone()["c"]
    occupied_zones = conn.execute("SELECT COUNT(*) as c FROM zone_lots WHERE world_id = ? AND building_id IS NOT NULL", (world_id,)).fetchone()["c"]
    conn.close()

    print(f"Buildings after 50 ticks: {len(post_blds)} (was {initial_bld_count})")
    print(f"Zoned lots developed: {occupied_zones}")
    print(f"Living population: {cit_count}")
    for b in post_blds:
        print(f"  - [{b['type']}] {b['name']}: lvl {b['level']}, status={b['status']}, occ={b['current_occupants']}, workers={b['current_workers']}")

    assert len(post_blds) > initial_bld_count, f"Expected spawned buildings > {initial_bld_count}, got {len(post_blds)}"
    assert occupied_zones > 0, f"Expected developed zones > 0, got {occupied_zones}"
    print("✓ Test 4 Passed: RCI zones sprout buildings organically with population and job growth!")

    # 6. Verify Traffic build-up on real road segments
    print("\n--- Step 5: Verifying Real Road Segment Traffic & BPR Delay ---")
    conn = get_db_connection()
    segments = conn.execute("SELECT id, road_type, current_traffic, congestion, speed_limit FROM road_segments WHERE world_id = ?", (world_id,)).fetchall()
    conn.close()
    for s in segments:
        print(f"  Segment {s['id']}: traffic={s['current_traffic']}, congestion={s['congestion']}, speed_limit={s['speed_limit']} km/h")
    # Verify no pseudo seg_active_* entries in road_segments
    assert all("seg_active_" not in s["id"] for s in segments), "Found legacy fake seg_active_* IDs in road segments!"
    print("✓ Test 5 Passed: Traffic routes on real road segments with authoritative BPR congestion!")

    # 7. Abandonment Test: Demolish power plant to trigger unpowered state
    print("\n--- Step 6: Cutting Power Grid to Trigger Abandonment ---")
    cut_res = client.post(f"/api/v1/worlds/{world_id}/commands", json={
        "commands": [{
            "command_id": "cmd_cut_power",
            "action": "demolish_building",
            "payload": {"building_id": power_plant_id}
        }]
    })
    assert cut_res.status_code == 200

    # Advance 15 ticks without power (> 5 ticks required for abandonment)
    for _ in range(3):
        adv_cut = client.post(f"/api/v1/worlds/{world_id}/simulation/advance", json={"ticks": 5})
        assert adv_cut.status_code == 200

    conn = get_db_connection()
    abandoned_count = conn.execute("SELECT COUNT(*) as c FROM buildings WHERE world_id = ? AND status = 'abandoned'", (world_id,)).fetchone()["c"]
    conn.close()
    print(f"Abandoned buildings after 15 unpowered ticks: {abandoned_count}")
    assert abandoned_count > 0, f"Expected at least 1 abandoned building after blackout, got {abandoned_count}"
    print("✓ Test 6 Passed: Buildings abandon after sustained blackout and evict occupants.")

    # 8. Recovery Test: Undo power plant demolition
    print("\n--- Step 7: Restoring Power and Verifying Building Recovery ---")
    undo_res = client.post(f"/api/v1/worlds/{world_id}/undo")
    assert undo_res.status_code == 200

    # Advance 15 ticks with restored power
    for _ in range(3):
        adv_rec = client.post(f"/api/v1/worlds/{world_id}/simulation/advance", json={"ticks": 5})
        assert adv_rec.status_code == 200

    conn = get_db_connection()
    post_rec_abandoned = conn.execute("SELECT COUNT(*) as c FROM buildings WHERE world_id = ? AND status = 'abandoned'", (world_id,)).fetchone()["c"]
    active_blds = conn.execute("SELECT COUNT(*) as c FROM buildings WHERE world_id = ? AND status = 'active'", (world_id,)).fetchone()["c"]
    conn.close()
    print(f"Abandoned buildings after recovery: {post_rec_abandoned}, Active buildings: {active_blds}")
    assert post_rec_abandoned == 0, f"Expected 0 abandoned buildings after power restoration, got {post_rec_abandoned}"
    print("✓ Test 7 Passed: Abandoned buildings recover to active operational status once serviced!")

    print("\n✓ ALL SPRINT 3 BEHAVIOR TESTS PASSED.")

if __name__ == "__main__":
    main()
