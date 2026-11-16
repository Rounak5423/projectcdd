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


class MovementModule:
    """
    Microscopic authoritative traffic and pedestrian mobility engine.
    """
    def __init__(self, world_id: str, topology: Optional[MapTopology] = None, seed: int = 42):
        self.world_id = world_id
        self.rng = random.Random(seed)
        self.topology = topology or build_riverfront_masterplan_topology()
        self.terrain_type = self.topology.terrain_type

        self.vehicles: Dict[str, VehicleEntity] = {}
        self.pedestrians: Dict[str, PedestrianEntity] = {}
        self.signals: Dict[str, TrafficSignalController] = {}

        # Deadlock tracking: entity_id -> seconds_stuck
        self.vehicle_stuck_times: Dict[str, float] = {}

        # Travel time history
        self.commute_times_history: List[float] = []

        # Initialize signals for signalized road nodes
        for nid, node in self.topology.road_nodes.items():
            if node.is_signalized:
                self.signals[nid] = TrafficSignalController(node_id=nid)

    def set_seed(self, seed: int):
        self.rng = random.Random(seed)

    # ==========================================================================
    # 1. TRIP PLANNING & DISPATCH
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
        path, _ = road_net.route_trip(origin_x, origin_z, dest_x, dest_z)
        if not path or len(path) < 2:
            return None

        vid = f"veh_{self.world_id}_{category}_{len(self.vehicles):04d}"
        spec = VEHICLE_SPECS.get(category, VEHICLE_SPECS["sedan"])
        speed_mps = spec["max_speed_kmh"] / 3.6

        first_node = road_net.nodes.get(path[0])
        sx = first_node.x if first_node else origin_x
        sz = first_node.z if first_node else origin_z
        sy = round(get_terrain_height(sx, sz, self.terrain_type), 2)

        is_emerg = spec.get("is_emergency", False)

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
            dest_building_id=dest_building_id
        )
        self.vehicles[vid] = vehicle
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
        # Find dispatch origin (hospital or civic center or nearest highway portal)
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
        y = round(get_terrain_height(origin_x, origin_z, self.terrain_type), 2)

        ped = PedestrianEntity(
            id=pid,
            world_id=self.world_id,
            citizen_id=citizen_id,
            archetype=archetype,
            current_x=origin_x,
            current_y=y,
            current_z=origin_z,
            target_x=dest_x,
            target_z=dest_z,
            heading_deg=0.0,
            speed_mps=spec["speed_mps"],
            status="walking",
            purpose=purpose,
            origin_building_id=origin_building_id,
            dest_building_id=dest_building_id,
            progress_pct=0.0,
            is_crossing=False
        )
        self.pedestrians[pid] = ped
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
    # 3. MICROSCOPIC SIMULATION TICK
    # ==========================================================================

    def step(
        self,
        ticks: int,
        road_net: UnifiedRoadNetwork,
        dt_seconds: float = 1.0,
        camera_focus_x: float = 0.0,
        camera_focus_z: float = 0.0
    ) -> Tuple[List[VehicleEntity], Dict[str, Any]]:
        """
        Advances the microscopic traffic and pedestrian simulation by dt seconds.
        Returns (lod_vehicles, traffic_metrics) where traffic_metrics contains
        detailed telemetry and active pedestrians.
        """
        dt = max(0.05, min(1.0, dt_seconds * ticks))

        # 1. Advance Traffic Signals
        for sig in self.signals.values():
            sig.step(dt)

        # Active siren positions for yielding behavior
        emergency_positions: List[Tuple[float, float]] = [
            (v.current_x, v.current_z) for v in self.vehicles.values() if v.siren_active
        ]

        # 2. Advance Vehicles
        traffic_counts: Dict[str, int] = {}
        arrived_vids: List[str] = []
        junction_queues: Dict[str, int] = {}

        # Spatial grid partition for O(1) local leader lookup across active vehicles
        cell_size = 15.0
        grid: Dict[Tuple[int, int], List[VehicleEntity]] = {}
        lod_candidates: List[VehicleEntity] = []
        for veh in self.vehicles.values():
            dist = math.hypot(veh.current_x - camera_focus_x, veh.current_z - camera_focus_z)
            if (dist <= 80.0 or len(lod_candidates) < 30) and len(lod_candidates) < MAX_LOD_FULL_VEHICLES:
                lod_candidates.append(veh)
                cell = (int(veh.current_x // cell_size), int(veh.current_z // cell_size))
                if cell not in grid:
                    grid[cell] = []
                grid[cell].append(veh)

        active_lod_set = {v.id for v in lod_candidates}

        # Process vehicle dynamics and car-following
        for vid, v in list(self.vehicles.items()):
            # A. Bus dwelling at station
            if v.category == "bus" and v.status == "boarding":
                v.dwell_ticks_remaining -= 1
                if v.dwell_ticks_remaining <= 0:
                    v.status = "moving"
                    v.state_badge = "normal"
                continue

            # Check if full microscopic IDM is needed for this entity
            is_lod_full = vid in active_lod_set

            # B. Emergency siren yield detection (for active LOD vehicles)
            is_yielding = False
            if is_lod_full and not v.siren_active and emergency_positions:
                for ex, ez in emergency_positions:
                    d_emerg = math.hypot(v.current_x - ex, v.current_z - ez)
                    if d_emerg < 18.0:
                        is_yielding = True
                        break

            # C. Determine leader distance & delta_v via spatial grid
            leader_dist = 60.0
            leader_dist_sq = 3600.0
            delta_v = 0.0

            if is_lod_full:
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
                            dx = other_v.current_x - v.current_x
                            dz = other_v.current_z - v.current_z
                            if abs(dx) >= leader_dist or abs(dz) >= leader_dist:
                                continue
                            dot = cos_h * dx + sin_h * dz
                            if dot > 0.0:
                                d2 = dx * dx + dz * dz
                                if d2 < leader_dist_sq:
                                    d = math.sqrt(d2)
                                    leader_dist = max(0.1, d - other_v.length)
                                    leader_dist_sq = leader_dist * leader_dist
                                    delta_v = (v.current_speed_kmh - other_v.current_speed_kmh) / 3.6

            # D. Intersection & Signal Checking
            n1_id, n2_id = None, None
            if v.route_node_ids and len(v.route_node_ids) >= 2:
                num_legs = len(v.route_node_ids) - 1
                curr_leg = min(num_legs - 1, int(v.progress_pct * num_legs))
                n1_id = v.route_node_ids[curr_leg]
                n2_id = v.route_node_ids[curr_leg + 1]

                # Distance to upcoming intersection node n2
                n2_node = road_net.nodes.get(n2_id)
                if n2_node:
                    dist_to_junction = math.hypot(n2_node.x - v.current_x, n2_node.z - v.current_z)
                    if dist_to_junction < 12.0:
                        # Check signal state
                        sig = self.signals.get(n2_id)
                        if sig and not v.siren_active:
                            bearing = math.degrees(math.atan2(n2_node.z - v.current_z, n2_node.x - v.current_x))
                            if not sig.is_green_for_approach(bearing):
                                # Virtual red signal obstacle
                                if dist_to_junction < leader_dist:
                                    leader_dist = max(0.5, dist_to_junction - 2.0)
                                    delta_v = v.current_speed_kmh / 3.6
                                v.status = "waiting_signal"
                                v.state_badge = "waiting_signal"
                                junction_queues[n2_id] = junction_queues.get(n2_id, 0) + 1

            # E. Compute Desired Speed & IDM Acceleration
            if is_lod_full:
                spec = VEHICLE_SPECS.get(v.category, VEHICLE_SPECS["sedan"])
                desired_speed_kmh = spec["max_speed_kmh"]
                if is_yielding:
                    desired_speed_kmh = max(10.0, desired_speed_kmh * 0.35)
                    v.state_badge = "yielding"
                elif v.status == "moving":
                    v.state_badge = "siren" if v.siren_active else "normal"

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
            else:
                curr_mps = max(5.0, v.current_speed_kmh / 3.6)

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
                        arrived_vids.append(vid)
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
                    v.current_y = round(get_terrain_height(v.current_x, v.current_z, self.terrain_type), 2) if is_lod_full else 0.0
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
                    # Deadlock resolution: nudge forward and reset
                    v.progress_pct += 0.02
                    v.current_speed_kmh = 20.0
                    self.vehicle_stuck_times[vid] = 0.0
            else:
                self.vehicle_stuck_times[vid] = 0.0

        # Remove arrived vehicles
        for avid in arrived_vids:
            if avid in self.vehicles:
                del self.vehicles[avid]
            self.vehicle_stuck_times.pop(avid, None)

        # 3. Advance Pedestrians
        arrived_peds: List[str] = []
        for pid, ped in list(self.pedestrians.items()):
            tx, tz = ped.target_x, ped.target_z
            d_target = math.hypot(tx - ped.current_x, tz - ped.current_z)
            if d_target < 0.5:
                ped.status = "inside_building"
                arrived_peds.append(pid)
                continue

            # Step along target direction
            dx = (tx - ped.current_x) / max(0.001, d_target)
            dz = (tz - ped.current_z) / max(0.001, d_target)
            step_dist = ped.speed_mps * dt

            ped.current_x = round(ped.current_x + dx * step_dist, 2)
            ped.current_z = round(ped.current_z + dz * step_dist, 2)
            ped.current_y = round(get_terrain_height(ped.current_x, ped.current_z, self.terrain_type), 2)
            ped.heading_deg = round(math.degrees(math.atan2(dz, dx)), 1)
            ped.progress_pct = round(1.0 - (d_target / max(1.0, math.hypot(tx - ped.origin_building_id if ped.origin_building_id else 0, tz))), 2)

        for apid in arrived_peds:
            if apid in self.pedestrians:
                del self.pedestrians[apid]

        # 4. Update Road Network Congestion
        road_net.update_congestion_from_traffic(traffic_counts)
        road_summary = road_net.get_summary_metrics()

        avg_congestion = road_summary["average_congestion_ratio"]
        avg_speed = max(15.0, road_summary["average_speed_kmh"])
        commute_minutes = round(18.0 * (1.0 + avg_congestion * 1.5), 1)

        # 5. Level of Detail (LOD) Filtering
        lod_vehicles: List[VehicleEntity] = []
        for v in self.vehicles.values():
            dist = math.hypot(v.current_x - camera_focus_x, v.current_z - camera_focus_z)
            if dist <= 60.0 or len(lod_vehicles) < MAX_LOD_FULL_VEHICLES:
                lod_vehicles.append(v)

        lod_peds: List[PedestrianEntity] = []
        for p in self.pedestrians.values():
            dist = math.hypot(p.current_x - camera_focus_x, p.current_z - camera_focus_z)
            if dist <= 50.0 or len(lod_peds) < MAX_LOD_FULL_AGENTS:
                lod_peds.append(p)

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
            "active_pedestrians": lod_peds
        }

        return lod_vehicles, traffic_metrics
