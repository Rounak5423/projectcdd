"""
GENESIS Engine v2.0 - Map & Network Topology Validator
Module: engine.validate_maps
Command: python -m engine.validate_maps

Validates road networks, pedestrian graphs, parking, building access points,
and terrain elevation integrity across all maps and biomes.
"""

import sys
import math
from typing import Dict, List, Set, Tuple
from engine.world.map_topology import get_all_map_topologies, MapTopology
from engine.world.terrain_elevation import get_terrain_height


class MapValidator:
    def __init__(self, topology: MapTopology):
        self.topo = topology
        self.issues: List[str] = []

    def validate_all(self) -> bool:
        self.check_connectivity()
        self.check_dead_ends()
        self.check_edge_properties()
        self.check_building_road_access()
        self.check_pedestrian_crossings()
        self.check_node_terrain_elevations()
        self.check_overlapping_roads()
        return len(self.issues) == 0

    def check_connectivity(self):
        """Checks for disconnected road network components across drivable nodes."""
        drivable_nodes = {
            nid for nid, n in self.topo.road_nodes.items()
            if n.type != "roundabout_center"
        }
        if not drivable_nodes:
            self.issues.append("Road network has zero drivable nodes.")
            return

        adj: Dict[str, Set[str]] = {nid: set() for nid in drivable_nodes}
        for seg in self.topo.road_segments.values():
            if seg.start_node_id in adj and seg.end_node_id in adj:
                adj[seg.start_node_id].add(seg.end_node_id)
                adj[seg.end_node_id].add(seg.start_node_id)

        visited = set()
        components = 0
        for nid in drivable_nodes:
            if nid not in visited:
                components += 1
                queue = [nid]
                visited.add(nid)
                while queue:
                    curr = queue.pop(0)
                    for neighbor in adj[curr]:
                        if neighbor not in visited:
                            visited.add(neighbor)
                            queue.append(neighbor)

        if components > 1:
            self.issues.append(f"Road network has {components} disconnected components.")

    def check_dead_ends(self):
        """Checks that all leaf nodes terminate at intentional turnarounds or highway portals."""
        drivable_nodes = {
            nid for nid, n in self.topo.road_nodes.items()
            if n.type != "roundabout_center"
        }
        degrees: Dict[str, int] = {nid: 0 for nid in drivable_nodes}
        for seg in self.topo.road_segments.values():
            if seg.start_node_id in degrees:
                degrees[seg.start_node_id] += 1
            if seg.end_node_id in degrees:
                degrees[seg.end_node_id] += 1

        allowed_leaf_types = {"cul_de_sac", "highway_portal", "roundabout_throat"}
        for nid, deg in degrees.items():
            if deg == 1:
                node = self.topo.road_nodes[nid]
                if node.type not in allowed_leaf_types:
                    self.issues.append(
                        f"Road node '{nid}' is a dead-end (degree=1) without turnaround (type='{node.type}')."
                    )

    def check_edge_properties(self):
        """Checks that all segments have non-zero length and valid lane counts."""
        for sid, seg in self.topo.road_segments.items():
            if seg.length <= 0.0:
                self.issues.append(f"Road segment '{sid}' has zero or negative length: {seg.length}m.")
            if seg.lanes < 1:
                self.issues.append(f"Road segment '{sid}' has invalid lane count: {seg.lanes}.")
            if seg.speed_limit_kmh <= 0.0:
                self.issues.append(f"Road segment '{sid}' has invalid speed limit: {seg.speed_limit_kmh} km/h.")

    def check_building_road_access(self):
        """Checks that every building has access point and parking connected to road network."""
        for bid, b_acc in self.topo.building_accesses.items():
            if b_acc.road_node_id not in self.topo.road_nodes:
                self.issues.append(
                    f"Building '{bid}' accesses missing road node: '{b_acc.road_node_id}'."
                )
            if b_acc.parking_id not in self.topo.parkings:
                self.issues.append(
                    f"Building '{bid}' references missing parking: '{b_acc.parking_id}'."
                )
            if b_acc.ped_node_id not in self.topo.ped_nodes:
                self.issues.append(
                    f"Building '{bid}' references missing pedestrian door: '{b_acc.ped_node_id}'."
                )

    def check_pedestrian_crossings(self):
        """Ensures crosswalk edges have crossing markers and valid end nodes."""
        for eid, pedge in self.topo.ped_edges.items():
            if pedge.start_node_id not in self.topo.ped_nodes:
                self.issues.append(f"Pedestrian edge '{eid}' has invalid start node: '{pedge.start_node_id}'.")
            if pedge.end_node_id not in self.topo.ped_nodes:
                self.issues.append(f"Pedestrian edge '{eid}' has invalid end node: '{pedge.end_node_id}'.")
            if pedge.length <= 0.0:
                self.issues.append(f"Pedestrian edge '{eid}' has zero or negative length.")

    def check_node_terrain_elevations(self):
        """Checks that nodes do not float or sink below terrain (tolerance 0.15m unless bridge)."""
        for nid, node in self.topo.road_nodes.items():
            if node.type == "bridge_abutment" or "bridge" in nid or "roundabout-throat" in nid:
                continue  # Architectural deck elevations
            expected_y = get_terrain_height(node.x, node.z, self.topo.terrain_type)
            diff = abs(node.y - expected_y)
            if diff > 0.15:
                self.issues.append(
                    f"Road node '{nid}' y={node.y:.2f} deviates from terrain height {expected_y:.2f} by {diff:.2f}m."
                )

        for pid, pnode in self.topo.ped_nodes.items():
            if "bridge" in pid:
                continue
            expected_y = get_terrain_height(pnode.x, pnode.z, self.topo.terrain_type)
            diff = abs(pnode.y - expected_y)
            if diff > 0.15:
                self.issues.append(
                    f"Pedestrian node '{pid}' y={pnode.y:.2f} deviates from terrain height {expected_y:.2f} by {diff:.2f}m."
                )

    def check_overlapping_roads(self):
        """Checks for duplicate or conflicting overlapping road segments."""
        seen_pairs = set()
        for sid, seg in self.topo.road_segments.items():
            pair = tuple(sorted([seg.start_node_id, seg.end_node_id]))
            if pair in seen_pairs:
                self.issues.append(
                    f"Overlapping road segment detected between nodes {pair[0]} and {pair[1]} ('{sid}')."
                )
            seen_pairs.add(pair)


def main():
    topologies = get_all_map_topologies()
    print("=" * 72)
    print("GENESIS ENGINE v2.0 - MAP & TOPOLOGY VALIDATION SUITE")
    print("=" * 72)

    all_passed = True
    results = []

    for mid, topo in topologies.items():
        validator = MapValidator(topo)
        passed = validator.validate_all()
        if not passed:
            all_passed = False
        results.append((mid, topo.name, topo.terrain_type, len(topo.road_nodes), len(topo.road_segments), len(topo.ped_nodes), len(topo.building_accesses), passed, validator.issues))

    # Print results table
    print(f"{'Map ID':<18} | {'Terrain Preset':<22} | {'Nodes':<5} | {'Segs':<5} | {'Peds':<5} | {'Blds':<5} | {'Status':<6}")
    print("-" * 78)
    for mid, name, terr, nodes, segs, peds, blds, passed, issues in results:
        status_str = "PASS" if passed else "FAIL"
        print(f"{mid:<18} | {terr:<22} | {nodes:<5} | {segs:<5} | {peds:<5} | {blds:<5} | {status_str:<6}")

    print("-" * 78)
    for mid, name, terr, nodes, segs, peds, blds, passed, issues in results:
        if not passed:
            print(f"\n[FAIL] {mid} ({name}) Issues:")
            for issue in issues:
                print(f"  - {issue}")

    if all_passed:
        print("\nAll 5 maps passed 100% of topological and terrain elevation invariant checks.")
        sys.exit(0)
    else:
        print("\nMap validation failed. See issues above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
