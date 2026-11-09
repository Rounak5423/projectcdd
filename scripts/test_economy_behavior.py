"""
Behavior test for Sprint 2: Honest Economy.
Requirements:
1. Changing tax rate changes treasury income next tick.
2. Issuing a municipal bond credits treasury and creates recurring interest debits.
3. Materials production comes from employed industrial workers (removing industry reduces materials income).
4. Undo round-trips (place -> demolish -> undo) leave resources and occupants identical.
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
    print("=== RUNNING BEHAVIOR TEST: SPRINT 2 HONEST ECONOMY ===")
    client = TestClient(app)

    # 1. Create test world
    create_resp = client.post("/api/v1/worlds", json={
        "name": "Econ_Honest_World",
        "initial_population": 300,
        "grid_size": 32,
        "climate": "Temperate",
        "technology_level": "Emergent"
    })
    assert create_resp.status_code == 201
    world_id = create_resp.json()["id"]

    # --------------------------------------------------------------------------
    # Test 1: Industry and Materials Production
    # --------------------------------------------------------------------------
    print("\n--- Test 1: Materials Production Tied to Industrial Workers ---")
    # Advance 10 ticks with NO industrial buildings
    adv1 = client.post(f"/api/v1/worlds/{world_id}/simulation/advance", json={"ticks": 10})
    assert adv1.status_code == 200

    conn = get_db_connection()
    mat_rate_no_ind = conn.execute("SELECT materials_rate, materials FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()
    conn.close()
    print(f"Materials rate without industry: {mat_rate_no_ind['materials_rate']} t/cycle, Materials: {mat_rate_no_ind['materials']}")

    # Build an Industrial Materials Foundry
    cmd_res = client.post(f"/api/v1/worlds/{world_id}/commands", json={
        "commands": [{
            "command_id": "cmd_build_ind_1",
            "action": "place_building",
            "payload": {
                "type": "Industrial",
                "name": "Advanced Materials Foundry",
                "x": 20.0,
                "z": 20.0
            }
        }]
    })
    assert cmd_res.status_code == 200
    ind_bld_id = cmd_res.json()["results"][0]["entity_id"]

    # Advance 10 ticks with industry
    adv2 = client.post(f"/api/v1/worlds/{world_id}/simulation/advance", json={"ticks": 10})
    assert adv2.status_code == 200

    conn = get_db_connection()
    mat_rate_with_ind = conn.execute("SELECT materials_rate, materials FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()
    conn.close()
    print(f"Materials rate WITH industry: {mat_rate_with_ind['materials_rate']} t/cycle, Materials: {mat_rate_with_ind['materials']}")

    assert mat_rate_with_ind["materials_rate"] > mat_rate_no_ind["materials_rate"], \
        f"Expected materials_rate with industry ({mat_rate_with_ind['materials_rate']}) > without industry ({mat_rate_no_ind['materials_rate']})"

    # Now Demolish Industry
    dem_res = client.post(f"/api/v1/worlds/{world_id}/commands", json={
        "commands": [{
            "command_id": "cmd_dem_ind_1",
            "action": "demolish_building",
            "payload": {"building_id": ind_bld_id}
        }]
    })
    assert dem_res.status_code == 200

    adv3 = client.post(f"/api/v1/worlds/{world_id}/simulation/advance", json={"ticks": 10})
    assert adv3.status_code == 200

    conn = get_db_connection()
    mat_rate_after_dem = conn.execute("SELECT materials_rate, materials FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()
    conn.close()
    print(f"Materials rate after industry demolished: {mat_rate_after_dem['materials_rate']} t/cycle")
    assert mat_rate_after_dem["materials_rate"] < mat_rate_with_ind["materials_rate"], \
        "Expected materials rate to drop after industry is removed!"
    print("✓ Test 1 Passed: Materials production is honestly tied to active industrial workers.")

    # --------------------------------------------------------------------------
    # Test 2: Tax Rate Changes Treasury Income
    # --------------------------------------------------------------------------
    print("\n--- Test 2: Tax Rate Changes Treasury Income ---")
    budget_before = client.get(f"/api/v1/worlds/{world_id}/budget").json()
    print(f"Initial budget: {budget_before}")

    # Set tax rate from 10% to 25%
    tax_update = client.post(f"/api/v1/worlds/{world_id}/budget", json={
        "residential_tax": 0.25,
        "commercial_tax": 0.25,
        "industrial_tax": 0.25
    })
    assert tax_update.status_code == 200, f"Budget update failed: {tax_update.text}"

    # Advance 1 tick and observe income
    adv_tax = client.post(f"/api/v1/worlds/{world_id}/simulation/advance", json={"ticks": 1})
    assert adv_tax.status_code == 200

    budget_after = client.get(f"/api/v1/worlds/{world_id}/budget").json()
    print(f"Updated budget: {budget_after}")
    assert budget_after["tax_revenue"] > budget_before["tax_revenue"], \
        f"Expected higher tax revenue after rate increase, got {budget_after['tax_revenue']} <= {budget_before['tax_revenue']}"
    print("✓ Test 2 Passed: Tax rate changes alter treasury revenue next tick.")

    # --------------------------------------------------------------------------
    # Test 3: Municipal Bonds (Issue & Recurring Interest Debit)
    # --------------------------------------------------------------------------
    print("\n--- Test 3: Municipal Bonds & Recurring Interest ---")
    treasury_before = budget_after["treasury"]

    bond_resp = client.post(f"/api/v1/worlds/{world_id}/bonds/issue", json={"amount": 10000.0})
    assert bond_resp.status_code == 200, f"Bond issue failed: {bond_resp.text}"
    bond_data = bond_resp.json()
    print(f"Bond issued: {bond_data}")
    assert bond_data["treasury"] == treasury_before + 10000.0
    assert bond_data["municipal_debt"] == 10000.0

    # Advance 30 ticks (1 month) to incur interest
    adv_interest = client.post(f"/api/v1/worlds/{world_id}/simulation/advance", json={"ticks": 30})
    assert adv_interest.status_code == 200

    budget_with_interest = client.get(f"/api/v1/worlds/{world_id}/budget").json()
    print(f"Budget with bond interest: debt={budget_with_interest['municipal_debt']}, total_interest_paid={budget_with_interest.get('total_interest_paid', 0)}")
    assert budget_with_interest.get("total_interest_paid", 0) > 0, "Expected interest debited from debt!"
    print("✓ Test 3 Passed: Municipal bonds credit treasury and incur interest debits.")

    # --------------------------------------------------------------------------
    # Test 4: Undo Round-Trip (Place -> Demolish -> Undo)
    # --------------------------------------------------------------------------
    print("\n--- Test 4: Undo Round-Trip Leaves Resources & Occupants Identical ---")
    conn = get_db_connection()
    res_before = conn.execute("SELECT materials, genesis_research_credits FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()
    cit_count_before = conn.execute("SELECT COUNT(*) FROM citizens WHERE world_id = ? AND is_alive = 1", (world_id,)).fetchone()[0]
    conn.close()

    mat_start = res_before["materials"]

    # 1. Place a building
    bld_cmd = client.post(f"/api/v1/worlds/{world_id}/commands", json={
        "commands": [{
            "command_id": "cmd_bld_undo_test",
            "action": "place_building",
            "payload": {
                "type": "Residential",
                "name": "Undo Test Habitation",
                "x": 10.0,
                "z": 10.0
            }
        }]
    })
    bld_undo_id = bld_cmd.json()["results"][0]["entity_id"]
    cost = bld_cmd.json()["results"][0]["deducted_resources"]["materials"]

    conn = get_db_connection()
    mat_after_place = conn.execute("SELECT materials FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()["materials"]
    cit_count_after_place = conn.execute("SELECT COUNT(*) FROM citizens WHERE world_id = ? AND is_alive = 1", (world_id,)).fetchone()[0]
    conn.close()
    assert abs(mat_after_place - (mat_start - cost)) < 0.1

    # 2. Demolish that building
    dem_cmd = client.post(f"/api/v1/worlds/{world_id}/commands", json={
        "commands": [{
            "command_id": "cmd_dem_undo_test",
            "action": "demolish_building",
            "payload": {"building_id": bld_undo_id}
        }]
    })
    refund = cost * 0.70

    # 3. Undo demolition
    undo_resp = client.post(f"/api/v1/worlds/{world_id}/undo")
    assert undo_resp.status_code == 200, f"Undo failed: {undo_resp.text}"

    conn = get_db_connection()
    mat_after_undo_dem = conn.execute("SELECT materials FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()["materials"]
    bld_restored = conn.execute("SELECT * FROM buildings WHERE id = ?", (bld_undo_id,)).fetchone()
    cit_count_after_undo_dem = conn.execute("SELECT COUNT(*) FROM citizens WHERE world_id = ? AND is_alive = 1", (world_id,)).fetchone()[0]
    conn.close()

    assert bld_restored is not None, "Building was not restored by undo!"
    assert abs(mat_after_undo_dem - mat_after_place) < 0.1, \
        f"Materials leak after undo demolish! Expected {mat_after_place}, got {mat_after_undo_dem}"
    assert cit_count_after_undo_dem == cit_count_after_place, \
        f"Occupants not restored! Expected {cit_count_after_place}, got {cit_count_after_undo_dem}"

    # 4. Undo placement
    undo_place_resp = client.post(f"/api/v1/worlds/{world_id}/undo")
    assert undo_place_resp.status_code == 200

    conn = get_db_connection()
    mat_final = conn.execute("SELECT materials FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()["materials"]
    cit_count_final = conn.execute("SELECT COUNT(*) FROM citizens WHERE world_id = ? AND is_alive = 1", (world_id,)).fetchone()[0]
    conn.close()

    assert abs(mat_final - mat_start) < 0.1, f"Materials not restored to initial! Start: {mat_start}, Final: {mat_final}"
    assert cit_count_final == cit_count_before, f"Citizens not restored to initial! Start: {cit_count_before}, Final: {cit_count_final}"

    print("✓ Test 4 Passed: Undo round-trips leave materials and occupants exactly identical.")
    print("\n✓ ALL SPRINT 2 BEHAVIOR TESTS PASSED.")

if __name__ == "__main__":
    main()
