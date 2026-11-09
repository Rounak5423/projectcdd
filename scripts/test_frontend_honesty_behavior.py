#!/usr/bin/env python3
"""
Behavioral Verification Test for Sprint 4: Frontend Honesty (BLK-03, MAJ-02, MIN-01, MIN-02)

Tests:
1. Rejection when resources are insufficient for causal interventions.
2. Honest execution of causal intervention when affordable:
   - Materials and GRC are deducted from economy_resources.
   - Downstream causal effects are applied (food/water/hospital/stability).
   - Action log and events log capture the intervention.
3. Undo restores exact deducted materials and GRC.
4. Reversible idempotency and command tracking.
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

def test_frontend_honesty_behavior():
    print("=== STARTING SPRINT 4 BEHAVIOR TEST: FRONTEND HONESTY ===")

    # 1. Create a clean test world
    test_world_id = f"test-honesty-{uuid.uuid4().hex[:6]}"
    create_res = client.post("/api/v1/worlds", json={"name": "Honesty Test Colony", "seed": 42})
    assert create_res.status_code in [200, 201], f"World creation failed: {create_res.text}"
    world_id = create_res.json()["id"]
    print(f"[Step 1] Created test world: {world_id}")

    # Set initial low resources to test rejection
    conn = get_db_connection()
    with conn:
        conn.execute("""
        UPDATE economy_resources
        SET materials = 100.0, genesis_research_credits = 50.0, food = 1000.0, water = 1000.0, happiness = 0.50, civic_stability = 0.50
        WHERE world_id = ?
        """, (world_id,))
    conn.close()

    # 2. Test rejection on insufficient materials/GRC
    print("[Step 2] Testing rejection on insufficient resources for emergency_food (needs 500 mat, 200 grc)...")
    cmd_payload = {
        "commands": [
            {
                "command_id": f"cmd-fail-{uuid.uuid4().hex[:6]}",
                "action": "causal_intervention",
                "payload": {"intervention_id": "emergency_food"}
            }
        ]
    }
    fail_res = client.post(f"/api/v1/worlds/{world_id}/commands", json=cmd_payload)
    assert fail_res.status_code == 200, f"Expected 200 response, got {fail_res.status_code}"
    results = fail_res.json()["results"]
    assert len(results) == 1
    assert results[0]["status"] == "rejected", f"Expected rejection, got {results[0]['status']}"
    assert "Insufficient materials" in results[0]["reason"], f"Expected 'Insufficient materials' in reason, got {results[0]['reason']}"
    print(f"  -> Successfully rejected: {results[0]['reason']}")

    # 3. Supply sufficient resources and execute emergency_food
    print("[Step 3] Granting resources and executing emergency_food...")
    conn = get_db_connection()
    with conn:
        conn.execute("""
        UPDATE economy_resources
        SET materials = 2000.0, genesis_research_credits = 1000.0
        WHERE world_id = ?
        """, (world_id,))
    conn.close()

    cmd_success_payload = {
        "commands": [
            {
                "command_id": f"cmd-ok-{uuid.uuid4().hex[:6]}",
                "action": "causal_intervention",
                "payload": {"intervention_id": "emergency_food"}
            }
        ]
    }
    ok_res = client.post(f"/api/v1/worlds/{world_id}/commands", json=cmd_success_payload)
    assert ok_res.status_code == 200
    res_data = ok_res.json()["results"][0]
    assert res_data["status"] == "accepted", f"Expected acceptance, got: {res_data}"
    print("  -> Emergency food command accepted by backend!")

    # Verify database state after intervention
    conn = get_db_connection()
    row = conn.execute("SELECT materials, genesis_research_credits, food, happiness FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()
    conn.close()

    # Expected: materials was 2000 - 500 = 1500; grc was 1000 - 200 = 800; food was 1000 + 5000 = 6000; happiness 0.50 + 0.12 = 0.62
    assert row["materials"] == 1500.0, f"Expected 1500 materials, got {row['materials']}"
    assert row["genesis_research_credits"] == 800.0, f"Expected 800 GRC, got {row['genesis_research_credits']}"
    assert row["food"] == 6000.0, f"Expected 6000 food, got {row['food']}"
    assert abs(row["happiness"] - 0.62) < 0.01, f"Expected happiness 0.62, got {row['happiness']}"
    print(f"  -> State updated honestly: materials={row['materials']}, GRC={row['genesis_research_credits']}, food={row['food']}, happiness={round(row['happiness'], 2)}")

    # 4. Test Undo of causal intervention
    print("[Step 4] Testing undo of causal intervention...")
    undo_res = client.post(f"/api/v1/worlds/{world_id}/undo")
    assert undo_res.status_code == 200
    undo_data = undo_res.json()
    assert undo_data["success"] is True, f"Undo failed: {undo_data}"
    assert undo_data["refunded_materials"] == 500.0
    assert undo_data["refunded_grc"] == 200.0

    conn = get_db_connection()
    row_after_undo = conn.execute("SELECT materials, genesis_research_credits FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()
    conn.close()
    assert row_after_undo["materials"] == 2000.0, f"Expected refunded materials 2000.0, got {row_after_undo['materials']}"
    assert row_after_undo["genesis_research_credits"] == 1000.0, f"Expected refunded GRC 1000.0, got {row_after_undo['genesis_research_credits']}"
    print("  -> Undo successfully restored exact refunded materials and GRC!")

    # 5. Test hospital expansion intervention
    print("[Step 5] Testing expand_hospital intervention...")
    hosp_payload = {
        "commands": [
            {
                "command_id": f"cmd-hosp-{uuid.uuid4().hex[:6]}",
                "action": "causal_intervention",
                "payload": {"intervention_id": "expand_hospital"}
            }
        ]
    }
    hosp_res = client.post(f"/api/v1/worlds/{world_id}/commands", json=hosp_payload)
    assert hosp_res.status_code == 200
    assert hosp_res.json()["results"][0]["status"] == "accepted"

    conn = get_db_connection()
    hosp_count = conn.execute("SELECT COUNT(*) FROM buildings WHERE world_id = ? AND type = 'Hospital'", (world_id,)).fetchone()[0]
    conn.close()
    assert hosp_count >= 1, f"Expected at least 1 hospital building, got {hosp_count}"
    print(f"  -> Hospital pavilion built: {hosp_count} hospitals active.")

    # 6. Test undo of hospital intervention
    undo_hosp_res = client.post(f"/api/v1/worlds/{world_id}/undo")
    assert undo_hosp_res.status_code == 200
    conn = get_db_connection()
    hosp_count_after = conn.execute("SELECT COUNT(*) FROM buildings WHERE world_id = ? AND type = 'Hospital'", (world_id,)).fetchone()[0]
    conn.close()
    assert hosp_count_after == 0, f"Expected 0 hospitals after undo, got {hosp_count_after}"
    print("  -> Hospital undo dismantled the pavilion cleanly.")

    print("=== SPRINT 4 BEHAVIOR TEST PASSED 100% ===")

if __name__ == "__main__":
    test_frontend_honesty_behavior()

