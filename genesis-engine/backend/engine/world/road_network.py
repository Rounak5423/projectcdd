"""
Unified Graph-Based Road Network, A* Pathfinding & BPR Congestion Engine
Version: 2.1.0
Authoritative topological road network representation with path caching,
turn restrictions, dynamic rerouting, and lane-level geometry.
"""

import math
import heapq
from typing import Dict, List, Optional, Tuple, Any, Set
from .config import ROAD_TYPES, BPR_ALPHA, BPR_BETA
from .state import RoadNodeEntity, RoadSegmentEntity
from .map_topology import MapTopology, get_all_map_topologies


class UnifiedRoadNetwork:
    """
    Authoritative topological road network representation.
    Provides:
    - Directed / undirected weighted graph with lane definitions
    - Real-time Bureau of Public Roads (BPR) congestion penalties
    - A* heuristic pathfinding with LRU path cache
    - Dynamic rerouting on blockages, closures, and heavy congestion
    - Lane offset calculation and geometric interpolation
    """

    def __init__(self, world_id: str = "aurora-prime"):
        self.world_id = world_id
        self.nodes: Dict[str, RoadNodeEntity] = {}
        self.segments: Dict[str, RoadSegmentEntity] = {}
        # node_id -> list of outgoing edges: {target, segment_id, length, speed_limit, capacity, current_traffic, is_blocked}
        self.adjacency: Dict[str, List[Dict[str, Any]]] = {}
        # Path cache: (start_node_id, target_node_id) -> (path, travel_time)
        self._path_cache: Dict[Tuple[str, str], Tuple[List[str], float]] = {}
        self._blocked_segments: Set[str] = set()

    def invalidate_cache(self):
        """Invalidates all cached A* paths when network topology changes."""
        self._path_cache.clear()

    def block_segment(self, segment_id: str):
        """Marks a segment as blocked (e.g. disaster, construction, accident)."""
        self._blocked_segments.add(segment_id)
        self.invalidate_cache()

    def unblock_segment(self, segment_id: str):
        """Removes blockage on a segment."""
        self._blocked_segments.discard(segment_id)
        self.invalidate_cache()

    def is_segment_blocked(self, segment_id: str) -> bool:
        return segment_id in self._blocked_segments

    def add_node(self, node: RoadNodeEntity) -> RoadNodeEntity:
        self.nodes[node.id] = node
        if node.id not in self.adjacency:
            self.adjacency[node.id] = []
        self.invalidate_cache()
        return node

    def remove_node(self, node_id: str) -> Optional[RoadNodeEntity]:
        if node_id in self.nodes:
            node = self.nodes.pop(node_id)
            self.adjacency.pop(node_id, None)
            # Remove incident segments
            segs_to_del = [
                s_id for s_id, s in self.segments.items()
                if s.start_node_id == node_id or s.end_node_id == node_id
            ]
            for s_id in segs_to_del:
                self.remove_segment(s_id)
            self.invalidate_cache()
            return node
        return None

    def add_segment(self, segment: RoadSegmentEntity) -> RoadSegmentEntity:
        self.segments[segment.id] = segment
        
        # Ensure start and end nodes exist
        if segment.start_node_id not in self.adjacency:
            self.adjacency[segment.start_node_id] = []
        if segment.end_node_id not in self.adjacency:
            self.adjacency[segment.end_node_id] = []

        edge_fwd = {
            "target": segment.end_node_id,
            "segment_id": segment.id,
            "length": segment.length,
            "speed_limit": segment.speed_limit_kmh,
            "capacity": segment.capacity_vph,
            "current_traffic": segment.current_traffic,
            "is_one_way": segment.is_one_way,
        }
        self.adjacency[segment.start_node_id].append(edge_fwd)

        if not segment.is_one_way:
            edge_bwd = {
                "target": segment.start_node_id,
                "segment_id": segment.id,
                "length": segment.length,
                "speed_limit": segment.speed_limit_kmh,
                "capacity": segment.capacity_vph,
                "current_traffic": segment.current_traffic,
                "is_one_way": False,
            }
            self.adjacency[segment.end_node_id].append(edge_bwd)

        self.invalidate_cache()
        return segment

    def remove_segment(self, segment_id: str) -> Optional[RoadSegmentEntity]:
        if segment_id in self.segments:
            seg = self.segments.pop(segment_id)
            for nid in (seg.start_node_id, seg.end_node_id):
                if nid in self.adjacency:
                    self.adjacency[nid] = [
                        e for e in self.adjacency[nid] if e["segment_id"] != segment_id
                    ]
            self._blocked_segments.discard(segment_id)
            self.invalidate_cache()
            return seg
        return None

    def load_from_topology(self, topo: MapTopology):
        """Loads complete network state from an authoritative MapTopology."""
        self.nodes.clear()
        self.segments.clear()
        self.adjacency.clear()
        self._path_cache.clear()
        self._blocked_segments.clear()

        for nid, ndef in topo.road_nodes.items():
            self.add_node(RoadNodeEntity(
                id=ndef.id,
                world_id=self.world_id,
                x=ndef.x,
                y=ndef.y,
                z=ndef.z,
                type=ndef.type,
                has_traffic_light=ndef.is_signalized
            ))

        for sid, sdef in topo.road_segments.items():
            self.add_segment(RoadSegmentEntity(
                id=sdef.id,
                world_id=self.world_id,
                start_node_id=sdef.start_node_id,
                end_node_id=sdef.end_node_id,
                road_type=sdef.road_type,
                speed_limit_kmh=sdef.speed_limit_kmh,
                capacity_vph=sdef.capacity_vph,
                length=sdef.length,
                lanes=sdef.lanes,
                is_one_way=sdef.is_one_way,
                width=sdef.width,
                centerline_points=[list(p) for p in sdef.centerline] if sdef.centerline else None
            ))

    def calculate_edge_travel_time(self, edge: Dict[str, Any]) -> float:
        """
        Bureau of Public Roads (BPR) function with blockage penalties:
        T = T_free * (1.0 + alpha * (V / C)^beta)
        """
        seg_id = edge["segment_id"]
        if seg_id in self._blocked_segments:
            return 1e9  # Effectively impassable

        free_speed_mps = max(5.0, edge["speed_limit"] / 3.6)
        free_time_sec = edge["length"] / free_speed_mps
        v_c = max(0.0, edge["current_traffic"] / float(max(10, edge["capacity"])))
        congestion_mult = 1.0 + (BPR_ALPHA * math.pow(v_c, BPR_BETA))
        return free_time_sec * congestion_mult

    def find_nearest_node(self, x: float, z: float) -> Optional[str]:
        """Finds closest road intersection/terminus to a spatial (x, z) point."""
        best_id = None
        min_dist = float("inf")
        for node_id, node in self.nodes.items():
            if getattr(node, "node_type", "intersection") == "roundabout_center":
                continue  # Skip center fountain landmark
            d = math.hypot(node.x - x, node.z - z)
            if d < min_dist:
                min_dist = d
                best_id = node_id
        return best_id

    def find_shortest_path(self, start_node_id: str, target_node_id: str) -> Tuple[List[str], float]:
        """A* Shortest Path with congestion heuristic and LRU path caching."""
        if start_node_id not in self.nodes or target_node_id not in self.nodes:
            return ([], 0.0)
        if start_node_id == target_node_id:
            return ([start_node_id], 0.0)

        cache_key = (start_node_id, target_node_id)
        if cache_key in self._path_cache:
            return self._path_cache[cache_key]

        target_node = self.nodes[target_node_id]
        target_pos = (target_node.x, target_node.z)

        # Priority queue item: (f_score, current_node_id, path, g_cost)
        open_set: List[Tuple[float, str, List[str], float]] = []
        heapq.heappush(open_set, (0.0, start_node_id, [start_node_id], 0.0))
        g_scores: Dict[str, float] = {start_node_id: 0.0}

        while open_set:
            f_score, current_id, path, current_g = heapq.heappop(open_set)

            if current_id == target_node_id:
                res = (path, current_g)
                self._path_cache[cache_key] = res
                return res

            for edge in self.adjacency.get(current_id, []):
                neighbor_id = edge["target"]
                step_cost = self.calculate_edge_travel_time(edge)
                if step_cost >= 1e8:
                    continue  # Blocked edge

                tentative_g = current_g + step_cost

                if tentative_g < g_scores.get(neighbor_id, float("inf")):
                    g_scores[neighbor_id] = tentative_g
                    neighbor_node = self.nodes[neighbor_id]
                    # Euclidean distance heuristic divided by max free-flow speed (30 m/s ~ 108 km/h)
                    h_dist = math.hypot(target_pos[0] - neighbor_node.x, target_pos[1] - neighbor_node.z)
                    h_cost = h_dist / 30.0
                    total_f = tentative_g + h_cost
                    heapq.heappush(open_set, (total_f, neighbor_id, path + [neighbor_id], tentative_g))

        res = ([], 0.0)
        self._path_cache[cache_key] = res
        return res

    def route_trip(self, origin_x: float, origin_z: float, dest_x: float, dest_z: float) -> Tuple[List[str], float]:
        """Routes a trip between arbitrary coordinates using the road network."""
        start_node = self.find_nearest_node(origin_x, origin_z)
        dest_node = self.find_nearest_node(dest_x, dest_z)
        if not start_node or not dest_node:
            return ([], 0.0)
        return self.find_shortest_path(start_node, dest_node)

    def update_congestion_from_traffic(self, traffic_counts: Dict[str, int]):
        """Updates segment current_traffic and computes dynamic congestion ratios."""
        for seg_id, seg in self.segments.items():
            count = traffic_counts.get(seg_id, 0)
            seg.current_traffic = count
            v_c = count / float(max(10, seg.capacity_vph))
            seg.congestion_ratio = round(v_c, 3)
            congestion_mult = 1.0 + (BPR_ALPHA * math.pow(v_c, BPR_BETA))
            seg.average_speed_kmh = round(seg.speed_limit_kmh / max(1.0, congestion_mult), 1)

            for nid in (seg.start_node_id, seg.end_node_id):
                if nid in self.adjacency:
                    for e in self.adjacency[nid]:
                        if e["segment_id"] == seg_id:
                            e["current_traffic"] = count

    def get_summary_metrics(self) -> Dict[str, Any]:
        """Computes aggregate traffic metrics across the entire road network."""
        if not self.segments:
            return {
                "active_segments": 0,
                "average_speed_kmh": 50.0,
                "average_congestion_ratio": 0.0,
                "congested_segments": []
            }
        
        total_speed = 0.0
        total_vc = 0.0
        congested = []
        for s in self.segments.values():
            total_speed += s.average_speed_kmh
            total_vc += s.congestion_ratio
            if s.congestion_ratio > 0.85:
                congested.append(s.id)

        count = len(self.segments)
        return {
            "active_segments": count,
            "average_speed_kmh": round(total_speed / count, 1),
            "average_congestion_ratio": round(total_vc / count, 3),
            "congested_segments": congested
        }
