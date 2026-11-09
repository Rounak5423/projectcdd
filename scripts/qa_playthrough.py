import sys
import os
import json
import time
import requests
import sqlite3

BASE_URL = "http://127.0.0.1:8000/api/v1"
DB_PATH = "genesis-engine/backend/db/genesis.db"

def run_qa_session():
    print("=== STARTING QA PLAYTHROUGH SESSION ===")
    session = requests.Session()

    # 1. Admin Login
    print("\n1. Logging in as admin...")
    login_res = session.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "AdminPassword123!"
    })
    if login_res.status_code != 200:
        print(f"FAILED LOGIN: {login_res.status_code} {login_res.text}")
        return
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    session.headers.update(headers)
    print("Admin login successful. Token acquired.")

    # 2. Create new world
    world_id = f"qa-world-{int(time.time())}"
    print(f"\n2. Creating new world '{world_id}'...")
    create_res = session.post(f"{BASE_URL}/worlds", json={
        "name": "Reality Check Polis",
        "initial_population": 120,
        "grid_size": 32,
        "climate": "Temperate",
        "technology_level": "Emergent"
    })
    print(f"Create world status: {create_res.status_code}")
    world_data = create_res.json()
    world_id = world_data.get("id") or world_data.get("world_id") or world_id
    print(f"Created world ID: {world_id}")

    # 3. Issue initial city-building commands
    print("\n3. Placing infrastructure commands...")
    commands = [
        # Roads
        {"action": "draw_road", "payload": {"start_node_id": "rn_qa_1", "end_node_id": "rn_qa_2", "start_pos": [-10, 0, 0], "end_pos": [10, 0, 0], "road_type": "two_lane"}},
        {"action": "draw_road", "payload": {"start_node_id": "rn_qa_2", "end_node_id": "rn_qa_3", "start_pos": [10, 0, 0], "end_pos": [10, 0, 20], "road_type": "two_lane"}},
        # Power & Water
        {"action": "place_building", "payload": {"id": "bld_power_qa", "type": "Energy", "category": "energy", "x": -8, "y": 0.6, "z": 2, "footprint_x": 3, "footprint_z": 3}},
        {"action": "place_building", "payload": {"id": "bld_water_qa", "type": "Water", "category": "water", "x": -8, "y": 0.6, "z": 6, "footprint_x": 3, "footprint_z": 3}},
        # Healthcare & Education services
        {"action": "place_building", "payload": {"id": "bld_clinic_qa", "type": "Healthcare", "category": "healthcare", "x": 0, "y": 0.6, "z": 4, "footprint_x": 2, "footprint_z": 2}},
        {"action": "place_building", "payload": {"id": "bld_school_qa", "type": "Education", "category": "education", "x": 4, "y": 0.6, "z": 4, "footprint_x": 2, "footprint_z": 2}},
        # Zones
        {"action": "paint_zone", "payload": {"tile_id": "zt_res_1", "x": 2, "z": 2, "zone_type": "residential_low"}},
        {"action": "paint_zone", "payload": {"tile_id": "zt_res_2", "x": 4, "z": 2, "zone_type": "residential_high"}},
        {"action": "paint_zone", "payload": {"tile_id": "zt_com_1", "x": 6, "z": 2, "zone_type": "commercial_low"}},
        {"action": "paint_zone", "payload": {"tile_id": "zt_ind_1", "x": 8, "z": 2, "zone_type": "industrial"}},
    ]

    cmd_res = session.post(f"{BASE_URL}/worlds/{world_id}/commands", json={"commands": commands})
    print(f"Commands dispatch status: {cmd_res.status_code}")
    print("Commands response:", json.dumps(cmd_res.json(), indent=2))

    # 4. Run 365-tick session in increments of 30 ticks
    print("\n4. Running 365-tick simulation session in 30-tick intervals...")
    ticks_target = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360, 365]
    records = []

    current_sim_tick = 0
    for target in ticks_target:
        step_needed = target - current_sim_tick
        if step_needed > 0:
            tick_res = session.post(f"{BASE_URL}/worlds/{world_id}/simulation/advance", json={"ticks": step_needed})
            if tick_res.status_code != 200:
                print(f"Step error at tick {target}: {tick_res.status_code} {tick_res.text}")
            current_sim_tick = target

        # Query state via API
        state_res = session.get(f"{BASE_URL}/worlds/{world_id}/state")
        state = state_res.json() if state_res.status_code == 200 else {}

        # Query universal world endpoint
        world_info_res = session.get(f"{BASE_URL}/worlds/{world_id}")
        world_info = world_info_res.json() if world_info_res.status_code == 200 else {}

        # Query vitals
        vitals_res = session.get(f"{BASE_URL}/worlds/{world_id}/vitals?limit=1")
        vitals_data = vitals_res.json().get("data", []) if vitals_res.status_code == 200 else []
        vitals = vitals_data[-1] if vitals_data else {}

        # Query raw DB citizens count
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        db_citizens_cnt = conn.execute("SELECT COUNT(*) as c FROM citizens WHERE world_id = ?", (world_id,)).fetchone()["c"]
        db_alive_cnt = conn.execute("SELECT COUNT(*) as c FROM citizens WHERE world_id = ? AND is_alive = 1", (world_id,)).fetchone()["c"]
        db_bld_cnt = conn.execute("SELECT COUNT(*) as c FROM buildings WHERE world_id = ?", (world_id,)).fetchone()["c"]
        db_econ = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()
        conn.close()

        rec = {
            "tick": current_sim_tick,
            "population_api": state.get("metrics", {}).get("population", world_info.get("population", 0)),
            "population_econ_db": db_econ["population"] if db_econ else None,
            "citizens_db_rows": db_citizens_cnt,
            "citizens_alive_rows": db_alive_cnt,
            "building_occupants_sum": sum(b.get("current_occupants", 0) for b in state.get("buildings", [])),
            "jobs_total": state.get("metrics", {}).get("total_jobs", 0),
            "employed_citizens": state.get("metrics", {}).get("employed_citizens", 0),
            "unemployment_rate": state.get("metrics", {}).get("unemployment_rate", 0),
            "happiness": round(state.get("metrics", {}).get("average_happiness", world_info.get("happiness", 0)), 3),
            "treasury_gdp": round(state.get("metrics", {}).get("daily_tax_revenue", 0), 2),
            "materials": round(db_econ["materials"] if db_econ else 0, 1),
            "power_supply_mw": state.get("utilities", {}).get("total_power_supply_mw", 0),
            "power_demand_mw": state.get("utilities", {}).get("total_power_demand_mw", 0),
            "water_supply_t": state.get("utilities", {}).get("total_water_supply_t", 0),
            "water_demand_t": state.get("utilities", {}).get("total_water_demand_t", 0),
            "traffic_congestion_idx": state.get("traffic", {}).get("congestion_index", 0),
            "traffic_speed_kmh": state.get("traffic", {}).get("average_speed_kmh", 0),
            "births_vital": vitals.get("births", 0),
            "deaths_vital": vitals.get("deaths", 0),
            "deaths_starvation": vitals.get("deaths_starvation", 0),
            "deaths_dehydration": vitals.get("deaths_dehydration", 0),
            "building_count": len(state.get("buildings", [])) or db_bld_cnt,
        }
        records.append(rec)
        print(f"Tick {current_sim_tick:3d} | Pop: {rec['population_api']} | EconPop: {rec['population_econ_db']} | DBCitizens: {rec['citizens_db_rows']} | BldOcc: {rec['building_occupants_sum']} | Blds: {rec['building_count']} | Power: {rec['power_supply_mw']:.0f}/{rec['power_demand_mw']:.0f} | Water: {rec['water_supply_t']:.0f}/{rec['water_demand_t']:.0f} | Congestion: {rec['traffic_congestion_idx']}% | Births: {rec['births_vital']} | Deaths: {rec['deaths_vital']}")

    with open("/tmp/qa_session_records.json", "w") as f:
        json.dump(records, f, indent=2)
    print("\nSaved 365-tick session telemetry to /tmp/qa_session_records.json")

if __name__ == "__main__":
    run_qa_session()
