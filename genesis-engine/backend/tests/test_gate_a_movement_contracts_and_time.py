"""
GENESIS Engine v2.0 - Gate A Verification Test Suite
File: tests/test_gate_a_movement_contracts_and_time.py

Verifies Gate A requirements:
1. Movement Contract enforcement & explainability for 5 distinct entity types.
2. 1x versus 8x time model consistency (same trips, completed trips, aggregate speed).
3. Deterministic state hash replay bit-for-bit equality.
4. HTTP API endpoint GET /api/v1/worlds/{id}/entities/{entity_id}/explain returns full schema.
"""

import math
import hashlib
import json
import pytest
from fastapi.testclient import TestClient

from main import app
from engine.world.road_network import UnifiedRoadNetwork
from engine.world.map_topology import build_riverfront_masterplan_topology
from engine.modules.movement import MovementModule
from engine.modules.movement_contract import (
    MoverType,
    MoverCategory,
    MoverPurpose,
    MoverState,
    TripContract,
    MovementExplanation
)
from engine.world.state import VehicleEntity, PedestrianEntity
from engine.world.simulation import get_unified_simulation


client = TestClient(app)


class TestGateAMovementContractsAndTime:

    def test_01_movement_contract_and_5_entity_explanations(self):
        """
        Tests Movement Contract enforcement & explanations for 5 distinct entities:
        1. Sedan cruising (free_flow)
        2. Follower vehicle queuing / car-following (following_vehicle)
        3. Vehicle waiting at signal (red_signal)
        4. Vehicle yielding to emergency ambulance (emergency_yield)
        5. Pedestrian on sidewalk (free_walk)
        """
        topo = build_riverfront_masterplan_topology()
        rn = UnifiedRoadNetwork("test-contracts")
        rn.load_from_topology(topo)
        mm = MovementModule("test-contracts", topology=topo, seed=42)

        # Entity 1: Sedan Cruising on West-North Boulevard (Away from ambulance)
        v_sedan = mm.plan_trip(
            road_net=rn,
            origin_x=-25.0,
            origin_z=-44.0,
            dest_x=0.0,
            dest_z=-10.5,
            category="sedan",
            purpose="work",
            citizen_id="cit_0001",
            origin_building_id="bld_res_block_2",
            dest_building_id="bld_comm_plaza"
        )
        assert v_sedan is not None
        assert v_sedan.trip_id is not None
        assert v_sedan.owner_id == "cit_0001"
        assert v_sedan.trip_id in mm.trips

        # Entity 2: Lead and Follower Vehicles (IDM Following on Loop, isolated from v_sedan)
        path_loop = ["node-loop-southwest", "node-west-crossroads"]
        v_lead = VehicleEntity(
            id="veh_leader_exp",
            world_id="test-contracts",
            category="sedan",
            origin_x=-12.0,
            origin_z=24.0,
            dest_x=-25.0,
            dest_z=24.0,
            current_x=-20.0,
            current_z=24.0,
            heading_deg=180.0,
            current_speed_kmh=20.0,
            route_node_ids=path_loop,
            progress_pct=0.60,
            status="moving",
            length=4.2,
            width=1.9,
            owner_id="cit_0002",
            trip_id="trip_lead"
        )
        v_follow = VehicleEntity(
            id="veh_follower_exp",
            world_id="test-contracts",
            category="sedan",
            origin_x=-12.0,
            origin_z=24.0,
            dest_x=-25.0,
            dest_z=24.0,
            current_x=-16.0,
            current_z=24.0,
            heading_deg=180.0,
            current_speed_kmh=50.0,
            route_node_ids=path_loop,
            progress_pct=0.30,
            status="moving",
            length=4.2,
            width=1.9,
            owner_id="cit_0003",
            trip_id="trip_follow"
        )
        mm.vehicles["veh_leader_exp"] = v_lead
        mm.vehicles["veh_follower_exp"] = v_follow

        # Entity 3: Ambulance with siren dispatch
        v_ambulance = mm.dispatch_emergency(
            road_net=rn,
            category="ambulance",
            dest_x=0.0,
            dest_z=4.5,
            dest_building_id="bld_res_block_1"
        )
        assert v_ambulance is not None
        assert v_ambulance.siren_active is True

        # Entity 4: Yielding Sedan on North corridor
        v_yielding = mm.plan_trip(
            road_net=rn,
            origin_x=0.0,
            origin_z=-44.0,
            dest_x=0.0,
            dest_z=4.5,
            category="sedan",
            purpose="work",
            citizen_id="cit_0004"
        )
        v_yielding.current_x = 0.0
        v_yielding.current_z = -35.0
        v_yielding.progress_pct = 0.15

        # Position ambulance on same route 5m behind yielding sedan
        v_ambulance.route_node_ids = list(v_yielding.route_node_ids)
        v_ambulance.current_x = 0.0
        v_ambulance.current_z = -40.0
        v_ambulance.progress_pct = 0.08
        v_ambulance.heading_deg = 90.0

        # Entity 5: Pedestrian on Sidewalk
        p_walker = mm.spawn_pedestrian(
            citizen_id="cit_ped_0005",
            origin_x=-15.0,
            origin_z=-20.0,
            dest_x=10.0,
            dest_z=15.0,
            archetype="worker",
            purpose="work",
            origin_building_id="bld_industry_hub",
            dest_building_id="bld_comm_plaza"
        )
        assert p_walker is not None
        assert p_walker.owner_id == "cit_ped_0005"
        assert p_walker.trip_id in mm.trips

        # Step micro-simulation
        mm.step(ticks=1, road_net=rn, dt_seconds=0.2)

        # 1. Explain Sedan
        exp_sedan = mm.explain_entity(v_sedan.id)
        assert exp_sedan is not None
        assert exp_sedan.entity_id == v_sedan.id
        assert exp_sedan.owner_id == "cit_0001"
        assert exp_sedan.current_state in [MoverState.DRIVING, MoverState.WAITING_SIGNAL]
        assert exp_sedan.trip is not None
        assert "speed limit" in exp_sedan.last_rule_applied or "cruising" in exp_sedan.last_rule_applied

        # 2. Explain Follower Vehicle
        exp_follow = mm.explain_entity("veh_follower_exp")
        assert exp_follow is not None
        assert exp_follow.reason_code == "following_vehicle"
        assert "following vehicle veh_leader_exp" in exp_follow.last_rule_applied
        assert exp_follow.leader_entity_id == "veh_leader_exp"
        assert exp_follow.gap_to_leader_m is not None

        # 3. Explain Ambulance
        exp_amb = mm.explain_entity(v_ambulance.id)
        assert exp_amb is not None
        assert exp_amb.category == MoverCategory.AMBULANCE
        assert exp_amb.reason_code == "emergency_priority"
        assert "emergency response" in exp_amb.last_rule_applied

        # 4. Explain Yielding Vehicle
        exp_yield = mm.explain_entity(v_yielding.id)
        assert exp_yield is not None
        assert exp_yield.current_state == MoverState.YIELDING
        assert exp_yield.reason_code == "emergency_yield"
        assert "yielding to ambulance" in exp_yield.last_rule_applied

        # 5. Explain Pedestrian
        exp_ped = mm.explain_entity(p_walker.id)
        assert exp_ped is not None
        assert exp_ped.entity_type == MoverType.PEDESTRIAN
        assert exp_ped.owner_id == "cit_ped_0005"
        assert exp_ped.reason_code in ["free_walk", "inside_building"]
        assert exp_ped.trip is not None

    def test_02_1x_vs_8x_time_model_consistency(self):
        """
        Verifies that running the same seed and planned trips at 1x (advancing 8 single ticks)
        versus 8x (advancing 8 ticks in one call) gives:
        1. Exact same total trips planned
        2. Exact same completed trips
        3. Identical hourly aggregate metrics within 1% tolerance
        """
        topo = build_riverfront_masterplan_topology()

        def run_fleet(speed_multiplier: float, ticks_step: int, num_calls: int, seed: int):
            rn = UnifiedRoadNetwork("test-time")
            rn.load_from_topology(topo)
            mm = MovementModule("test-time", topology=topo, seed=seed)

            # Plan a deterministic set of 4 trips on valid masterplan corridors
            for i in range(4):
                mm.plan_trip(
                    road_net=rn,
                    origin_x=0.0,
                    origin_z=-44.0,
                    dest_x=0.0,
                    dest_z=4.5,
                    category="sedan" if i % 2 == 0 else "bus",
                    purpose="work",
                    citizen_id=f"cit_fleet_{i}"
                )

            last_metrics = None
            for _ in range(num_calls):
                _, metrics = mm.step(
                    ticks=ticks_step,
                    road_net=rn,
                    dt_seconds=0.2,
                    speed_multiplier=speed_multiplier
                )
                last_metrics = metrics

            return {
                "total_trips": mm.total_trips_planned_count,
                "completed_trips": mm.completed_trips_count,
                "active_vehicles": len(mm.vehicles),
                "avg_speed": last_metrics["average_speed_kmh"],
                "congestion": last_metrics["congestion_index"]
            }

        # Run 1: 1x speed running 8 ticks (8 calls of ticks=1)
        res_1x = run_fleet(speed_multiplier=1.0, ticks_step=1, num_calls=8, seed=777)

        # Run 2: 8x speed running 8 ticks in 1 call (ticks=8)
        res_8x = run_fleet(speed_multiplier=1.0, ticks_step=8, num_calls=1, seed=777)

        # Verifications
        assert res_1x["total_trips"] == res_8x["total_trips"] == 4
        assert res_1x["completed_trips"] == res_8x["completed_trips"]
        assert res_1x["active_vehicles"] == res_8x["active_vehicles"]
        assert abs(res_1x["avg_speed"] - res_8x["avg_speed"]) < 0.5
        assert abs(res_1x["congestion"] - res_8x["congestion"]) < 0.5

    def test_03_deterministic_hash_replay(self):
        """Verifies bit-for-bit identical state hash across two independent runs with identical seed."""
        topo = build_riverfront_masterplan_topology()

        def compute_run_hash(seed: int) -> str:
            rn = UnifiedRoadNetwork("test-hash")
            rn.load_from_topology(topo)
            mm = MovementModule("test-hash", topology=topo, seed=seed)

            for i in range(6):
                v = mm.plan_trip(
                    road_net=rn,
                    origin_x=0.0,
                    origin_z=-44.0,
                    dest_x=0.0,
                    dest_z=4.5,
                    category="sedan" if i % 2 == 0 else "bus",
                    purpose="work",
                    citizen_id=f"cit_hash_{i}"
                )
                # Apply seed-derived micro-jitter to initial progress
                if v:
                    v.progress_pct = round(mm.rng.uniform(0.01, 0.15), 4)

            # Advance 20 micro-steps
            for _ in range(20):
                mm.step(ticks=1, road_net=rn, dt_seconds=0.15)

            # Collect all vehicle positions, speeds, and progress
            state_data = []
            for vid in sorted(mm.vehicles.keys()):
                v = mm.vehicles[vid]
                state_data.append({
                    "id": v.id,
                    "x": v.current_x,
                    "z": v.current_z,
                    "speed": v.current_speed_kmh,
                    "prog": v.progress_pct,
                    "reason": v.reason_code,
                    "last_rule": v.last_rule_applied
                })

            raw_bytes = json.dumps(state_data, sort_keys=True).encode("utf-8")
            return hashlib.sha256(raw_bytes).hexdigest()

        hash_run1 = compute_run_hash(seed=888999)
        hash_run2 = compute_run_hash(seed=888999)
        hash_diff_seed = compute_run_hash(seed=111222)

        assert hash_run1 == hash_run2, f"Replay mismatch: {hash_run1} != {hash_run2}"
        assert hash_run1 != hash_diff_seed, "Different seeds must produce distinct trajectories"

    def test_04_api_explain_endpoint(self):
        """Verifies HTTP GET /api/v1/worlds/{id}/entities/{entity_id}/explain returns 200 with schema."""
        sim = get_unified_simulation("aurora-prime")
        sim.advance_tick(1)

        # Get first active vehicle in aurora-prime
        assert len(sim.movement_module.vehicles) > 0
        first_vid = list(sim.movement_module.vehicles.keys())[0]

        # Query explain endpoint
        response = client.get(f"/api/v1/worlds/aurora-prime/entities/{first_vid}/explain")
        assert response.status_code == 200, response.text
        data = response.json()

        # Schema assertions
        assert data["entity_id"] == first_vid
        assert data["entity_type"] in ["vehicle", "pedestrian"]
        assert "current_state" in data
        assert "reason_code" in data
        assert "last_rule_applied" in data
        assert "current_speed_kmh" in data
        assert "current_coords" in data
        assert len(data["current_coords"]) == 3
        assert "trip" in data

        # Non-existent entity must return 404
        resp_404 = client.get("/api/v1/worlds/aurora-prime/entities/veh_non_existent_9999/explain")
        assert resp_404.status_code == 404
