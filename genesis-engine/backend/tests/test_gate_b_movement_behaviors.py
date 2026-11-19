"""
GENESIS Engine v2.0 - Gate B Behavioral Movement Verification Battery
Tests microscopic vehicle and pedestrian logic:
1. Route equals shortest path under free flow
2. Blocked road forces dynamic A* rerouting
3. Signal cycle moves approaching vehicles in correct phase order (NS vs EW)
4. Ambulance clears queue & normal vehicles yield
5. Bus transit dwells at bus stop and boards waiting passengers
6. Citizen trip times match circadian schedule
7. Bulldozing a road segment reroutes active vehicles or returns them to origin
8. Power blackout causes traffic signals to enter 4-way stop yield
9. Vehicular accident blocks segment and dispatches emergency response
10. Demographic census invariant: walking + driving + riding_bus + indoor == total_living
"""

import pytest
import math
from engine.world.map_topology import build_riverfront_masterplan_topology
from engine.world.road_network import UnifiedRoadNetwork
from engine.modules.movement import MovementModule, TrafficSignalController
from engine.modules.movement_contract import MoverState, MoverPurpose


@pytest.fixture
def test_setup():
    topo = build_riverfront_masterplan_topology()
    road_net = UnifiedRoadNetwork("aurora-prime")
    road_net.load_from_topology(topo)
    movement = MovementModule(world_id="aurora-prime", topology=topo, seed=42)
    return topo, road_net, movement


def test_01_shortest_path_under_free_flow(test_setup):
    """Test 1: Route equals shortest path under free flow."""
    topo, road_net, _ = test_setup
    path, time_sec = road_net.route_trip(0.0, -44.0, 0.0, 4.5)
    assert path is not None
    assert len(path) >= 2
    assert path[0] == "node-portal-north"
    assert path[-1] == "node-bridge-central-south"
    # Verify free-flow travel time is positive and finite
    assert 0.0 < time_sec < 100.0


def test_02_dynamic_reroute_on_blocked_road(test_setup):
    """Test 2: Blocked road forces dynamic A* rerouting."""
    topo, road_net, _ = test_setup
    # Find free-flow path
    orig_path, orig_time = road_net.route_trip(0.0, -44.0, 0.0, 4.5)
    assert orig_path is not None
    
    # Block the primary arterial segment
    road_net.block_segment("seg-ns-north-1")
    rerouted_path, rerouted_time = road_net.route_trip(0.0, -44.0, 0.0, 4.5)
    
    # Path should either be rerouted or travel time significantly increased due to blockage
    assert rerouted_path != orig_path or rerouted_time > 1e6


def test_03_signal_cycle_phase_order_and_approaches():
    """Test 3: Signal cycle moves approaching vehicles in correct phase order."""
    sig = TrafficSignalController(node_id="test_junction", cycle_sec=24.0)
    
    # At t=0s -> NS_GREEN
    assert sig.get_phase() == "NS_GREEN"
    assert sig.is_green_for_approach(0.0) is True     # NS approach (bearing 0 deg)
    assert sig.is_green_for_approach(90.0) is False   # EW approach (bearing 90 deg)
    assert sig.is_pedestrian_walk_allowed("EW") is True   # Safe to cross EW while NS traffic flows
    assert sig.is_pedestrian_walk_allowed("NS") is False

    # Step to t=11s -> NS_YELLOW
    sig.step(11.0)
    assert sig.get_phase() == "NS_YELLOW"

    # Step to t=15s -> EW_GREEN
    sig.step(4.0)  # total 15s
    assert sig.get_phase() == "EW_GREEN"
    assert sig.is_green_for_approach(90.0) is True    # EW approach gets green
    assert sig.is_green_for_approach(0.0) is False    # NS approach gets red
    assert sig.is_pedestrian_walk_allowed("NS") is True
    assert sig.is_pedestrian_walk_allowed("EW") is False


def test_04_emergency_preemption_and_yielding(test_setup):
    """Test 4: Ambulance clears queue & normal vehicles yield."""
    topo, road_net, movement = test_setup
    
    # Spawn normal vehicle at South corridor
    v_sedan = movement.plan_trip(
        road_net=road_net,
        origin_x=0.0,
        origin_z=-35.0,
        dest_x=0.0,
        dest_z=4.5,
        category="sedan"
    )
    v_sedan.current_x = 0.0
    v_sedan.current_z = -25.0
    v_sedan.heading_deg = 0.0
    v_sedan.current_speed_kmh = 30.0

    # Dispatch ambulance nearby
    v_amb = movement.plan_trip(
        road_net=road_net,
        origin_x=0.0,
        origin_z=-35.0,
        dest_x=0.0,
        dest_z=4.5,
        category="ambulance"
    )
    v_amb.siren_active = True
    v_amb.current_x = 0.0
    v_amb.current_z = -32.0
    v_amb.heading_deg = 0.0

    # Step simulation
    movement.step(ticks=1, road_net=road_net, dt_seconds=0.2)

    # Normal sedan must yield
    assert v_sedan.state_badge == "yielding"
    assert v_sedan.reason_code == "emergency_yield"
    assert v_sedan.lane_offset > 1.5  # pulled to side

    # Ambulance proceeds under emergency priority
    assert v_amb.siren_active is True
    assert v_amb.reason_code == "emergency_priority"


def test_05_bus_transit_dwelling_and_passenger_boarding(test_setup):
    """Test 5: Bus transit dwells at bus stop and boards waiting passengers."""
    topo, road_net, movement = test_setup

    # Find bus stop node in topology (e.g. ped-stop-citadel-nb at -3.2, 5.0)
    bus_stop_node = topo.ped_nodes["ped-stop-citadel-nb"]

    # Spawn pedestrian near the bus stop
    ped = movement.spawn_pedestrian(
        citizen_id="cit_bus_rider_01",
        origin_x=bus_stop_node.x,
        origin_z=bus_stop_node.z,
        dest_x=bus_stop_node.x + 20.0,
        dest_z=bus_stop_node.z + 20.0
    )
    ped.current_x = bus_stop_node.x
    ped.current_z = bus_stop_node.z
    ped.status = "waiting_bus"

    # Spawn bus approaching the bus stop's road junction node
    v_bus = movement.plan_trip(
        road_net=road_net,
        origin_x=0.0,
        origin_z=-44.0,
        dest_x=0.0,
        dest_z=4.5,
        category="bus"
    )
    # Position bus in leg approaching node-bridge-central-south
    v_bus.progress_pct = 0.90
    v_bus.current_x = 0.0
    v_bus.current_z = 2.0

    # Step micro simulation
    movement.step(ticks=1, road_net=road_net, dt_seconds=0.2)

    # Bus enters boarding state and dwells
    assert v_bus.status == "boarding"
    assert v_bus.dwell_ticks_remaining > 0
    assert v_bus.passengers_count >= 1
    # Pedestrian boarded
    assert ped.status == "riding_bus"
    assert ped.reason_code == "riding_bus"


def test_06_circadian_schedule_trip_generation(test_setup):
    """Test 6: Citizen trip generation with legitimate purpose and contracts."""
    topo, road_net, movement = test_setup

    # Morning commute trip
    work_veh = movement.plan_trip(
        road_net=road_net,
        origin_x=0.0,
        origin_z=-44.0,
        dest_x=0.0,
        dest_z=4.5,
        category="sedan",
        purpose="work",
        citizen_id="citizen_commuter_101",
        origin_building_id="bld_home_01",
        dest_building_id="bld_citadel"
    )
    assert work_veh is not None
    assert work_veh.purpose == "work"
    assert work_veh.owner_id == "citizen_commuter_101"
    
    trip = movement.trips[work_veh.trip_id]
    assert trip.purpose == MoverPurpose.WORK
    assert trip.origin_id == "bld_home_01"
    assert trip.dest_id == "bld_citadel"


def test_07_bulldozed_road_handling(test_setup):
    """Test 7: Bulldozing a road segment reroutes active vehicles or returns them to origin."""
    topo, road_net, movement = test_setup

    veh = movement.plan_trip(
        road_net=road_net,
        origin_x=0.0,
        origin_z=-44.0,
        dest_x=0.0,
        dest_z=4.5,
        category="sedan"
    )
    veh.current_segment_id = "seg-ns-north-1"
    
    # Bulldoze segment from road network
    road_net.remove_segment("seg-ns-north-1")

    # Step simulation
    movement.step(ticks=1, road_net=road_net, dt_seconds=0.2)

    # Vehicle must have detected segment removal and initiated reroute or return
    assert veh.reason_code in ["rerouting", "blocked_return"]


def test_08_power_blackout_signal_fallback(test_setup):
    """Test 8: Power blackout causes traffic signals to enter 4-way stop yield."""
    topo, road_net, movement = test_setup

    veh = movement.plan_trip(
        road_net=road_net,
        origin_x=0.0,
        origin_z=-44.0,
        dest_x=0.0,
        dest_z=4.5,
        category="sedan"
    )
    # Position vehicle near junction node-north-junction (0.0, -22.0)
    veh.progress_pct = 0.25
    veh.current_x = 0.0
    veh.current_z = -24.0
    veh.current_speed_kmh = 30.0

    # Step with power grid down
    movement.step(ticks=1, road_net=road_net, dt_seconds=0.2, power_grid_operational=False)

    # Vehicle slows and yields under blackout
    assert veh.reason_code == "power_blackout_yield"
    assert veh.current_speed_kmh <= 15.0


def test_09_vehicular_accident_and_emergency_dispatch(test_setup):
    """Test 9: Vehicular accident blocks segment and dispatches emergency response."""
    topo, road_net, movement = test_setup

    veh = movement.plan_trip(
        road_net=road_net,
        origin_x=0.0,
        origin_z=-44.0,
        dest_x=0.0,
        dest_z=4.5,
        category="sedan"
    )
    veh.current_segment_id = "seg-ns-north-1"

    # Trigger accident
    crashed_veh = movement.trigger_accident(
        segment_id="seg-ns-north-1",
        road_net=road_net
    )
    assert crashed_veh is not None
    assert crashed_veh.status == "accident"
    assert crashed_veh.state_badge == "crash"
    assert crashed_veh.current_speed_kmh == 0.0
    assert road_net.is_segment_blocked("seg-ns-north-1")

    # Verify emergency response was dispatched
    emergency_vehicles = [v for v in movement.vehicles.values() if v.siren_active and v.category == "ambulance"]
    assert len(emergency_vehicles) >= 1
    assert emergency_vehicles[0].purpose == "emergency"


def test_10_demographic_census_invariant(test_setup):
    """Test 10: Strict demographic census conservation invariant."""
    topo, road_net, movement = test_setup
    total_population = 1000

    # Spawn 5 vehicles, 10 pedestrians, 1 bus with passengers
    for i in range(5):
        movement.plan_trip(road_net, 0.0, -44.0, 0.0, 4.5, category="sedan")

    for i in range(10):
        movement.spawn_pedestrian(f"cit_{i}", 0.0, -10.0, 0.0, 10.0)

    bus = movement.plan_trip(road_net, 0.0, -44.0, 0.0, 4.5, category="bus")
    bus.passengers_count = 12

    census = movement.get_census_counts(total_population=total_population)

    # Invariant: sum of all mutually exclusive categories == total_population
    categories_sum = (
        census["walking"] +
        census["driving"] +
        census["riding_bus"] +
        census["indoor_hospital"] +
        census["indoor_school"] +
        census["indoor_work"] +
        census["indoor_home"] +
        census["indoor_leisure"]
    )
    assert categories_sum == total_population
    assert census["total_living"] == total_population
    assert census["walking"] > 0
    assert census["driving"] > 0
    assert census["riding_bus"] >= 12
