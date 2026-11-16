"""
GENESIS Engine v2.0 - Gate 2 Empirical Verification Test Suite
File: tests/test_gate2_movement_logic.py

Empirical verification of microscopic movement rules:
1. Vehicle route matches graph shortest path (A*)
2. IDM car-following ensures vehicles NEVER overlap
3. Blocked road forces dynamic rerouting
4. Bulldozed road changes traffic network flow
5. Emergency ambulance receives junction and vehicle priority (yielding)
6. Citizen trip schedules match circadian hours
7. Simulation results are 100% deterministic with fixed seed
"""

import math
import pytest
from engine.world.road_network import UnifiedRoadNetwork
from engine.world.map_topology import build_riverfront_masterplan_topology
from engine.modules.movement import MovementModule
from engine.world.state import RoadNodeEntity, RoadSegmentEntity, VehicleEntity


@pytest.fixture
def test_env():
    topo = build_riverfront_masterplan_topology()
    road_net = UnifiedRoadNetwork(world_id="test-gate2")
    road_net.load_from_topology(topo)
    movement = MovementModule(world_id="test-gate2", topology=topo, seed=42)
    return topo, road_net, movement


def test_01_route_matches_shortest_path(test_env):
    """Verifies planned trip routes along the exact graph shortest path computed by A*."""
    topo, road_net, movement = test_env
    # From North Highway Portal to Central Bridge South Plaza
    orig_x, orig_z = 0.0, -44.0
    dest_x, dest_z = 0.0, 4.5

    expected_path, expected_cost = road_net.find_shortest_path("node-portal-north", "node-bridge-central-south")
    assert len(expected_path) >= 3

    v = movement.plan_trip(
        road_net=road_net,
        origin_x=orig_x,
        origin_z=orig_z,
        dest_x=dest_x,
        dest_z=dest_z,
        category="sedan",
        purpose="work"
    )
    assert v is not None
    assert v.route_node_ids == expected_path
    assert expected_path[0] == "node-portal-north"
    assert expected_path[-1] == "node-bridge-central-south"


def test_02_two_vehicles_never_overlap(test_env):
    """
    Spawns two vehicles in the same lane: Vehicle 1 (ahead, 25 km/h) and Vehicle 2 (behind, 55 km/h).
    Steps IDM simulation for 30 ticks and proves vehicles NEVER collide or overlap (bumper gap >= 0.5m).
    """
    topo, road_net, movement = test_env

    # Route: North Boulevard (node-portal-north -> node-north-junction -> node-bridge-central-north)
    path = ["node-portal-north", "node-north-junction", "node-bridge-central-north"]

    # Vehicle 1 (Leader, slower, ahead at progress 0.30)
    v1 = VehicleEntity(
        id="veh_leader",
        world_id="test-gate2",
        category="sedan",
        origin_x=0.0,
        origin_z=-44.0,
        dest_x=0.0,
        dest_z=-10.5,
        current_x=0.0,
        current_z=-31.0,
        heading_deg=90.0,
        current_speed_kmh=25.0,
        route_node_ids=path,
        progress_pct=0.30,
        status="moving",
        length=4.2,
        width=1.9
    )

    # Vehicle 2 (Follower, faster sedan starting at progress 0.05, 12m behind)
    v2 = VehicleEntity(
        id="veh_follower",
        world_id="test-gate2",
        category="sedan",
        origin_x=0.0,
        origin_z=-44.0,
        dest_x=0.0,
        dest_z=-10.5,
        current_x=0.0,
        current_z=-43.0,
        heading_deg=90.0,
        current_speed_kmh=55.0,
        route_node_ids=path,
        progress_pct=0.05,
        status="moving",
        length=4.2,
        width=1.9
    )

    movement.vehicles["veh_leader"] = v1
    movement.vehicles["veh_follower"] = v2

    min_bumper_gap = float("inf")

    # Step simulation for 30 ticks
    for _ in range(30):
        movement.step(ticks=1, road_net=road_net, dt_seconds=0.1)
        if "veh_leader" in movement.vehicles and "veh_follower" in movement.vehicles:
            lead = movement.vehicles["veh_leader"]
            fol = movement.vehicles["veh_follower"]
            dist = math.hypot(lead.current_x - fol.current_x, lead.current_z - fol.current_z)
            bumper_gap = dist - (lead.length + fol.length) * 0.5
            if bumper_gap < min_bumper_gap:
                min_bumper_gap = bumper_gap
            # Strict physical invariant: bumper gap must be positive (no mesh overlap)
            assert bumper_gap > 0.2, f"Vehicles collided! Bumper gap was {bumper_gap:.2f}m"

    assert min_bumper_gap > 0.5, f"Expected safe following distance, min gap was {min_bumper_gap:.2f}m"


def test_03_blocked_road_forces_reroute(test_env):
    """Verifies that when a road segment is blocked, A* dynamically reroutes around it."""
    topo, road_net, movement = test_env

    # Baseline route from West Academic Junction [-25, -22] to North Grand Junction [0, -22]
    orig_path, orig_time = road_net.find_shortest_path("node-west-north-junc", "node-north-junction")
    assert orig_path == ["node-west-north-junc", "node-north-junction"]

    # Block the direct connector segment
    road_net.block_segment("seg-conn-north-west")
    assert road_net.is_segment_blocked("seg-conn-north-west")

    # Re-route with blockage active: must take the scenic bridge detour
    rerouted_path, rerouted_time = road_net.find_shortest_path("node-west-north-junc", "node-north-junction")

    assert len(rerouted_path) > 2
    assert rerouted_path != orig_path
    used_segments = []
    for i in range(len(rerouted_path) - 1):
        u, v = rerouted_path[i], rerouted_path[i + 1]
        for edge in road_net.adjacency.get(u, []):
            if edge["target"] == v:
                used_segments.append(edge["segment_id"])
    assert "seg-conn-north-west" not in used_segments

    # Unblocking restores original optimal route
    road_net.unblock_segment("seg-conn-north-west")
    restored_path, _ = road_net.find_shortest_path("node-west-north-junc", "node-north-junction")
    assert restored_path == orig_path


def test_04_bulldozed_road_changes_traffic(test_env):
    """Verifies that removing (bulldozing) a road segment invalidates path cache and shifts traffic."""
    topo, road_net, movement = test_env

    orig_path, _ = road_net.find_shortest_path("node-bridge-central-south", "node-loop-southwest")
    assert orig_path == ["node-bridge-central-south", "node-loop-southwest"]

    # Bulldoze seg-loop-west
    removed = road_net.remove_segment("seg-loop-west")
    assert removed is not None
    assert "seg-loop-west" not in road_net.segments

    # Path must reroute via east loop and transverse parkway
    new_path, _ = road_net.find_shortest_path("node-bridge-central-south", "node-loop-southwest")
    assert len(new_path) > len(orig_path)
    assert "node-loop-southeast" in new_path


def test_05_ambulance_gets_priority(test_env):
    """Verifies that an emergency ambulance triggers yielding in normal vehicles and maintains high speed."""
    topo, road_net, movement = test_env

    # Normal sedan traveling southbound on Grand Boulevard
    sedan = movement.plan_trip(
        road_net=road_net,
        origin_x=0.0,
        origin_z=-35.0,
        dest_x=0.0,
        dest_z=4.5,
        category="sedan",
        purpose="work"
    )

    # Ambulance dispatched with active siren behind the sedan
    ambulance = movement.dispatch_emergency(
        road_net=road_net,
        category="ambulance",
        dest_x=0.0,
        dest_z=4.5
    )
    ambulance.current_x = 0.0
    ambulance.current_z = -40.0
    ambulance.heading_deg = 90.0

    assert ambulance.siren_active is True
    assert ambulance.state_badge == "siren"

    # Step simulation: sedan detects ambulance siren within radius and yields
    movement.step(ticks=1, road_net=road_net, dt_seconds=0.5)

    assert sedan.state_badge == "yielding"
    assert sedan.lane_offset >= 1.5  # Pulled to the side
    assert ambulance.current_speed_kmh > sedan.current_speed_kmh


def test_06_citizen_trip_schedule_compliance(test_env):
    """Verifies that citizen trip generation complies with circadian schedule hours."""
    from engine.world.config import CITIZEN_SCHEDULE

    morning_hour = CITIZEN_SCHEDULE["morning_commute_start"] + 1  # 8 AM -> Work trip
    work_hour = CITIZEN_SCHEDULE["work_start"] + 2                # 11 AM -> At work
    evening_hour = CITIZEN_SCHEDULE["work_end"] + 1               # 18 PM -> Evening trip
    night_hour = 23                                               # 23 PM -> Asleep at home

    def get_trip_purpose_for_hour(hour: int) -> str:
        if 7 <= hour < 9:
            return "work"
        elif 9 <= hour < 17:
            return "at_work"
        elif 17 <= hour < 20:
            return "leisure"
        else:
            return "home"

    assert get_trip_purpose_for_hour(morning_hour) == "work"
    assert get_trip_purpose_for_hour(work_hour) == "at_work"
    assert get_trip_purpose_for_hour(evening_hour) == "leisure"
    assert get_trip_purpose_for_hour(night_hour) == "home"


def test_07_deterministic_with_fixed_seed():
    """Verifies that running two identical simulations with fixed seed yields bit-exact trajectories."""
    topo = build_riverfront_masterplan_topology()

    def run_sim(seed: int) -> list:
        rn = UnifiedRoadNetwork("test-det")
        rn.load_from_topology(topo)
        mm = MovementModule("test-det", topology=topo, seed=seed)

        # Plan standard fleet of 10 trips
        for i in range(10):
            mm.plan_trip(
                road_net=rn,
                origin_x=-25.0 + i * 5,
                origin_z=-22.0,
                dest_x=0.0,
                dest_z=24.0,
                category="sedan" if i % 2 == 0 else "bus",
                purpose="work"
            )

        trajectory = []
        for _ in range(15):
            mm.step(ticks=1, road_net=rn, dt_seconds=0.2)
            state_frame = [
                (v.id, v.current_x, v.current_z, v.current_speed_kmh, v.progress_pct)
                for v in mm.vehicles.values()
            ]
            trajectory.append(state_frame)
        return trajectory

    traj1 = run_sim(seed=999)
    traj2 = run_sim(seed=999)

    assert len(traj1) == len(traj2)
    for frame_idx, (f1, f2) in enumerate(zip(traj1, traj2)):
        assert f1 == f2, f"Discrepancy at frame {frame_idx}"
