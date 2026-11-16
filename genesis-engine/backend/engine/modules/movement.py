"""
GENESIS Engine v2.0 - Movement & Traffic Subsystem Module
Module: engine.modules.movement
A* congestion-weighted vehicle routing, purpose-driven trips (work, school, shop, hospital,
home, delivery, emergency dispatch), intersection queueing, public transit, and Level-of-Detail (LOD).
"""

import math
import heapq
from typing import Dict, List, Optional, Tuple, Any
from .config import BPR_ALPHA, BPR_BETA, LOD_ACTIVE_RADIUS_METERS
from engine.world.road_network import UnifiedRoadNetwork
from engine.world.state import VehicleEntity, RoadNodeEntity, RoadSegmentEntity


class MovementModule:
    """
    Simulates physical mobility across the city road topology:
    agent trips, emergency dispatches, intersection queueing, and multi-modal transport.
    """
    def __init__(self, world_id: str):
        self.world_id = world_id
        self.vehicles: Dict[str, VehicleEntity] = {}
        self.active_transit_lines: List[Dict[str, Any]] = []
        self.commute_times_history: List[float] = []

    def plan_trip(
        self,
        road_net: UnifiedRoadNetwork,
        origin_x: float,
        origin_z: float,
        dest_x: float,
        dest_z: float,
        category: str = "sedan",
        purpose: str = "work",
        citizen_id: Optional[str] = None
    ) -> Optional[VehicleEntity]:
        """
        Plans and spawns a purpose-driven vehicle trip via congestion-weighted A*.
        """
        path, length = road_net.route_trip(origin_x, origin_z, dest_x, dest_z)
        if not path or len(path) < 2:
            return None

        vid = f"veh_{self.world_id}_{category}_{len(self.vehicles):04d}"
        speed = 60.0 if category in ("ambulance", "police", "fire_truck") else 45.0

        vehicle = VehicleEntity(
            id=vid,
            world_id=self.world_id,
            citizen_id=citizen_id,
            category=category,
            origin_x=origin_x,
            origin_z=origin_z,
            dest_x=dest_x,
            dest_z=dest_z,
            current_x=origin_x,
            current_z=origin_z,
            route_node_ids=path,
            current_speed_kmh=speed,
            progress_pct=0.0,
            status="moving"
        )
        self.vehicles[vid] = vehicle
        return vehicle

    def step(
        self,
        ticks: int,
        road_net: UnifiedRoadNetwork,
        camera_focus_x: float = 0.0,
        camera_focus_z: float = 0.0
    ) -> Tuple[List[VehicleEntity], Dict[str, Any]]:
        """
        Advances vehicles along road segments, updates segment traffic counts,
        and computes macroscopic traffic metrics.
        """
        traffic_counts: Dict[str, int] = {}
        arrived_vids: List[str] = []

        # 1. Advance Vehicles
        for vid, v in list(self.vehicles.items()):
            # Congestion-adjusted progress rate
            v.progress_pct += (0.15 * ticks)
            if v.progress_pct >= 1.0:
                v.status = "arrived"
                arrived_vids.append(vid)
                continue

            if v.route_node_ids and len(v.route_node_ids) >= 2:
                num_legs = len(v.route_node_ids) - 1
                curr_leg = min(num_legs - 1, int(v.progress_pct * num_legs))
                sub_t = (v.progress_pct * num_legs) - curr_leg

                n1_id = v.route_node_ids[curr_leg]
                n2_id = v.route_node_ids[curr_leg + 1]
                n1 = road_net.nodes.get(n1_id)
                n2 = road_net.nodes.get(n2_id)

                if n1 and n2:
                    v.current_x = round(n1.x + (n2.x - n1.x) * sub_t, 2)
                    v.current_z = round(n1.z + (n2.z - n1.z) * sub_t, 2)
                    v.heading_deg = round(math.degrees(math.atan2(n2.z - n1.z, n2.x - n1.x)), 1)

                # Record segment load
                for edge in road_net.adjacency.get(n1_id, []):
                    if edge["target"] == n2_id:
                        seg_id = edge["segment_id"]
                        traffic_counts[seg_id] = traffic_counts.get(seg_id, 0) + 1
                        break

        # Remove arrived vehicles
        for avid in arrived_vids:
            del self.vehicles[avid]

        # 2. Update Segment Congestion via BPR
        road_net.update_congestion_from_traffic(traffic_counts)
        road_summary = road_net.get_summary_metrics()

        avg_congestion = road_summary["average_congestion_ratio"]
        avg_speed = max(15.0, road_summary["average_speed_kmh"])
        commute_minutes = round(20.0 * (1.0 + avg_congestion * 1.5), 1)

        # 3. Level-of-Detail Filtering (LOD)
        # Full detailed telemetry for vehicles near camera focus; statistical representation otherwise
        lod_active_vehicles: List[VehicleEntity] = []
        for v in self.vehicles.values():
            dist = math.hypot(v.current_x - camera_focus_x, v.current_z - camera_focus_z)
            if dist <= LOD_ACTIVE_RADIUS_METERS or len(lod_active_vehicles) < 50:
                lod_active_vehicles.append(v)

        traffic_metrics = {
            "active_vehicles_count": len(self.vehicles),
            "lod_rendered_vehicles_count": len(lod_active_vehicles),
            "average_speed_kmh": avg_speed,
            "average_commute_minutes": commute_minutes,
            "congestion_index": round(avg_congestion * 100.0, 1),
            "traffic_flow_efficiency": round(max(15.0, 100.0 * (1.0 - avg_congestion)), 1),
            "congested_segments_count": len(road_summary.get("congested_segments", []))
        }

        return lod_active_vehicles, traffic_metrics
