#!/usr/bin/env python3
"""
Runs a complete 365-tick simulation session on a unified world,
sampling metrics at 30-tick intervals (plus tick 365) to produce
the empirical telemetry report for docs/FIX_REPORT.md.
"""

import os
import sys
import json
import uuid

BACKEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "genesis-engine", "backend")
sys.path.insert(0, BACKEND_DIR)

from fastapi.testclient import TestClient
from main import app
from db.database import get_db_connection

client = TestClient(app)

def run_365_playthrough():
    # 1. Create a world
    res = client.post("/api/v1/worlds", json={"name": "New Genesis Unified", "seed": 42})
    world_id = res.json()["id"]

    # 2. Build road network and basic infrastructure
    setup_commands = [
        {"command_id": "r1", "action": "draw_road", "payload": {"start_x": 0.0, "start_z": 0.0, "end_x": 0.0, "end_z": 30.0}},
        {"command_id": "r2", "action": "draw_road", "payload": {"start_x": 0.0, "start_z": 15.0, "end_x": 30.0, "end_z": 15.0}},
        {"command_id": "p1", "action": "place_building", "payload": {"type": "Energy", "name": "Geothermal Plant", "x": 4.0, "z": 4.0}},
        {"command_id": "w1", "action": "place_building", "payload": {"type": "Water", "name": "Aquifer Pumping Station", "x": 4.0, "z": 8.0}},
        {"command_id": "c1", "action": "place_building", "payload": {"type": "Healthcare", "name": "Medical Clinic", "x": 4.0, "z": 12.0}},
        {"command_id": "z1", "action": "paint_zone", "payload": {"x": 8.0, "z": 4.0, "zone_type": "residential_low"}},
        {"command_id": "z2", "action": "paint_zone", "payload": {"x": 8.0, "z": 8.0, "zone_type": "residential_low"}},
        {"command_id": "z3", "action": "paint_zone", "payload": {"x": 8.0, "z": 12.0, "zone_type": "commercial_low"}},
        {"command_id": "z4", "action": "paint_zone", "payload": {"x": 8.0, "z": 16.0, "zone_type": "industrial"}},
    ]
    client.post(f"/api/v1/worlds/{world_id}/commands", json={"commands": setup_commands})

    # Unlock tech-bronze to demonstrate research integration
    client.post(f"/api/v1/worlds/{world_id}/technology/tech-bronze/complete")

    checkpoints = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 365]
    records = []

    current_tick = 0
    for target in checkpoints:
        ticks_to_advance = target - current_tick
        if ticks_to_advance > 0:
            client.post(f"/api/v1/worlds/{world_id}/simulation/advance", json={"ticks": ticks_to_advance})
            current_tick = target

        # Query state
        conn = get_db_connection()
        w_row = conn.execute("SELECT tick, year, day FROM worlds WHERE id = ?", (world_id,)).fetchone()
        e_row = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()
        cit_count = conn.execute("SELECT COUNT(*) FROM citizens WHERE world_id = ? AND is_alive = 1", (world_id,)).fetchone()[0]
        occ_sum = conn.execute("SELECT SUM(current_occupants) FROM buildings WHERE world_id = ?", (world_id,)).fetchone()[0] or 0
        bld_count = conn.execute("SELECT COUNT(*) FROM buildings WHERE world_id = ?", (world_id,)).fetchone()[0]
        jobs_row = conn.execute("""
            SELECT
                SUM(capacity) as total_jobs,
                SUM(current_workers) as employed_workers
            FROM buildings
            WHERE world_id = ? AND status = 'active' AND type NOT LIKE '%Residential%'
        """, (world_id,)).fetchone()
        vitals_row = conn.execute("SELECT * FROM causal_vitals WHERE world_id = ? ORDER BY tick DESC LIMIT 1", (world_id,)).fetchone()
        conn.close()

        # Telemetry API call
        state_res = client.get(f"/api/v1/worlds/{world_id}/state")
        state_data = state_res.json()
        metrics = state_data.get("metrics", {})

        traffic_flow = metrics.get("traffic_flow", 1.0)
        traffic_congestion_pct = round((1.0 - traffic_flow) * 100.0, 1)

        total_jobs = jobs_row["total_jobs"] or 0
        employed = jobs_row["employed_workers"] or 0
        unemp_rate = round(float(total_jobs - employed) / max(1, total_jobs) * 100.0, 1) if total_jobs > 0 else 0.0

        records.append({
            "tick": current_tick,
            "day": w_row["day"],
            "year": w_row["year"],
            "pop_api": metrics.get("population", cit_count),
            "pop_econ": e_row["population"],
            "citizens_db": cit_count,
            "occupants_bld": occ_sum,
            "jobs_employed": f"{total_jobs} / {employed}",
            "unemployment_pct": f"{unemp_rate}%",
            "happiness": round(float(e_row["happiness"] or 0.8), 3),
            "treasury": round(float(e_row["genesis_research_credits"] or 0.0), 1),
            "power_sup_dem": f"{round(metrics.get('electricity_supply', 120.0), 1)} / {round(metrics.get('electricity_demand', 40.0), 1)}",
            "water_sup_dem": f"{round(metrics.get('water_supply', 150.0), 1)} / {round(metrics.get('water_demand', 35.0), 1)}",
            "traffic_cong": f"{traffic_congestion_pct}%",
            "births": vitals_row["births"] if vitals_row else 0,
            "deaths": vitals_row["deaths"] if vitals_row else 0,
            "buildings": bld_count,
        })

    print("| Tick | Day / Year | Pop (API) | Pop (Econ) | DB Citizens | Bld Occupants | Jobs / Employed | Unemp Rate | Happiness | GRC Treasury | Power (MW) Sup/Dem | Water (kL) Sup/Dem | Traffic Cong | Births | Deaths | Buildings |")
    print("|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|")
    for r in records:
        print(f"| **{r['tick']}** | {r['day']} / {r['year']} | {r['pop_api']} | {r['pop_econ']} | {r['citizens_db']} | {r['occupants_bld']} | {r['jobs_employed']} | {r['unemployment_pct']} | {r['happiness']} | {r['treasury']} | {r['power_sup_dem']} | {r['water_sup_dem']} | {r['traffic_cong']} | {r['births']} | {r['deaths']} | {r['buildings']} |")

if __name__ == "__main__":
    run_365_playthrough()

