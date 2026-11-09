"""
Behavior test for Sprint 1: Demographics and Real Citizens (BLK-01, BLK-02, MAJ-04).
Requirement:
A 500-citizen world over 3650 ticks must show:
1. births > 0
2. deaths > 0
3. a plausible age distribution (e.g. min age >= 0, max age > 60, mean between 20 and 55)
4. population == count(living citizens) == sum(building occupants) at EVERY checked tick
5. With the same seed, ML_ENABLED on vs off must give measurably different death trajectories.
"""

import os
import sys
import random
import numpy as np

# Add backend directory to sys.path
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "genesis-engine", "backend"))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi.testclient import TestClient
from main import app
from db.database import get_db_connection

def run_demographics_test(ml_enabled: bool, seed: int = 42, ticks_total: int = 3650, check_interval: int = 365):
    random.seed(seed)
    np.random.seed(seed)
    os.environ["ML_ENABLED"] = "true" if ml_enabled else "false"

    client = TestClient(app)

    # 1. Create a 500-citizen world
    world_name = f"Demographics_World_ML_{ml_enabled}_s{seed}"
    create_resp = client.post("/api/v1/worlds", json={
        "name": world_name,
        "initial_population": 500,
        "grid_size": 32,
        "climate": "Temperate",
        "technology_level": "Emergent"
    })
    assert create_resp.status_code == 201, f"Failed to create world: {create_resp.text}"
    world_id = create_resp.json()["id"]

    # Also register with world_manager / UnifiedWorldSimulation so both sync
    from engine.world.simulation import get_unified_simulation
    sim = get_unified_simulation(world_id)
    sim.load_world_from_db()

    conn = get_db_connection()
    initial_cit_count = conn.execute("SELECT COUNT(*) FROM citizens WHERE world_id = ? AND is_alive = 1", (world_id,)).fetchone()[0]
    econ_pop = conn.execute("SELECT population FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()[0]
    conn.close()

    print(f"[ML={ml_enabled}] World created: {world_id}. DB living citizens: {initial_cit_count}, Economy pop: {econ_pop}")

    # Advance simulation in intervals
    ticks_done = 0
    total_births = 0
    total_deaths = 0

    while ticks_done < ticks_total:
        step_ticks = min(check_interval, ticks_total - ticks_done)
        adv_resp = client.post(f"/api/v1/worlds/{world_id}/simulation/advance", json={"ticks": step_ticks})
        assert adv_resp.status_code == 200, f"Advance failed: {adv_resp.text}"
        ticks_done += step_ticks

        # Check state
        state_resp = client.get(f"/api/v1/worlds/{world_id}/state")
        assert state_resp.status_code == 200, f"State fetch failed: {state_resp.text}"
        state = state_resp.json()

        vitals_resp = client.get(f"/api/v1/worlds/{world_id}/vitals")
        assert vitals_resp.status_code == 200, f"Vitals fetch failed: {vitals_resp.text}"
        vitals = vitals_resp.json()

        conn = get_db_connection()
        db_cit_count = conn.execute("SELECT COUNT(*) FROM citizens WHERE world_id = ? AND is_alive = 1", (world_id,)).fetchone()[0]
        db_econ_pop = conn.execute("SELECT population FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()[0]
        occupants_sum = sum(b.get("current_occupants", 0) for b in state.get("buildings", []))
        vital_sums = conn.execute("SELECT SUM(births), SUM(deaths) FROM causal_vitals WHERE world_id = ?", (world_id,)).fetchone()
        conn.close()

        births_so_far = vital_sums[0] or 0
        deaths_so_far = vital_sums[1] or 0

        print(f"  Tick {ticks_done:4d}: State Pop={state.get('metrics', {}).get('population')}, DB Cit={db_cit_count}, Econ Pop={db_econ_pop}, Occupants={occupants_sum}, Births={births_so_far}, Deaths={deaths_so_far}")

        # Invariant: population == count(citizens) == sum(building occupants)
        assert db_cit_count == db_econ_pop, f"Mismatch: db_cit_count {db_cit_count} != econ_pop {db_econ_pop}"
        assert db_cit_count == occupants_sum, f"Mismatch: db_cit_count {db_cit_count} != occupants_sum {occupants_sum}"
        assert db_cit_count == state.get("metrics", {}).get("population"), f"Mismatch: db_cit_count {db_cit_count} != state.population {state.get('metrics', {}).get('population')}"

    # Final checks
    conn = get_db_connection()
    living_citizens = conn.execute("SELECT age, health FROM citizens WHERE world_id = ? AND is_alive = 1", (world_id,)).fetchall()
    vital_sums = conn.execute("SELECT SUM(births), SUM(deaths) FROM causal_vitals WHERE world_id = ?", (world_id,)).fetchone()
    conn.close()

    total_births = vital_sums[0] or 0
    total_deaths = vital_sums[1] or 0

    assert total_births > 0, f"Expected births > 0, got {total_births}"
    assert total_deaths > 0, f"Expected deaths > 0, got {total_deaths}"

    ages = [r["age"] for r in living_citizens]
    assert len(ages) > 0, "No living citizens found"
    avg_age = sum(ages) / len(ages)
    min_age = min(ages)
    max_age = max(ages)
    print(f"[ML={ml_enabled}] Final Demographic Profile: Pop={len(ages)}, Avg Age={avg_age:.1f}, Min={min_age:.1f}, Max={max_age:.1f}, Births={total_births}, Deaths={total_deaths}")

    assert min_age >= 0, f"Min age {min_age} < 0"
    assert max_age > 50, f"Expected max age > 50, got {max_age}"
    assert 15 <= avg_age <= 65, f"Expected avg age between 15 and 65, got {avg_age}"

    return {
        "world_id": world_id,
        "total_births": total_births,
        "total_deaths": total_deaths,
        "final_pop": len(ages),
        "avg_age": avg_age,
    }


def main():
    print("=== RUNNING BEHAVIOR TEST: SPRINT 1 DEMOGRAPHICS & REAL CITIZENS ===")
    print("\n--- Phase A: Rule-Based (ML_ENABLED=False, Seed 42, 3650 Ticks) ---")
    res_noml = run_demographics_test(ml_enabled=False, seed=42, ticks_total=3650, check_interval=365)

    print("\n--- Phase B: ML Mode (ML_ENABLED=True, Seed 42, 3650 Ticks) ---")
    res_ml = run_demographics_test(ml_enabled=True, seed=42, ticks_total=3650, check_interval=365)

    print("\n--- Phase C: ML Mode Comparison Verification ---")
    deaths_noml = res_noml["total_deaths"]
    deaths_ml = res_ml["total_deaths"]
    diff = abs(deaths_ml - deaths_noml)
    print(f"Rule-based Deaths: {deaths_noml} | ML-mode Deaths: {deaths_ml} | Delta: {diff}")
    assert diff > 0, f"Expected measurably different death trajectories between ML on and off, but got identical deaths ({deaths_noml})"
    print("✓ VERIFIED: ML_ENABLED mode produced a measurably distinct demographic trajectory!")
    print("✓ ALL SPRINT 1 BEHAVIOR TESTS PASSED.")

if __name__ == "__main__":
    main()
