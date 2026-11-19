"""
GENESIS Engine v2.0 - Authoritative Map Topology & Network Graph Models
Comprehensive road networks, pedestrian networks, parking spots, building access points,
and terrain-aligned elevations across all maps and biomes.
"""

import math
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field
from .terrain_elevation import get_terrain_height, VALID_TERRAIN_TYPES


@dataclass
class RoadNodeDef:
    id: str
    x: float
    y: float
    z: float
    type: str  # 'intersection', 'roundabout_center', 'roundabout_throat', 'bridge_abutment', 'cul_de_sac', 'highway_portal'
    clearance_radius: float = 2.0
    is_signalized: bool = False
    connected_segment_ids: List[str] = field(default_factory=list)


@dataclass
class RoadSegmentDef:
    id: str
    name: str
    start_node_id: str
    end_node_id: str
    road_type: str  # 'grand_arterial', 'civic_boulevard', 'district_collector', 'local_spur', 'architectural_bridge', 'roundabout_arc'
    speed_limit_kmh: float
    capacity_vph: int
    lanes: int
    is_one_way: bool
    width: float
    length: float
    centerline: List[Tuple[float, float]] = field(default_factory=list)
    has_sidewalks: bool = True
    sidewalk_width: float = 0.85
    is_bridge: bool = False


@dataclass
class PedestrianNodeDef:
    id: str
    x: float
    y: float
    z: float
    node_type: str  # 'sidewalk', 'crosswalk_entry', 'crosswalk_exit', 'building_entrance', 'bus_stop', 'plaza'
    associated_road_node_id: Optional[str] = None
    connected_edge_ids: List[str] = field(default_factory=list)


@dataclass
class PedestrianEdgeDef:
    id: str
    start_node_id: str
    end_node_id: str
    length: float
    is_crosswalk: bool = False
    crossing_direction: Optional[str] = None  # 'NS', 'EW'
    signal_node_id: Optional[str] = None


@dataclass
class ParkingDef:
    id: str
    building_id: str
    x: float
    y: float
    z: float
    capacity: int
    access_node_id: str


@dataclass
class BuildingAccessDef:
    id: str
    building_id: str
    name: str
    building_type: str
    x: float
    y: float
    z: float
    road_node_id: str
    ped_node_id: str
    parking_id: str


@dataclass
class MapTopology:
    map_id: str
    name: str
    terrain_type: str
    road_nodes: Dict[str, RoadNodeDef] = field(default_factory=dict)
    road_segments: Dict[str, RoadSegmentDef] = field(default_factory=dict)
    ped_nodes: Dict[str, PedestrianNodeDef] = field(default_factory=dict)
    ped_edges: Dict[str, PedestrianEdgeDef] = field(default_factory=dict)
    parkings: Dict[str, ParkingDef] = field(default_factory=dict)
    building_accesses: Dict[str, BuildingAccessDef] = field(default_factory=dict)


# ==============================================================================
# MAP 1: VERDANT RIVER VALLEY (Aurora Prime Masterplan)
# ==============================================================================

def build_riverfront_masterplan_topology() -> MapTopology:
    terrain = "Verdant River Valley"
    topo = MapTopology(map_id="aurora-prime", name="Aurora Prime Riverfront", terrain_type=terrain)

    def node(nid: str, x: float, z: float, ntype: str, rad: float = 2.0, signal: bool = False) -> RoadNodeDef:
        y = round(get_terrain_height(x, z, terrain), 3)
        # Abutment & bridge deck overrides matching 3D architectural deck
        if nid in ("node-bridge-central-north", "node-bridge-central-south"):
            y = 0.72
        elif nid in ("node-bridge-west-north", "node-bridge-west-south"):
            y = 0.76
        elif nid == "node-roundabout-throat-north":
            y = 0.85
        elif nid == "node-roundabout-throat-south":
            y = 0.85
        n = RoadNodeDef(id=nid, x=x, y=y, z=z, type=ntype, clearance_radius=rad, is_signalized=signal)
        topo.road_nodes[nid] = n
        return n

    # 1. Road Nodes
    node("node-portal-north", 0.0, -44.0, "highway_portal", 1.0)
    node("node-portal-south", 0.0, 44.0, "highway_portal", 1.0)
    node("node-portal-west-north", -25.0, -44.0, "highway_portal", 1.0)

    node("node-north-junction", 0.0, -22.0, "intersection", 2.8, signal=True)
    node("node-bridge-central-north", 0.0, -10.5, "bridge_abutment", 1.0)
    node("node-bridge-central-south", 0.0, 4.5, "intersection", 2.8, signal=True)

    node("node-loop-southwest", -12.0, 24.0, "intersection", 2.6, signal=True)
    node("node-loop-southeast", 12.0, 24.0, "intersection", 2.6, signal=True)

    node("node-roundabout-center", 0.0, 24.0, "roundabout_center", 6.0)
    node("node-roundabout-throat-north", 0.0, 18.0, "roundabout_throat", 2.8)
    node("node-roundabout-throat-south", 0.0, 30.0, "roundabout_throat", 2.8)
    node("node-roundabout-throat-west", -6.0, 24.0, "roundabout_throat", 2.4)
    node("node-roundabout-throat-east", 6.0, 24.0, "roundabout_throat", 2.4)

    node("node-west-north-junc", -25.0, -22.0, "intersection", 2.4, signal=True)
    node("node-bridge-west-north", -25.0, -13.7, "bridge_abutment", 1.0)
    node("node-bridge-west-south", -25.0, -8.7, "bridge_abutment", 1.0)
    node("node-west-sci-branch", -25.0, -2.0, "intersection", 2.2)
    node("node-west-crossroads", -25.0, 24.0, "intersection", 2.6, signal=True)

    node("node-res-branch", 14.0, 24.0, "intersection", 2.2)
    node("node-east-crossroads", 25.0, 24.0, "intersection", 2.6, signal=True)

    node("node-culdesac-science", -34.0, -2.0, "cul_de_sac", 4.2)
    node("node-culdesac-agri", -25.0, 38.0, "cul_de_sac", 4.5)
    node("node-culdesac-freight", 36.0, 24.0, "cul_de_sac", 4.8)
    node("node-culdesac-res", 14.0, 38.0, "cul_de_sac", 4.4)

    # 2. Road Segments
    def segment(
        sid: str, name: str, n1: str, n2: str, rtype: str, spd: float, cap: int,
        lanes: int, width: float, pts: List[Tuple[float, float]], oneway: bool = False, bridge: bool = False
    ) -> RoadSegmentDef:
        # compute real path length
        length = 0.0
        for i in range(len(pts) - 1):
            length += math.hypot(pts[i+1][0] - pts[i][0], pts[i+1][1] - pts[i][1])
        s = RoadSegmentDef(
            id=sid, name=name, start_node_id=n1, end_node_id=n2, road_type=rtype,
            speed_limit_kmh=spd, capacity_vph=cap, lanes=lanes, is_one_way=oneway,
            width=width, length=round(length, 2), centerline=pts, is_bridge=bridge
        )
        topo.road_segments[sid] = s
        topo.road_nodes[n1].connected_segment_ids.append(sid)
        topo.road_nodes[n2].connected_segment_ids.append(sid)
        return s

    segment("seg-ns-north-1", "North Grand Boulevard Upper", "node-portal-north", "node-north-junction",
            "grand_arterial", 70.0, 1600, 4, 5.4, [(0.0, -44.0), (0.0, -33.0), (0.0, -22.0)])
    segment("seg-ns-north-2", "North Grand Boulevard Lower", "node-north-junction", "node-bridge-central-north",
            "grand_arterial", 65.0, 1500, 4, 5.4, [(0.0, -22.0), (0.0, -16.0), (0.0, -10.5)])
    segment("seg-bridge-central", "Central Citadel Grand Arch Bridge", "node-bridge-central-north", "node-bridge-central-south",
            "architectural_bridge", 60.0, 1400, 4, 5.6, [(0.0, -10.5), (0.0, -3.0), (0.0, 4.5)], bridge=True)

    segment("seg-loop-west", "West Civic Flank Boulevard", "node-bridge-central-south", "node-loop-southwest",
            "civic_boulevard", 50.0, 900, 2, 4.4, [(0.0, 4.5), (-5.0, 4.5), (-10.5, 5.0), (-12.0, 7.0), (-12.0, 15.5), (-12.0, 24.0)])
    segment("seg-loop-east", "East Civic Flank Boulevard", "node-bridge-central-south", "node-loop-southeast",
            "civic_boulevard", 50.0, 900, 2, 4.4, [(0.0, 4.5), (5.0, 4.5), (10.5, 5.0), (12.0, 7.0), (12.0, 15.5), (12.0, 24.0)])

    segment("seg-parkway-west-1", "West Parkway Outer", "node-west-crossroads", "node-loop-southwest",
            "civic_boulevard", 50.0, 900, 2, 4.4, [(-25.0, 24.0), (-18.5, 24.0), (-12.0, 24.0)])
    segment("seg-parkway-west-2", "West Parkway Inner", "node-loop-southwest", "node-roundabout-throat-west",
            "civic_boulevard", 50.0, 900, 2, 4.4, [(-12.0, 24.0), (-6.0, 24.0)])

    segment("seg-parkway-east-1", "East Parkway Inner", "node-roundabout-throat-east", "node-loop-southeast",
            "civic_boulevard", 50.0, 900, 2, 4.4, [(6.0, 24.0), (12.0, 24.0)])
    segment("seg-parkway-east-2", "East Parkway Outer", "node-loop-southeast", "node-res-branch",
            "civic_boulevard", 50.0, 900, 2, 4.4, [(12.0, 24.0), (14.0, 24.0)])
    segment("seg-parkway-east-3", "East Freight Corridor", "node-res-branch", "node-east-crossroads",
            "civic_boulevard", 50.0, 900, 2, 4.4, [(14.0, 24.0), (25.0, 24.0)])
    segment("seg-parkway-east-4", "Freight Spur to Culdesac", "node-east-crossroads", "node-culdesac-freight",
            "district_collector", 45.0, 700, 2, 4.4, [(25.0, 24.0), (36.0, 24.0)])

    segment("seg-ns-south", "Oasis Terraces Grand Boulevard", "node-roundabout-throat-south", "node-portal-south",
            "grand_arterial", 70.0, 1600, 4, 5.4, [(0.0, 30.0), (0.0, 37.0), (0.0, 44.0)])

    segment("seg-west-north-1", "Aethel Ridge Mountain Pass Upper", "node-portal-west-north", "node-west-north-junc",
            "grand_arterial", 65.0, 1200, 2, 4.2, [(-25.0, -44.0), (-25.0, -33.0), (-25.0, -22.0)])
    segment("seg-west-north-2", "Aethel Ridge Mountain Pass Lower", "node-west-north-junc", "node-bridge-west-north",
            "grand_arterial", 65.0, 1200, 2, 4.2, [(-25.0, -22.0), (-25.0, -13.7)])
    segment("seg-bridge-west", "West Aethel Ridge Suspension Bridge", "node-bridge-west-north", "node-bridge-west-south",
            "architectural_bridge", 60.0, 1100, 2, 4.5, [(-25.0, -13.7), (-25.0, -11.2), (-25.0, -8.7)], bridge=True)
    segment("seg-west-south-1", "West River Bluff Avenue North", "node-bridge-west-south", "node-west-sci-branch",
            "district_collector", 55.0, 800, 2, 4.2, [(-25.0, -8.7), (-25.0, -2.0)])
    segment("seg-west-south-2", "West River Bluff Avenue Mid", "node-west-sci-branch", "node-west-crossroads",
            "district_collector", 55.0, 800, 2, 4.2, [(-25.0, -2.0), (-25.0, 11.0), (-25.0, 24.0)])
    segment("seg-west-south-3", "West River Bluff Avenue South", "node-west-crossroads", "node-culdesac-agri",
            "district_collector", 50.0, 750, 2, 4.2, [(-25.0, 24.0), (-25.0, 38.0)])

    segment("seg-conn-north-west", "Academic Transverse Parkway", "node-west-north-junc", "node-north-junction",
            "district_collector", 45.0, 750, 2, 3.8, [(-25.0, -22.0), (-12.5, -22.0), (0.0, -22.0)])
    segment("seg-spur-science", "Quantum Observatory Research Spur", "node-west-sci-branch", "node-culdesac-science",
            "local_spur", 40.0, 600, 2, 3.8, [(-25.0, -2.0), (-29.5, -2.0), (-34.0, -2.0)])
    segment("seg-spur-residential", "Oasis Terraces Residential Spur", "node-res-branch", "node-culdesac-res",
            "local_spur", 35.0, 500, 2, 3.8, [(14.0, 24.0), (14.0, 31.0), (14.0, 38.0)])

    # Roundabout Circulation Quadrants (Continuous circular loop connecting the 4 throats)
    segment("seg-rb-nw", "Roundabout NW Arc", "node-roundabout-throat-north", "node-roundabout-throat-west",
            "roundabout_arc", 35.0, 1200, 2, 4.4, [(0.0, 18.0), (-4.2, 19.8), (-6.0, 24.0)])
    segment("seg-rb-ws", "Roundabout WS Arc", "node-roundabout-throat-west", "node-roundabout-throat-south",
            "roundabout_arc", 35.0, 1200, 2, 4.4, [(-6.0, 24.0), (-4.2, 28.2), (0.0, 30.0)])
    segment("seg-rb-se", "Roundabout SE Arc", "node-roundabout-throat-south", "node-roundabout-throat-east",
            "roundabout_arc", 35.0, 1200, 2, 4.4, [(0.0, 30.0), (4.2, 28.2), (6.0, 24.0)])
    segment("seg-rb-en", "Roundabout EN Arc", "node-roundabout-throat-east", "node-roundabout-throat-north",
            "roundabout_arc", 35.0, 1200, 2, 4.4, [(6.0, 24.0), (4.2, 19.8), (0.0, 18.0)])

    # 3. Pedestrian Graph (Sidewalks, Crosswalks, Bus Stops, Building Doors)
    def ped_node(pid: str, x: float, z: float, ptype: str, road_node: Optional[str] = None) -> PedestrianNodeDef:
        y = round(get_terrain_height(x, z, terrain), 3)
        if "bridge" in pid:
            y = 0.72
        pn = PedestrianNodeDef(id=pid, x=x, y=y, z=z, node_type=ptype, associated_road_node_id=road_node)
        topo.ped_nodes[pid] = pn
        return pn

    def ped_edge(eid: str, p1: str, p2: str, is_crosswalk: bool = False, xdir: Optional[str] = None, sig: Optional[str] = None) -> PedestrianEdgeDef:
        pn1 = topo.ped_nodes[p1]
        pn2 = topo.ped_nodes[p2]
        length = round(math.hypot(pn2.x - pn1.x, pn2.z - pn1.z), 2)
        pe = PedestrianEdgeDef(id=eid, start_node_id=p1, end_node_id=p2, length=length,
                               is_crosswalk=is_crosswalk, crossing_direction=xdir, signal_node_id=sig)
        topo.ped_edges[eid] = pe
        pn1.connected_edge_ids.append(eid)
        pn2.connected_edge_ids.append(eid)
        return pe

    # Sidewalk nodes flanking central spine & forum promenade loop
    ped_node("ped-forum-nw", -5.5, 6.2, "sidewalk")
    ped_node("ped-cross-north-w", -2.8, 6.2, "crosswalk_entry", "node-bridge-central-south")
    ped_node("ped-cross-north-e", 2.8, 6.2, "crosswalk_exit", "node-bridge-central-south")
    ped_node("ped-forum-ne", 5.5, 6.2, "sidewalk")
    ped_node("ped-forum-e-mid", 6.6, 12.0, "sidewalk")
    ped_node("ped-forum-se", 5.5, 18.0, "sidewalk")
    ped_node("ped-cross-south-e", 2.8, 18.0, "crosswalk_entry", "node-roundabout-throat-north")
    ped_node("ped-cross-south-w", -2.8, 18.0, "crosswalk_exit", "node-roundabout-throat-north")
    ped_node("ped-forum-sw", -5.5, 18.0, "sidewalk")
    ped_node("ped-forum-w-mid", -6.6, 12.0, "sidewalk")

    # Connect forum promenade loop
    ped_edge("pedge-forum-1", "ped-forum-nw", "ped-cross-north-w")
    ped_edge("pedge-cross-north", "ped-cross-north-w", "ped-cross-north-e", is_crosswalk=True, xdir="EW", sig="node-bridge-central-south")
    ped_edge("pedge-forum-2", "ped-cross-north-e", "ped-forum-ne")
    ped_edge("pedge-forum-3", "ped-forum-ne", "ped-forum-e-mid")
    ped_edge("pedge-forum-4", "ped-forum-e-mid", "ped-forum-se")
    ped_edge("pedge-forum-5", "ped-forum-se", "ped-cross-south-e")
    ped_edge("pedge-cross-south", "ped-cross-south-e", "ped-cross-south-w", is_crosswalk=True, xdir="EW", sig="node-roundabout-throat-north")
    ped_edge("pedge-forum-6", "ped-cross-south-w", "ped-forum-sw")
    ped_edge("pedge-forum-7", "ped-forum-sw", "ped-forum-w-mid")
    ped_edge("pedge-forum-8", "ped-forum-w-mid", "ped-forum-nw")

    # Bridge scenic sidewalk
    ped_node("ped-bridge-s-w", -2.8, 4.5, "sidewalk")
    ped_node("ped-bridge-mid-w", -2.8, -3.0, "sidewalk")
    ped_node("ped-bridge-n-w", -2.8, -10.5, "sidewalk")
    ped_edge("pedge-bridge-1", "ped-cross-north-w", "ped-bridge-s-w")
    ped_edge("pedge-bridge-2", "ped-bridge-s-w", "ped-bridge-mid-w")
    ped_edge("pedge-bridge-3", "ped-bridge-mid-w", "ped-bridge-n-w")

    # Transit Bus Stops along arterial corridors
    ped_node("ped-stop-citadel-nb", -3.2, 5.0, "bus_stop", "node-bridge-central-south")
    ped_node("ped-stop-citadel-sb", 3.2, 5.0, "bus_stop", "node-bridge-central-south")
    ped_node("ped-stop-roundabout-w", -6.5, 22.0, "bus_stop", "node-roundabout-throat-west")
    ped_node("ped-stop-roundabout-e", 6.5, 22.0, "bus_stop", "node-roundabout-throat-east")
    ped_node("ped-stop-res-south", 3.2, 32.0, "bus_stop", "node-roundabout-throat-south")
    ped_edge("pedge-stop-1", "ped-bridge-s-w", "ped-stop-citadel-nb")
    ped_edge("pedge-stop-2", "ped-cross-north-e", "ped-stop-citadel-sb")

    # 4. Building Ingress/Egress, Parking Spots, and Network Hookups
    buildings_data = [
        ("bld_citadel", "Civic Citadel", "Civic", 0.0, 0.0, "node-bridge-central-south"),
        ("bld_power_main", "Fusion Power Plant", "Energy", -18.0, 15.0, "node-loop-southwest"),
        ("bld_water_main", "Hydro-Purification Plant", "Water", 18.0, -15.0, "node-north-junction"),
        ("bld_hospital_prime", "Elysium General Hospital", "Healthcare", 12.0, 12.0, "node-loop-southeast"),
        ("bld_academy", "Grand Academy of Science", "Education", -12.0, -12.0, "node-conn-north-west" if "node-conn-north-west" in topo.road_nodes else "node-north-junction"),
        ("bld_res_block_1", "High-Density Residential Block A", "ResidentialHigh", 8.0, 20.0, "node-loop-southeast"),
        ("bld_res_block_2", "Suburban Terraces B", "Residential", -8.0, 20.0, "node-loop-southwest"),
        ("bld_comm_plaza", "Central Commerce Complex", "CommercialHigh", 20.0, 8.0, "node-loop-southeast"),
        ("bld_industry_hub", "Advanced Materials Foundry", "Industrial", -22.0, -20.0, "node-west-north-junc"),
    ]

    for bid, bname, btype, bx, bz, near_road_node in buildings_data:
        by = round(get_terrain_height(bx, bz, terrain), 3)
        # 1. Parking spot offset 2m from building
        park_id = f"pkg_{bid}"
        px, pz = round(bx + 2.0, 2), round(bz + 2.0, 2)
        py = round(get_terrain_height(px, pz, terrain), 3)
        topo.parkings[park_id] = ParkingDef(
            id=park_id, building_id=bid, x=px, y=py, z=pz, capacity=20, access_node_id=near_road_node
        )

        # 2. Pedestrian door
        door_id = f"door_{bid}"
        dx, dz = round(bx - 1.5, 2), round(bz - 1.5, 2)
        dy = round(get_terrain_height(dx, dz, terrain), 3)
        topo.ped_nodes[door_id] = PedestrianNodeDef(
            id=door_id, x=dx, y=dy, z=dz, node_type="building_entrance", associated_road_node_id=near_road_node
        )

        # Connect door to nearest sidewalk or plaza
        topo.ped_edges[f"pedge_door_{bid}"] = PedestrianEdgeDef(
            id=f"pedge_door_{bid}", start_node_id=door_id, end_node_id="ped-forum-nw" if "citadel" in bid else "ped-forum-ne",
            length=round(math.hypot(dx - 0.0, dz - 6.2), 2)
        )

        # 3. Building Access Def
        topo.building_accesses[bid] = BuildingAccessDef(
            id=f"acc_{bid}", building_id=bid, name=bname, building_type=btype,
            x=bx, y=by, z=bz, road_node_id=near_road_node, ped_node_id=door_id, parking_id=park_id
        )

    return topo


# ==============================================================================
# MAP GENERATOR FOR ALL PRESETS (Highland Plateau, Archipelago, Boreal, Arid)
# ==============================================================================

def build_preset_map_topology(map_id: str, name: str, terrain_type: str) -> MapTopology:
    """Generates a complete, validated topological network for any terrain preset."""
    topo = MapTopology(map_id=map_id, name=name, terrain_type=terrain_type)

    def node(nid: str, x: float, z: float, ntype: str, rad: float = 2.0, signal: bool = False) -> RoadNodeDef:
        y = round(get_terrain_height(x, z, terrain_type), 3)
        n = RoadNodeDef(id=nid, x=x, y=y, z=z, type=ntype, clearance_radius=rad, is_signalized=signal)
        topo.road_nodes[nid] = n
        return n

    def segment(
        sid: str, name: str, n1: str, n2: str, rtype: str, spd: float, cap: int,
        lanes: int, width: float, pts: List[Tuple[float, float]], oneway: bool = False, bridge: bool = False
    ) -> RoadSegmentDef:
        length = 0.0
        for i in range(len(pts) - 1):
            length += math.hypot(pts[i+1][0] - pts[i][0], pts[i+1][1] - pts[i][1])
        s = RoadSegmentDef(
            id=sid, name=name, start_node_id=n1, end_node_id=n2, road_type=rtype,
            speed_limit_kmh=spd, capacity_vph=cap, lanes=lanes, is_one_way=oneway,
            width=width, length=round(length, 2), centerline=pts, is_bridge=bridge
        )
        topo.road_segments[sid] = s
        topo.road_nodes[n1].connected_segment_ids.append(sid)
        topo.road_nodes[n2].connected_segment_ids.append(sid)
        return s

    # Core Hub & Spoke Topology with Turnarounds
    node(f"{map_id}-portal-n", 0.0, -36.0, "highway_portal", 1.0)
    node(f"{map_id}-portal-s", 0.0, 36.0, "highway_portal", 1.0)
    node(f"{map_id}-junc-center", 0.0, 0.0, "intersection", 3.0, signal=True)
    node(f"{map_id}-junc-north", 0.0, -18.0, "intersection", 2.5, signal=True)
    node(f"{map_id}-junc-south", 0.0, 18.0, "intersection", 2.5, signal=True)
    node(f"{map_id}-junc-west", -20.0, 0.0, "intersection", 2.5, signal=True)
    node(f"{map_id}-junc-east", 20.0, 0.0, "intersection", 2.5, signal=True)

    node(f"{map_id}-cds-west", -32.0, 0.0, "cul_de_sac", 4.0)
    node(f"{map_id}-cds-east", 32.0, 0.0, "cul_de_sac", 4.0)
    node(f"{map_id}-cds-nw", -18.0, -18.0, "cul_de_sac", 4.0)
    node(f"{map_id}-cds-se", 18.0, 18.0, "cul_de_sac", 4.0)

    # Road Segments
    segment(f"{map_id}-seg-n1", "North Portal Ingress", f"{map_id}-portal-n", f"{map_id}-junc-north",
            "grand_arterial", 70.0, 1400, 4, 5.4, [(0.0, -36.0), (0.0, -18.0)])
    segment(f"{map_id}-seg-n2", "North Arterial", f"{map_id}-junc-north", f"{map_id}-junc-center",
            "grand_arterial", 60.0, 1400, 4, 5.4, [(0.0, -18.0), (0.0, 0.0)])
    segment(f"{map_id}-seg-s1", "South Arterial", f"{map_id}-junc-center", f"{map_id}-junc-south",
            "grand_arterial", 60.0, 1400, 4, 5.4, [(0.0, 0.0), (0.0, 18.0)])
    segment(f"{map_id}-seg-s2", "South Portal Egress", f"{map_id}-junc-south", f"{map_id}-portal-s",
            "grand_arterial", 70.0, 1400, 4, 5.4, [(0.0, 18.0), (0.0, 36.0)])

    segment(f"{map_id}-seg-w", "West Transverse", f"{map_id}-junc-center", f"{map_id}-junc-west",
            "civic_boulevard", 50.0, 900, 2, 4.4, [(0.0, 0.0), (-20.0, 0.0)])
    segment(f"{map_id}-seg-w-cds", "West Turnaround Spur", f"{map_id}-junc-west", f"{map_id}-cds-west",
            "local_spur", 40.0, 500, 2, 3.8, [(-20.0, 0.0), (-32.0, 0.0)])

    segment(f"{map_id}-seg-e", "East Transverse", f"{map_id}-junc-center", f"{map_id}-junc-east",
            "civic_boulevard", 50.0, 900, 2, 4.4, [(0.0, 0.0), (20.0, 0.0)])
    segment(f"{map_id}-seg-e-cds", "East Turnaround Spur", f"{map_id}-junc-east", f"{map_id}-cds-east",
            "local_spur", 40.0, 500, 2, 3.8, [(20.0, 0.0), (32.0, 0.0)])

    segment(f"{map_id}-seg-nw-diag", "Northwest District Link", f"{map_id}-junc-north", f"{map_id}-cds-nw",
            "district_collector", 45.0, 600, 2, 4.0, [(0.0, -18.0), (-18.0, -18.0)])
    segment(f"{map_id}-seg-se-diag", "Southeast District Link", f"{map_id}-junc-south", f"{map_id}-cds-se",
            "district_collector", 45.0, 600, 2, 4.0, [(0.0, 18.0), (18.0, 18.0)])

    # Pedestrian Network
    def ped_node(pid: str, x: float, z: float, ptype: str, rnode: Optional[str] = None) -> PedestrianNodeDef:
        y = round(get_terrain_height(x, z, terrain_type), 3)
        pn = PedestrianNodeDef(id=pid, x=x, y=y, z=z, node_type=ptype, associated_road_node_id=rnode)
        topo.ped_nodes[pid] = pn
        return pn

    def ped_edge(eid: str, p1: str, p2: str, is_crosswalk: bool = False, xdir: Optional[str] = None, sig: Optional[str] = None) -> PedestrianEdgeDef:
        pn1 = topo.ped_nodes[p1]
        pn2 = topo.ped_nodes[p2]
        length = round(math.hypot(pn2.x - pn1.x, pn2.z - pn1.z), 2)
        pe = PedestrianEdgeDef(id=eid, start_node_id=p1, end_node_id=p2, length=length,
                               is_crosswalk=is_crosswalk, crossing_direction=xdir, signal_node_id=sig)
        topo.ped_edges[eid] = pe
        pn1.connected_edge_ids.append(eid)
        pn2.connected_edge_ids.append(eid)
        return pe

    # Pedestrian ring around central hub
    ped_node(f"{map_id}-ped-nw", -3.0, -3.0, "sidewalk")
    ped_node(f"{map_id}-ped-ne", 3.0, -3.0, "sidewalk")
    ped_node(f"{map_id}-ped-se", 3.0, 3.0, "sidewalk")
    ped_node(f"{map_id}-ped-sw", -3.0, 3.0, "sidewalk")

    # Crosswalks over central arterials
    ped_edge(f"{map_id}-pedge-cross-n", f"{map_id}-ped-nw", f"{map_id}-ped-ne", is_crosswalk=True, xdir="EW", sig=f"{map_id}-junc-center")
    ped_edge(f"{map_id}-pedge-walk-e", f"{map_id}-ped-ne", f"{map_id}-ped-se")
    ped_edge(f"{map_id}-pedge-cross-s", f"{map_id}-ped-se", f"{map_id}-ped-sw", is_crosswalk=True, xdir="EW", sig=f"{map_id}-junc-center")
    ped_edge(f"{map_id}-pedge-walk-w", f"{map_id}-ped-sw", f"{map_id}-ped-nw")

    # Buildings & Access Points
    buildings = [
        ("bld_admin", "Administrative Center", "Civic", 8.0, 8.0, f"{map_id}-junc-center"),
        ("bld_power", "Geothermal Generator", "Energy", -12.0, -10.0, f"{map_id}-junc-north"),
        ("bld_water", "Water Desalination Hub", "Water", 12.0, -10.0, f"{map_id}-junc-north"),
        ("bld_med", "Regional Clinic", "Healthcare", -10.0, 10.0, f"{map_id}-junc-south"),
        ("bld_res_1", "Colony Habitation Pods", "Residential", 14.0, 14.0, f"{map_id}-junc-south"),
    ]

    for bid, bname, btype, bx, bz, near_node in buildings:
        by = round(get_terrain_height(bx, bz, terrain_type), 3)
        park_id = f"pkg_{map_id}_{bid}"
        px, pz = round(bx + 2.0, 2), round(bz + 2.0, 2)
        py = round(get_terrain_height(px, pz, terrain_type), 3)
        topo.parkings[park_id] = ParkingDef(
            id=park_id, building_id=bid, x=px, y=py, z=pz, capacity=15, access_node_id=near_node
        )
        door_id = f"door_{map_id}_{bid}"
        dx, dz = round(bx - 1.5, 2), round(bz - 1.5, 2)
        dy = round(get_terrain_height(dx, dz, terrain_type), 3)
        topo.ped_nodes[door_id] = PedestrianNodeDef(
            id=door_id, x=dx, y=dy, z=dz, node_type="building_entrance", associated_road_node_id=near_node
        )
        topo.ped_edges[f"pedge_{map_id}_{bid}"] = PedestrianEdgeDef(
            id=f"pedge_{map_id}_{bid}", start_node_id=door_id, end_node_id=f"{map_id}-ped-nw",
            length=round(math.hypot(bx - (-3.0), bz - (-3.0)), 2)
        )
        topo.building_accesses[bid] = BuildingAccessDef(
            id=f"acc_{map_id}_{bid}", building_id=bid, name=bname, building_type=btype,
            x=bx, y=by, z=bz, road_node_id=near_node, ped_node_id=door_id, parking_id=park_id
        )

    return topo


# Master Catalog of all maps shipped with the project
ALL_MAP_GENERATORS = {
    "aurora-prime": build_riverfront_masterplan_topology,
    "highland-plateau": lambda: build_preset_map_topology("highland-plateau", "Highland Plateau", "Highland Plateau"),
    "archipelago": lambda: build_preset_map_topology("archipelago", "Archipelago Isles", "Archipelago"),
    "boreal-basin": lambda: build_preset_map_topology("boreal-basin", "Boreal Basin", "Boreal Basin"),
    "arid-oasis": lambda: build_preset_map_topology("arid-oasis", "Arid Oasis", "Arid Oasis"),
}


def get_all_map_topologies() -> Dict[str, MapTopology]:
    """Builds and returns complete map topologies for all project maps."""
    return {mid: gen() for mid, gen in ALL_MAP_GENERATORS.items()}
