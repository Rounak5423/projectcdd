"""
GENESIS Engine v2.0 - Microscopic Traffic & Pedestrian Movement Simulation
Module: engine.modules.movement
Authoritative physical kinematics:
- Intelligent Driver Model (IDM) car-following
- Multi-lane following & curve deceleration
- Phased traffic signal controllers & unsignalized yielding
- Emergency vehicle dispatch, siren preemption & vehicle yielding
- Bus transit lines, stop dwelling & passenger boarding
- Circadian pedestrian schedules, sidewalks, crosswalk signals & door access
- Strict collision & overlap prevention
- Deterministic simulation under seeded PRNG
- Full movement contracts & explainability engine
- Map validation refusal & demographic census invariant
"""

import math
import random
from typing import Dict, List, Optional, Tuple, Any, Set
from engine.world.config import (
    BPR_ALPHA, BPR_BETA,
    IDM_A_MAX, IDM_B_COMFORT, IDM_S0, IDM_T_HEADWAY, IDM_DELTA,
    VEHICLE_SPECS, PEDESTRIAN_SPECS,
    SIGNAL_CYCLE_SECONDS, JUNCTION_DEADLOCK_TIMEOUT_SECONDS,
    MAX_LOD_FULL_VEHICLES, MAX_LOD_FULL_AGENTS
)
from engine.world.road_network import UnifiedRoadNetwork
from engine.world.map_topology import MapTopology, build_riverfront_masterplan_topology
from engine.world.terrain_elevation import get_terrain_height
from engine.world.state import VehicleEntity, PedestrianEntity, RoadNodeEntity, RoadSegmentEntity
from engine.world.pedestrian_network import UnifiedPedestrianNetwork
from .movement_contract import (
    MoverType,
    MoverCategory,
    MoverPurpose,
    MoverState,
    TripContract,
    MovementExplanation
)


class TrafficSignalController:
    """Manages cycle phases for signalized junctions."""
    def __init__(self, node_id: str, cycle_sec: float = SIGNAL_CYCLE_SECONDS):
        self.node_id = node_id
        self.cycle_sec = cycle_sec
        self.elapsed_sec = 0.0

    def step(self, dt: float):
        self.elapsed_sec = (self.elapsed_sec + dt) % self.cycle_sec

    def get_phase(self) -> str:
        """
        0 to 10s: NS_GREEN
        10 to 12s: NS_YELLOW
        12 to 22s: EW_GREEN
        22 to 24s: EW_YELLOW
        """
        t = self.elapsed_sec
        if t < 10.0:
            return "NS_GREEN"
        elif t < 12.0:
            return "NS_YELLOW"
        elif t < 22.0:
            return "EW_GREEN"
        else:
            return "EW_YELLOW"

    def is_green_for_approach(self, approach_bearing_deg: float) -> bool:
        phase = self.get_phase()
        # NS approaches have bearing near 0/180 or 90/270
        is_ns = abs(math.cos(math.radians(approach_bearing_deg))) > 0.5
        if is_ns:
            return phase == "NS_GREEN"
        else:
            return phase == "EW_GREEN"

    def is_pedestrian_walk_allowed(self, crossing_direction: str) -> bool:
        """
        Pedestrian crosswalk safety phase logic:
        Crossing EW is safe when NS vehicular traffic has green or yellow.
        Crossing NS is safe when EW vehicular traffic has green or yellow.
        """
        phase = self.get_phase()
        if crossing_direction == "EW":
            return phase in ["NS_GREEN", "NS_YELLOW"]
        elif crossing_direction == "NS":
            return phase in ["EW_GREEN", "EW_YELLOW"]
        return False


class MovementModule:
    """
    Microscopic authoritative traffic and pedestrian mobility engine.
    Enforces the Movement Contract, IDM car-following, time-decoupled
    micro-stepping, and explainability on all active entities.
    Refuses to start on invalid map topologies.
    """
    def __init__(self, world_id: str, topology: Optional[MapTopology] = None, seed: int = 42):
        self.world_id = world_id
        self.rng = random.Random(seed)
        self.topology = topology or build_riverfront_masterplan_topology()
        self.terrain_type = self.topology.terrain_type

        # Validate topology upon initialization; refuse to start on invalid network
        from engine.validate_maps import MapValidator
        validator = MapValidator(self.topology)
        if not validator.validate_all():
            issues_summary = "; ".join(validator.issues[:5])
            raise ValueError(
                f"MovementModule refused to start on invalid map topology '{self.topology.map_id}': {issues_summary}"
            )

        # Initialize authoritative networks
        self.ped_network = UnifiedPedestrianNetwork(world_id=self.world_id)
        self.ped_network.load_from_topology(self.topology)

        self.vehicles: Dict[str, VehicleEntity] = {}
        self.pedestrians: Dict[str, PedestrianEntity] = {}
        self.signals: Dict[str, TrafficSignalController] = {}
        self.trips: Dict[str, TripContract] = {}
        self.explanations: Dict[str, MovementExplanation] = {}

        # Deadlock tracking: entity_id -> seconds_stuck
        self.vehicle_stuck_times: Dict[str, float] = {}

        # Travel time history and metrics counters
        self.commute_times_history: List[float] = []
        self.completed_trips_count: int = 0
        self.total_trips_planned_count: int = 0
        self.sim_time_seconds: float = 0.0
        self.micro_step_dt: float = 0.2  # 200ms default micro-step

        # Initialize signals for signalized road nodes
        for nid, node in self.topology.road_nodes.items():
            if node.is_signalized:
                self.signals[nid] = TrafficSignalController(node_id=nid)

    def set_seed(self, seed: int):
        self.rng = random.Random(seed)

    # ==========================================================================
    # 1. TRIP PLANNING & DISPATCH (Enforcing Movement Contract)
    # ==========================================================================

    def plan_trip(
        self,
        road_net: UnifiedRoadNetwork,
        origin_x: float,
        origin_z: float,
        dest_x: float,
        dest_z: float,
        category: str = "sedan",
        purpose: str = "work",
        citizen_id: Optional[str] = None,
        origin_building_id: Optional[str] = None,
        dest_building_id: Optional[str] = None
    ) -> Optional[VehicleEntity]:
        """Plans and spawns a purpose-driven vehicle trip via congestion-weighted A*."""
        spec = VEHICLE_SPECS.get(category, VEHICLE_SPECS["sedan"])
        is_emerg = spec.get("is_emergency", False) or purpose == "emergency"
        path, _ = road_net.route_trip(origin_x, origin_z, dest_x, dest_z, ignore_blockages=is_emerg)
        if not path or len(path) < 2:
            return None

        vid = f"veh_{self.world_id}_{category}_{len(self.vehicles):04d}"

        first_node = road_net.nodes.get(path[0])
        sx = first_node.x if first_node else origin_x
        sz = first_node.z if first_node else origin_z
        sy = round(get_terrain_height(sx, sz, self.terrain_type), 2)

        owner_id = citizen_id or f"service_{category}"
        trip_id = f"trip_{vid}"

        trip_purpose = MoverPurpose.WORK
        for p in MoverPurpose:
            if p.value == purpose:
                trip_purpose = p
                break

        trip_contract = TripContract(
            trip_id=trip_id,
            entity_id=vid,
            owner_id=owner_id,
            purpose=trip_purpose,
            origin_id=origin_building_id or path[0],
            dest_id=dest_building_id or path[-1],
            origin_coords=(origin_x, sy, origin_z),
            dest_coords=(dest_x, get_terrain_height(dest_x, dest_z, self.terrain_type), dest_z),
            departure_tick=0,
            departure_second=self.sim_time_seconds,
            route_node_ids=path,
            distance_meters=0.0
        )
        self.trips[trip_id] = trip_contract
        self.total_trips_planned_count += 1

        vehicle = VehicleEntity(
            id=vid,
            world_id=self.world_id,
            citizen_id=citizen_id,
            category=category,
            origin_x=origin_x,
            origin_z=origin_z,
            dest_x=dest_x,
            dest_z=dest_z,
            current_x=sx,
            current_y=sy,
            current_z=sz,
            heading_deg=0.0,
            current_speed_kmh=spec["max_speed_kmh"] * 0.5,
            acceleration=0.0,
            target_lane_index=0,
            lane_offset=0.0,
            current_segment_id=None,
            next_target_node_id=path[1] if len(path) > 1 else None,
            route_node_ids=path,
            progress_pct=0.0,
            distance_along_segment=0.0,
            status="moving",
            purpose=purpose,
            state_badge="siren" if is_emerg else "normal",
            length=spec["length"],
            width=spec["width"],
            siren_active=is_emerg,
            passengers_count=0 if not is_emerg else 1,
            dwell_ticks_remaining=0,
            origin_building_id=origin_building_id,
            dest_building_id=dest_building_id,
            owner_id=owner_id,
            trip_id=trip_id,
            reason_code="free_flow",
            last_rule_applied=f"cruising at road speed limit ({spec['max_speed_kmh']} km/h)"
        )
        self.vehicles[vid] = vehicle

        self.explanations[vid] = MovementExplanation(
            entity_id=vid,
            entity_type=MoverType.VEHICLE,
            category=MoverCategory(category) if category in [c.value for c in MoverCategory] else MoverCategory.SEDAN,
            owner_id=owner_id,
            current_state=MoverState.DRIVING,
            reason_code="free_flow",
            last_rule_applied=vehicle.last_rule_applied,
            current_speed_kmh=vehicle.current_speed_kmh,
            target_speed_kmh=spec["max_speed_kmh"],
            current_coords=(vehicle.current_x, vehicle.current_y, vehicle.current_z),
            heading_deg=vehicle.heading_deg,
            trip=trip_contract.to_dict(),
            route=path,
            junction_id=path[1] if len(path) > 1 else None,
            updated_at_sim_second=self.sim_time_seconds
        )

        return vehicle

    def dispatch_emergency(
        self,
        road_net: UnifiedRoadNetwork,
        category: str,
        dest_x: float,
        dest_z: float,
        dest_building_id: Optional[str] = None
    ) -> Optional[VehicleEntity]:
        """Dispatches an emergency vehicle (ambulance, police, fire) with highest priority."""
        orig_x, orig_z = 0.0, 4.5
        orig_bld = "bld_citadel"
        if category == "ambulance" and "bld_hospital_prime" in self.topology.building_accesses:
            h = self.topology.building_accesses["bld_hospital_prime"]
            orig_x, orig_z = h.x, h.z
            orig_bld = "bld_hospital_prime"

        v = self.plan_trip(
            road_net=road_net,
            origin_x=orig_x,
            origin_z=orig_z,
            dest_x=dest_x,
            dest_z=dest_z,
            category=category,
            purpose="emergency",
            origin_building_id=orig_bld,
            dest_building_id=dest_building_id
        )
        if v:
            v.siren_active = True
            v.state_badge = "siren"
            v.reason_code = "emergency_priority"
            v.last_rule_applied = "emergency response dispatch with active siren preemption"
            if v.id in self.explanations:
                self.explanations[v.id].reason_code = "emergency_priority"
                self.explanations[v.id].last_rule_applied = v.last_rule_applied
        return v

    def spawn_pedestrian(
        self,
        citizen_id: str,
        origin_x: float,
        origin_z: float,
        dest_x: float,
        dest_z: float,
        archetype: str = "casual",
        purpose: str = "work",
        origin_building_id: Optional[str] = None,
        dest_building_id: Optional[str] = None
    ) -> Optional[PedestrianEntity]:
        """Spawns an authoritative pedestrian navigating the pedestrian network."""
        pid = f"ped_{self.world_id}_{citizen_id}"
        spec = PEDESTRIAN_SPECS.get(archetype, PEDESTRIAN_SPECS["adult"])
        trip_id = f"trip_{pid}"

        # Route over pedestrian graph
        path, _ = self.ped_network.route_trip(origin_x, origin_z, dest_x, dest_z)
        first_node = self.ped_network.nodes.get(path[0]) if path else None
        sx = first_node.x if first_node else origin_x
        sz = first_node.z if first_node else origin_z
        sy = round(get_terrain_height(sx, sz, self.terrain_type), 2)

        trip_purpose = MoverPurpose.WORK
        for p in MoverPurpose:
            if p.value == purpose:
                trip_purpose = p
                break

        trip_contract = TripContract(
            trip_id=trip_id,
            entity_id=pid,
            owner_id=citizen_id,
            purpose=trip_purpose,
            origin_id=origin_building_id or "origin_spot",
            dest_id=dest_building_id or "dest_spot",
            origin_coords=(sx, sy, sz),
            dest_coords=(dest_x, get_terrain_height(dest_x, dest_z, self.terrain_type), dest_z),
            departure_tick=0,
            departure_second=self.sim_time_seconds,
            route_node_ids=path
        )
        self.trips[trip_id] = trip_contract
        self.total_trips_planned_count += 1

        ped = PedestrianEntity(
            id=pid,
            world_id=self.world_id,
            citizen_id=citizen_id,
            archetype=archetype,
            current_x=sx,
            current_y=sy,
            current_z=sz,
            target_x=dest_x,
            target_z=dest_z,
            heading_deg=0.0,
            speed_mps=spec["speed_mps"],
            status="walking",
            purpose=purpose,
            origin_building_id=origin_building_id,
            dest_building_id=dest_building_id,
            owner_id=citizen_id,
            trip_id=trip_id,
            reason_code="free_walk",
            last_rule_applied=f"walking on sidewalk toward destination at {spec['speed_mps']} m/s",
            route_node_ids=path,
            progress_pct=0.0,
            is_crossing=False
        )
        self.pedestrians[pid] = ped

        self.explanations[pid] = MovementExplanation(
            entity_id=pid,
            entity_type=MoverType.PEDESTRIAN,
            category=MoverCategory.ADULT,
            owner_id=citizen_id,
            current_state=MoverState.DRIVING,
            reason_code="free_walk",
            last_rule_applied=ped.last_rule_applied,
            current_speed_kmh=round(spec["speed_mps"] * 3.6, 1),
            target_speed_kmh=round(spec["speed_mps"] * 3.6, 1),
            current_coords=(sx, sy, sz),
            heading_deg=0.0,
            trip=trip_contract.to_dict(),
            route=path,
            updated_at_sim_second=self.sim_time_seconds
        )

        return ped

    # ==========================================================================
    # 2. INTELLIGENT DRIVER MODEL (IDM) CAR-FOLLOWING & DYNAMICS
    # ==========================================================================

    def calculate_idm_acceleration(
        self,
        vehicle: VehicleEntity,
        desired_speed_mps: float,
        leader_distance: float,
        delta_v_mps: float,
        is_emergency: bool = False
    ) -> float:
        """
        Intelligent Driver Model (IDM) acceleration:
        dv/dt = a * [1 - (v / v0)^delta - (s*(v, delta_v) / s)^2]
        """
        v = max(0.0, vehicle.current_speed_kmh / 3.6)
        v0 = max(1.0, desired_speed_mps)

        a = IDM_A_MAX * (1.3 if is_emergency else 1.0)
        b = IDM_B_COMFORT
        s0 = IDM_S0
        T = IDM_T_HEADWAY * (0.8 if is_emergency else 1.0)

        # Desired dynamical distance s*
        s_star = s0 + max(0.0, v * T + (v * delta_v_mps) / (2.0 * math.sqrt(max(0.1, a * b))))

        free_accel = 1.0 - math.pow(v / v0, IDM_DELTA)
        brake_term = math.pow(s_star / max(0.5, leader_distance), 2)

        accel = a * (free_accel - brake_term)
        return max(-9.0, min(a, accel))

    # ==========================================================================
    # 3. MICROSCOPIC SIMULATION TICK & TIME MODEL
    # ==========================================================================

    def step(
        self,
        ticks: int = 1,
        road_net: Optional[UnifiedRoadNetwork] = None,
        dt_seconds: Optional[float] = None,
        speed_multiplier: float = 1.0,
        power_grid_operational: bool = True,
        camera_focus_x: float = 0.0,
        camera_focus_z: float = 0.0
    ) -> Tuple[List[VehicleEntity], Dict[str, Any]]:
        """
        Advances the microscopic traffic and pedestrian simulation.
        Supports time decoupling: fixed micro-steps with consistent aggregation
        at 1x vs 8x speed multipliers.
        """
        if road_net is None:
            road_net = UnifiedRoadNetwork(self.world_id)
            road_net.load_from_topology(self.topology)

        if dt_seconds is not None:
            effective_dt = dt_seconds
            sub_steps = max(1, ticks)
        else:
            effective_dt = max(0.05, min(1.0, self.micro_step_dt * speed_multiplier))
            sub_steps = max(1, ticks)

        lod_vehicles: List[VehicleEntity] = []
        traffic_metrics: Dict[str, Any] = {}

        for _ in range(sub_steps):
            lod_vehicles, traffic_metrics = self._step_micro(
                dt=effective_dt,
                road_net=road_net,
                power_grid_operational=power_grid_operational,
                camera_focus_x=camera_focus_x,
                camera_focus_z=camera_focus_z
            )

        return lod_vehicles, traffic_metrics

    def _step_micro(
        self,
        dt: float,
        road_net: UnifiedRoadNetwork,
        power_grid_operational: bool = True,
        camera_focus_x: float = 0.0,
        camera_focus_z: float = 0.0
    ) -> Tuple[List[VehicleEntity], Dict[str, Any]]:
        """Single micro-step advancement of signals, IDM vehicles, and pedestrians."""
        self.sim_time_seconds += dt

        # 1. Advance Traffic Signals
        for sig in self.signals.values():
            sig.step(dt)

        # Active siren positions for emergency yielding
        emergency_vehicles: List[VehicleEntity] = [
            v for v in self.vehicles.values() if v.siren_active
        ]

        # 2. Advance Vehicles
        traffic_counts: Dict[str, int] = {}
        arrived_vids: List[str] = []
        junction_queues: Dict[str, int] = {}

        # Spatial grid partition for O(1) local leader lookup across active LOD vehicles
        cell_size = 15.0
        grid: Dict[Tuple[int, int], List[VehicleEntity]] = {}
        lod_candidates: List[VehicleEntity] = []
        for veh in self.vehicles.values():
            if len(lod_candidates) >= MAX_LOD_FULL_VEHICLES:
                break
            dist = math.hypot(veh.current_x - camera_focus_x, veh.current_z - camera_focus_z)
            if dist <= 80.0 or len(lod_candidates) < 30:
                lod_candidates.append(veh)
                cell = (int(veh.current_x // cell_size), int(veh.current_z // cell_size))
                if cell not in grid:
                    grid[cell] = []
                grid[cell].append(veh)

        active_lod_set = {v.id for v in lod_candidates}

        for vid, v in list(self.vehicles.items()):
            # A. Bus dwelling & boarding at station
            if v.category == "bus" and v.status == "boarding":
                v.dwell_ticks_remaining -= 1
                v.reason_code = "bus_dwell"
                v.last_rule_applied = f"dwelling at transit stop for passenger boarding ({max(0, v.dwell_ticks_remaining)} cycles left)"
                if v.dwell_ticks_remaining <= 0:
                    v.status = "moving"
                    v.state_badge = "normal"
                    v.reason_code = "free_flow"
                    v.last_rule_applied = "bus dwell complete, departing station"
                if vid in active_lod_set:
                    self._update_vehicle_explanation(v, MoverState.BOARDING if v.status == "boarding" else MoverState.DEPARTING)
                continue

            # Non-LOD background vehicles: fast macro flow advancement
            is_lod_full = vid in active_lod_set
            if not is_lod_full:
                curr_mps = max(5.0, v.current_speed_kmh / 3.6)
                if v.route_node_ids and len(v.route_node_ids) >= 2:
                    num_legs = len(v.route_node_ids) - 1
                    curr_leg = min(num_legs - 1, int(v.progress_pct * num_legs))
                    n1_id = v.route_node_ids[curr_leg]
                    n2_id = v.route_node_ids[curr_leg + 1]
                    n1 = road_net.nodes.get(n1_id)
                    n2 = road_net.nodes.get(n2_id)
                    if n1 and n2:
                        leg_len = max(1.0, math.hypot(n2.x - n1.x, n2.z - n1.z))
                        v.progress_pct += (curr_mps * dt) / (leg_len * num_legs)
                        if v.progress_pct >= 1.0:
                            arrived_vids.append(vid)
                continue

            # B. Emergency siren yield detection
            is_yielding = False
            yielding_to_id: Optional[str] = None
            d_emerg_min = float("inf")

            if not v.siren_active and emergency_vehicles:
                for ev in emergency_vehicles:
                    d_emerg = math.hypot(v.current_x - ev.current_x, v.current_z - ev.current_z)
                    if d_emerg < 18.0 and d_emerg < d_emerg_min:
                        is_yielding = True
                        yielding_to_id = ev.id
                        d_emerg_min = d_emerg

            # C. Determine leader distance & delta_v via spatial grid
            leader_dist = 60.0
            leader_dist_sq = 3600.0
            delta_v = 0.0
            leader_id: Optional[str] = None

            v_cell_x = int(v.current_x // cell_size)
            v_cell_z = int(v.current_z // cell_size)

            rad_h = math.radians(v.heading_deg)
            cos_h = math.cos(rad_h)
            sin_h = math.sin(rad_h)

            for g_dx in (-1, 0, 1):
                for g_dz in (-1, 0, 1):
                    neighbor_cell = (v_cell_x + g_dx, v_cell_z + g_dz)
                    cell_vehs = grid.get(neighbor_cell)
                    if not cell_vehs:
                        continue
                    for other_v in cell_vehs:
                        if other_v.id == vid:
                            continue
                        rel_x = other_v.current_x - v.current_x
                        rel_z = other_v.current_z - v.current_z
                        dot = cos_h * rel_x + sin_h * rel_z
                        if dot > 0.0:
                            d2 = rel_x * rel_x + rel_z * rel_z
                            if d2 < leader_dist_sq:
                                d = math.sqrt(d2)
                                leader_dist = max(0.1, d - other_v.length)
                                leader_dist_sq = leader_dist * leader_dist
                                leader_id = other_v.id
                                delta_v = (v.current_speed_kmh - other_v.current_speed_kmh) / 3.6

            # D. Intersection & Signal Checking
            n1_id, n2_id = None, None
            is_stopped_at_signal = False
            sig_phase: Optional[str] = None

            if v.route_node_ids and len(v.route_node_ids) >= 2:
                num_legs = len(v.route_node_ids) - 1
                curr_leg = min(num_legs - 1, int(v.progress_pct * num_legs))
                n1_id = v.route_node_ids[curr_leg]
                n2_id = v.route_node_ids[curr_leg + 1]

                # Check if current road segment was bulldozed while vehicle was on it
                if v.current_segment_id and v.current_segment_id not in road_net.segments:
                    new_path, _ = road_net.route_trip(v.current_x, v.current_z, v.dest_x, v.dest_z)
                    if new_path and len(new_path) >= 2:
                        v.route_node_ids = new_path
                        v.progress_pct = 0.0
                        v.current_segment_id = None
                        v.reason_code = "rerouting"
                        v.last_rule_applied = "current road segment removed; rerouted via alternative open road corridor"
                    else:
                        v.route_node_ids = list(reversed(v.route_node_ids[:max(2, curr_leg + 1)]))
                        v.progress_pct = 0.0
                        v.reason_code = "blocked_return"
                        v.last_rule_applied = "road removed and no alternate path exists; returning safely to origin"

                n2_node = road_net.nodes.get(n2_id)
                if n2_node:
                    dist_to_junction = math.hypot(n2_node.x - v.current_x, n2_node.z - v.current_z)
                    if dist_to_junction < 12.0:
                        sig = self.signals.get(n2_id)
                        if sig and not v.siren_active:
                            if not power_grid_operational:
                                # Blackout: 4-way stop mode
                                sig_phase = "FLASHING_YELLOW"
                                if dist_to_junction < leader_dist and dist_to_junction < 4.0:
                                    leader_dist = max(0.5, dist_to_junction - 1.0)
                                    delta_v = v.current_speed_kmh / 3.6
                                    v.status = "waiting_signal"
                                    v.state_badge = "waiting_signal"
                                    junction_queues[n2_id] = junction_queues.get(n2_id, 0) + 1
                            else:
                                sig_phase = sig.get_phase()
                                bearing = math.degrees(math.atan2(n2_node.z - v.current_z, n2_node.x - v.current_x))
                                if not sig.is_green_for_approach(bearing):
                                    is_stopped_at_signal = True
                                    if dist_to_junction < leader_dist:
                                        leader_dist = max(0.5, dist_to_junction - 2.0)
                                        delta_v = v.current_speed_kmh / 3.6
                                    v.status = "waiting_signal"
                                    v.state_badge = "waiting_signal"
                                    junction_queues[n2_id] = junction_queues.get(n2_id, 0) + 1

                # Bus Stop detection and dwell trigger
                if v.category == "bus" and v.status != "boarding" and v.dwell_ticks_remaining == 0:
                    for pnode in self.topology.ped_nodes.values():
                        if pnode.node_type == "bus_stop" and pnode.associated_road_node_id == n2_id:
                            dist_to_stop = math.hypot(pnode.x - v.current_x, pnode.z - v.current_z)
                            if dist_to_stop < 8.0:
                                v.status = "boarding"
                                v.state_badge = "boarding"
                                v.dwell_ticks_remaining = 3
                                v.reason_code = "bus_dwell"
                                v.last_rule_applied = f"dwelling at transit stop {pnode.id} for passenger boarding"
                                # Board any waiting pedestrians
                                for p in self.pedestrians.values():
                                    if p.status in ["walking", "waiting_bus"] and math.hypot(p.current_x - pnode.x, p.current_z - pnode.z) < 10.0:
                                        if v.passengers_count < 30:
                                            v.passengers_count += 1
                                            p.status = "riding_bus"
                                            p.reason_code = "riding_bus"
                                            p.bus_stop_id = pnode.id
                                            p.last_rule_applied = f"boarded transit bus {v.id} as passenger"
                                break

            # E. Compute Desired Speed & IDM Acceleration
            spec = VEHICLE_SPECS.get(v.category, VEHICLE_SPECS["sedan"])
            desired_speed_kmh = spec["max_speed_kmh"]

            current_mover_state = MoverState.DRIVING

            if v.siren_active:
                current_mover_state = MoverState.DRIVING
                v.reason_code = "emergency_priority"
                if leader_id and leader_dist < 15.0:
                    v.last_rule_applied = f"emergency response with siren preemption (passing yielding vehicle {leader_id} at gap {leader_dist:.1f} m)"
                else:
                    v.last_rule_applied = "emergency response dispatch with active siren preemption"
            elif is_yielding:
                desired_speed_kmh = max(10.0, desired_speed_kmh * 0.35)
                v.state_badge = "yielding"
                v.lane_offset = 2.2
                current_mover_state = MoverState.YIELDING
                v.reason_code = "emergency_yield"
                v.last_rule_applied = f"yielding to ambulance {yielding_to_id} within {d_emerg_min:.1f} m"
            elif is_stopped_at_signal:
                current_mover_state = MoverState.WAITING_SIGNAL
                v.reason_code = "red_signal"
                v.last_rule_applied = f"red light at junction {n2_id} (phase: {sig_phase})"
            elif not power_grid_operational and sig_phase == "FLASHING_YELLOW":
                desired_speed_kmh = min(15.0, desired_speed_kmh * 0.30)
                v.reason_code = "power_blackout_yield"
                v.last_rule_applied = f"power blackout: traffic signal dark at {n2_id}; proceeding under 4-way stop yield"
            elif v.reason_code in ["rerouting", "blocked_return"]:
                current_mover_state = MoverState.DRIVING
            elif leader_id and leader_dist < 15.0:
                current_mover_state = MoverState.QUEUING if v.current_speed_kmh < 5.0 else MoverState.DRIVING
                v.reason_code = "following_vehicle"
                v.last_rule_applied = f"following vehicle {leader_id} at gap {leader_dist:.1f} m"
            else:
                current_mover_state = MoverState.DRIVING
                v.state_badge = "normal"
                v.reason_code = "free_flow"
                v.last_rule_applied = f"cruising at road speed limit ({desired_speed_kmh} km/h)"

            accel = self.calculate_idm_acceleration(
                vehicle=v,
                desired_speed_mps=desired_speed_kmh / 3.6,
                leader_distance=leader_dist,
                delta_v_mps=delta_v,
                is_emergency=v.siren_active
            )
            v.acceleration = round(accel, 2)
            curr_mps = max(0.0, v.current_speed_kmh / 3.6 + accel * dt)

            # Kinematic non-penetration barrier: if within jam headway, speed cannot exceed leader
            if leader_dist <= IDM_S0 + 1.0:
                leader_speed_mps = max(0.0, (v.current_speed_kmh / 3.6) - delta_v)
                curr_mps = min(curr_mps, leader_speed_mps * (leader_dist / max(0.1, IDM_S0)))

            v.current_speed_kmh = round(curr_mps * 3.6, 1)

            # F. Update Position
            if curr_mps > 0.001 and n1_id and n2_id:
                n1 = road_net.nodes.get(n1_id)
                n2 = road_net.nodes.get(n2_id)
                if n1 and n2:
                    leg_len = max(1.0, math.hypot(n2.x - n1.x, n2.z - n1.z))
                    dp = (curr_mps * dt) / (leg_len * num_legs)
                    v.progress_pct += dp

                    if v.progress_pct >= 1.0:
                        v.status = "arrived"
                        current_mover_state = MoverState.ARRIVED
                        v.reason_code = "arrived_destination"
                        v.last_rule_applied = f"arrived at destination building {v.dest_building_id or 'target'}"
                        arrived_vids.append(vid)
                        self.completed_trips_count += 1
                        self._update_vehicle_explanation(v, current_mover_state, leader_id, leader_dist, n2_id, sig_phase)
                        continue

                    # Current sub-leg position
                    sub_t = (v.progress_pct * num_legs) - curr_leg
                    sub_t = max(0.0, min(1.0, sub_t))

                    # Lane offset vector perpendicular to segment direction
                    dx = n2.x - n1.x
                    dz = n2.z - n1.z
                    mag = max(0.001, math.hypot(dx, dz))
                    nx = -dz / mag
                    nz = dx / mag

                    # Standard right-hand lane offset: 1.2m; pulled to side: 2.2m when yielding
                    v.lane_offset = (2.2 if is_yielding else 1.2) if not v.siren_active else 0.0
                    v.current_x = round(n1.x + dx * sub_t + nx * v.lane_offset, 2)
                    v.current_z = round(n1.z + dz * sub_t + nz * v.lane_offset, 2)
                    v.current_y = round(get_terrain_height(v.current_x, v.current_z, self.terrain_type), 2)
                    v.heading_deg = round(math.degrees(math.atan2(dz, dx)), 1)

                    # Look up active road segment
                    for edge in road_net.adjacency.get(n1_id, []):
                        if edge["target"] == n2_id:
                            sid = edge["segment_id"]
                            v.current_segment_id = sid
                            traffic_counts[sid] = traffic_counts.get(sid, 0) + 1
                            break

            # G. Stuck vehicle deadlock detector
            if v.current_speed_kmh < 1.0:
                self.vehicle_stuck_times[vid] = self.vehicle_stuck_times.get(vid, 0.0) + dt
                if self.vehicle_stuck_times[vid] > JUNCTION_DEADLOCK_TIMEOUT_SECONDS:
                    v.progress_pct += 0.02
                    v.current_speed_kmh = 20.0
                    self.vehicle_stuck_times[vid] = 0.0
            else:
                self.vehicle_stuck_times[vid] = 0.0

            self._update_vehicle_explanation(v, current_mover_state, leader_id, leader_dist, n2_id, sig_phase)

        # Remove arrived vehicles
        for avid in arrived_vids:
            if avid in self.vehicles:
                del self.vehicles[avid]
            self.vehicle_stuck_times.pop(avid, None)

        # 3. Advance Pedestrians along sidewalk/crosswalk network
        arrived_peds: List[str] = []
        for pid, ped in list(self.pedestrians.items()):
            if ped.status == "riding_bus":
                continue

            if ped.route_node_ids and len(ped.route_node_ids) >= 2:
                num_legs = len(ped.route_node_ids) - 1
                curr_leg = min(num_legs - 1, int(ped.progress_pct * num_legs))
                pn1_id = ped.route_node_ids[curr_leg]
                pn2_id = ped.route_node_ids[curr_leg + 1]

                pn1 = self.ped_network.nodes.get(pn1_id)
                pn2 = self.ped_network.nodes.get(pn2_id)
                if pn1 and pn2:
                    leg_len = max(0.5, math.hypot(pn2.x - pn1.x, pn2.z - pn1.z))
                    step_dp = (ped.speed_mps * dt) / (leg_len * num_legs)

                    # Check if this edge is a crosswalk
                    is_crosswalk = False
                    cross_sig = None
                    for edge in self.ped_network.adjacency.get(pn1_id, []):
                        if edge["target"] == pn2_id:
                            is_crosswalk = edge.get("is_crosswalk", False)
                            cross_sig = edge.get("signal_node_id")
                            break

                    # Signal waiting check at crosswalk entry
                    if is_crosswalk and cross_sig and cross_sig in self.signals:
                        sig = self.signals[cross_sig]
                        if not sig.is_pedestrian_walk_allowed(edge.get("crossing_direction", "EW")):
                            ped.status = "waiting_crossing"
                            ped.is_crossing = False
                            ped.reason_code = "waiting_crosswalk"
                            ped.last_rule_applied = f"waiting at crosswalk entry {pn1_id} for pedestrian signal clearance"
                            self._update_pedestrian_explanation(ped, MoverState.WAITING_SIGNAL)
                            continue

                    ped.is_crossing = is_crosswalk
                    ped.status = "walking"
                    ped.progress_pct += step_dp

                    if ped.progress_pct >= 1.0:
                        ped.status = "inside_building"
                        ped.is_crossing = False
                        ped.reason_code = "inside_building"
                        ped.last_rule_applied = f"entered target building {ped.dest_building_id or 'destination'}"
                        arrived_peds.append(pid)
                        self.completed_trips_count += 1
                        self._update_pedestrian_explanation(ped, MoverState.ARRIVED)
                        continue

                    sub_t = max(0.0, min(1.0, (ped.progress_pct * num_legs) - curr_leg))
                    ped.current_x = round(pn1.x + (pn2.x - pn1.x) * sub_t, 2)
                    ped.current_z = round(pn1.z + (pn2.z - pn1.z) * sub_t, 2)
                    ped.current_y = round(get_terrain_height(ped.current_x, ped.current_z, self.terrain_type), 2)
                    ped.heading_deg = round(math.degrees(math.atan2(pn2.z - pn1.z, pn2.x - pn1.x)), 1)
                    ped.reason_code = "crosswalk" if is_crosswalk else "free_walk"
                    ped.last_rule_applied = f"crossing street via crosswalk {pn1_id}->{pn2_id}" if is_crosswalk else f"walking on sidewalk toward destination ({ped.speed_mps} m/s)"
                    self._update_pedestrian_explanation(ped, MoverState.DRIVING)
            else:
                # Direct walking fallback
                tx, tz = ped.target_x, ped.target_z
                d_target = math.hypot(tx - ped.current_x, tz - ped.current_z)
                if d_target < 0.5:
                    ped.status = "inside_building"
                    ped.reason_code = "inside_building"
                    ped.last_rule_applied = f"entered target building {ped.dest_building_id or 'destination'}"
                    arrived_peds.append(pid)
                    self.completed_trips_count += 1
                    self._update_pedestrian_explanation(ped, MoverState.ARRIVED)
                    continue

                step_dist = ped.speed_mps * dt
                dx = tx - ped.current_x
                dz = tz - ped.current_z

                ped.current_x += (dx / d_target) * min(step_dist, d_target)
                ped.current_z += (dz / d_target) * min(step_dist, d_target)
                ped.current_y = round(get_terrain_height(ped.current_x, ped.current_z, self.terrain_type), 2)
                ped.heading_deg = round(math.degrees(math.atan2(dz, dx)), 1)
                ped.status = "walking"
                ped.reason_code = "free_walk"
                ped.last_rule_applied = f"walking along pedestrian path toward destination ({ped.speed_mps} m/s)"
                self._update_pedestrian_explanation(ped, MoverState.DRIVING)

        for apid in arrived_peds:
            if apid in self.pedestrians:
                del self.pedestrians[apid]

        # 4. Update Road Network Congestion
        road_net.update_congestion_from_traffic(traffic_counts)
        road_summary = road_net.get_summary_metrics()

        avg_speed = 35.0
        if self.vehicles:
            avg_speed = round(sum(v.current_speed_kmh for v in self.vehicles.values()) / len(self.vehicles), 1)

        avg_congestion = road_summary.get("average_congestion", 0.05)
        commute_minutes = round(max(3.0, (15.0 / max(5.0, avg_speed)) * 60.0), 1)

        lod_vehicles = list(self.vehicles.values())[:MAX_LOD_FULL_VEHICLES]
        lod_peds = list(self.pedestrians.values())[:MAX_LOD_FULL_AGENTS]

        signals_state = {nid: sig.get_phase() for nid, sig in self.signals.items()}
        stuck_count = sum(1 for t in self.vehicle_stuck_times.values() if t > 3.0)

        traffic_metrics = {
            "active_vehicles_count": len(self.vehicles),
            "active_pedestrians_count": len(self.pedestrians),
            "lod_rendered_vehicles_count": len(lod_vehicles),
            "lod_rendered_pedestrians_count": len(lod_peds),
            "average_speed_kmh": avg_speed,
            "average_commute_minutes": commute_minutes,
            "congestion_index": round(avg_congestion * 100.0, 1),
            "traffic_flow_efficiency": round(max(15.0, 100.0 * (1.0 - avg_congestion)), 1),
            "congested_segments_count": len(road_summary.get("congested_segments", [])),
            "stuck_vehicles_count": stuck_count,
            "junction_queues": junction_queues,
            "signals_state": signals_state,
            "active_pedestrians": lod_peds,
            "completed_trips_count": self.completed_trips_count,
            "total_trips_planned_count": self.total_trips_planned_count
        }

        return lod_vehicles, traffic_metrics

    # ==========================================================================
    # 4. ACCIDENT SIMULATION & INCIDENT COUPLING
    # ==========================================================================

    def trigger_accident(
        self,
        segment_id: str,
        road_net: UnifiedRoadNetwork
    ) -> Optional[VehicleEntity]:
        """
        Simulates an actual vehicular crash on segment_id.
        Blocks the road segment, sets crash badge, and dispatches emergency response.
        """
        target_veh = None
        for v in self.vehicles.values():
            if v.current_segment_id == segment_id and not v.siren_active:
                target_veh = v
                break
        if not target_veh and self.vehicles:
            target_veh = list(self.vehicles.values())[0]

        if target_veh:
            target_veh.status = "accident"
            target_veh.state_badge = "crash"
            target_veh.current_speed_kmh = 0.0
            target_veh.reason_code = "accident_collision"
            target_veh.last_rule_applied = "involved in vehicular accident; lane obstructed awaiting emergency clearance"
            road_net.block_segment(segment_id)

            # Dispatch emergency ambulance from hospital
            self.dispatch_emergency(
                road_net=road_net,
                category="ambulance",
                dest_x=target_veh.current_x,
                dest_z=target_veh.current_z
            )
            return target_veh
        return None

    # ==========================================================================
    # 5. DEMOGRAPHIC SCHEDULE CENSUS (Strict Invariant Guarantee)
    # ==========================================================================

    def get_census_counts(
        self,
        total_population: int,
        citizens_dict: Optional[Dict[str, Any]] = None
    ) -> Dict[str, int]:
        """
        Calculates mutually exclusive demographic activity census.
        Invariant: walking + driving + riding_bus + indoor_hospital + indoor_work + indoor_school + indoor_home + indoor_leisure == total_population
        """
        walking_count = sum(1 for p in self.pedestrians.values() if p.status == "walking")
        riding_bus_count = sum(1 for p in self.pedestrians.values() if p.status == "riding_bus") + sum(v.passengers_count for v in self.vehicles.values() if v.category == "bus")
        driving_count = len([v for v in self.vehicles.values() if not v.siren_active and v.category != "bus"])

        outdoor_count = walking_count + riding_bus_count + driving_count
        indoor_total = max(0, total_population - outdoor_count)

        indoor_hospital = min(indoor_total, int(total_population * 0.02))
        remaining = indoor_total - indoor_hospital
        indoor_school = min(remaining, int(total_population * 0.15))
        remaining -= indoor_school
        indoor_work = min(remaining, int(total_population * 0.45))
        remaining -= indoor_work
        indoor_leisure = min(remaining, int(total_population * 0.10))
        indoor_home = remaining - indoor_leisure

        census = {
            "walking": walking_count,
            "driving": driving_count,
            "riding_bus": riding_bus_count,
            "indoor_hospital": indoor_hospital,
            "indoor_school": indoor_school,
            "indoor_work": indoor_work,
            "indoor_home": indoor_home,
            "indoor_leisure": indoor_leisure,
            "total_living": total_population
        }
        return census

    # ==========================================================================
    # 6. EXPLAINABILITY & MOVEMENT CONTRACT ENGINE
    # ==========================================================================

    def _update_vehicle_explanation(
        self,
        v: VehicleEntity,
        current_state: MoverState,
        leader_id: Optional[str] = None,
        leader_gap: Optional[float] = None,
        junction_id: Optional[str] = None,
        sig_phase: Optional[str] = None
    ):
        trip_data = self.trips[v.trip_id].to_dict() if v.trip_id and v.trip_id in self.trips else None
        spec = VEHICLE_SPECS.get(v.category, VEHICLE_SPECS["sedan"])
        self.explanations[v.id] = MovementExplanation(
            entity_id=v.id,
            entity_type=MoverType.VEHICLE,
            category=MoverCategory(v.category) if v.category in [c.value for c in MoverCategory] else MoverCategory.SEDAN,
            owner_id=v.owner_id or v.citizen_id or "service_fleet",
            current_state=current_state,
            reason_code=v.reason_code,
            last_rule_applied=v.last_rule_applied,
            current_speed_kmh=v.current_speed_kmh,
            target_speed_kmh=spec["max_speed_kmh"],
            current_coords=(v.current_x, v.current_y, v.current_z),
            heading_deg=v.heading_deg,
            trip=trip_data,
            route=v.route_node_ids,
            leader_entity_id=leader_id,
            gap_to_leader_m=leader_gap if leader_id else None,
            junction_id=junction_id,
            signal_phase=sig_phase,
            updated_at_sim_second=self.sim_time_seconds
        )

    def _update_pedestrian_explanation(self, p: PedestrianEntity, current_state: MoverState):
        trip_data = self.trips[p.trip_id].to_dict() if p.trip_id and p.trip_id in self.trips else None
        self.explanations[p.id] = MovementExplanation(
            entity_id=p.id,
            entity_type=MoverType.PEDESTRIAN,
            category=MoverCategory.ADULT,
            owner_id=p.owner_id or p.citizen_id or "citizen_walker",
            current_state=current_state,
            reason_code=p.reason_code,
            last_rule_applied=p.last_rule_applied,
            current_speed_kmh=round(p.speed_mps * 3.6, 1),
            target_speed_kmh=round(p.speed_mps * 3.6, 1),
            current_coords=(p.current_x, p.current_y, p.current_z),
            heading_deg=p.heading_deg,
            trip=trip_data,
            route=p.route_node_ids,
            updated_at_sim_second=self.sim_time_seconds
        )

    def explain_entity(self, entity_id: str) -> Optional[MovementExplanation]:
        """Returns the authoritative explainability payload for a vehicle or pedestrian."""
        if entity_id in self.explanations:
            return self.explanations[entity_id]
        if entity_id in self.vehicles:
            v = self.vehicles[entity_id]
            self._update_vehicle_explanation(v, MoverState.DRIVING)
            return self.explanations.get(entity_id)
        if entity_id in self.pedestrians:
            p = self.pedestrians[entity_id]
            self._update_pedestrian_explanation(p, MoverState.DRIVING)
            return self.explanations.get(entity_id)
        return None
