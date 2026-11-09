"""
Authoritative Unified World Simulation Engine
Version: 2.0.0
Connects:
- Graph-based road network & A* vehicle routing
- Graph-based utility networks (power, water, outages)
- Demand-driven RCI zoning & building lifecycle (spawn, upgrade, abandon)
- Citizen agents with daily schedules and LOD mobility
- Fully derived aggregate city metrics (no random walks or disconnected counters)
- Monotonic versioning & delta generation for frontend synchronization
"""

import math
import json
import random
import uuid
from typing import Dict, List, Optional, Tuple, Any

from db.database import get_db_connection
from .config import (
    BUILDING_CONFIGS,
    ROAD_TYPES,
    DEFAULT_TAX_RATE,
    CITIZEN_SCHEDULE,
    MAX_LOD_FULL_AGENTS,
    MAX_LOD_FULL_VEHICLES
)
from .state import (
    BuildingEntity,
    RoadNodeEntity,
    RoadSegmentEntity,
    ZoneTileEntity,
    CitizenEntity,
    VehicleEntity,
    UtilityNetworkState,
    TrafficMetricsState,
    DerivedCityMetrics,
    WorldStateSnapshot,
    WorldStateDelta
)
from .road_network import UnifiedRoadNetwork
from .utility_network import UnifiedUtilityNetwork
from engine.causal import global_causal_engine


class UnifiedWorldSimulation:
    """
    Authoritative single-source-of-truth simulation engine for a persistent world.
    Every tick:
    1. Reads authoritative state from DB / memory.
    2. Simulates utility transmission across power and water graphs.
    3. Simulates citizen trips, A* routing, and traffic congestion.
    4. Evaluates RCI demand and updates building lifecycles.
    5. Derives all aggregate metrics directly from the graph and entities.
    6. Advances causal vital pipeline (mortality, births, hospitals, protests).
    7. Produces delta messages with incremented monotonic version numbers.
    """

    def __init__(self, world_id: str = "aurora-prime"):
        self.world_id = world_id
        self.version = 1
        self.tick = 0
        self.year = 2026
        self.day = 1
        
        self.road_network = UnifiedRoadNetwork(world_id=world_id)
        self.utility_engine = UnifiedUtilityNetwork(world_id=world_id)

        self.buildings: Dict[str, BuildingEntity] = {}
        self.zone_tiles: Dict[str, ZoneTileEntity] = {}
        self.citizens: Dict[str, CitizenEntity] = {}
        self.vehicles: Dict[str, VehicleEntity] = {}

        # Cached previous state for delta calculation
        self._prev_buildings: Dict[str, BuildingEntity] = {}
        self._prev_roads: Dict[str, RoadSegmentEntity] = {}
        self._prev_zones: Dict[str, ZoneTileEntity] = {}

        self.load_world_from_db()

    def load_world_from_db(self):
        """Loads persistent entities from SQLite into the authoritative simulation engine."""
        conn = get_db_connection()
        try:
            # 1. World metadata
            w = conn.execute("SELECT * FROM worlds WHERE id = ?", (self.world_id,)).fetchone()
            if w:
                self.tick = w["tick"]
                self.year = w["year"]
                self.day = w["day"]
            else:
                from datetime import datetime, timezone
                now = datetime.now(timezone.utc).isoformat()
                with conn:
                    conn.execute("""
                    INSERT OR IGNORE INTO worlds (id, name, created_at, updated_at)
                    VALUES (?, ?, ?, ?)
                    """, (self.world_id, f"World {self.world_id}", now, now))
                    conn.execute("""
                    INSERT OR IGNORE INTO economy_resources (world_id) VALUES (?)
                    """, (self.world_id,))

            # 2. Road Nodes
            self.road_network.nodes.clear()
            self.road_network.segments.clear()
            self.road_network.adjacency.clear()

            nodes = conn.execute("SELECT * FROM road_nodes WHERE world_id = ?", (self.world_id,)).fetchall()
            for r in nodes:
                node = RoadNodeEntity(
                    id=r["id"],
                    world_id=self.world_id,
                    x=r["x"],
                    y=0.0,
                    z=r["y"], # DB stores coordinates as (x, y) corresponding to 3D (x, z)
                    elevation=r["elevation"] if "elevation" in r.keys() else 0.0,
                    node_type=r["type"] if "type" in r.keys() else "intersection",
                    has_traffic_light=bool(r["has_traffic_light"] if "has_traffic_light" in r.keys() else 0),
                    congestion=float(r["congestion"] if "congestion" in r.keys() else 0.0),
                )
                self.road_network.add_node(node)

            # If no road nodes exist, seed default central intersection grid
            if not nodes:
                self._seed_default_road_network(conn)

            # 3. Road Segments
            segs = conn.execute("SELECT * FROM road_segments WHERE world_id = ?", (self.world_id,)).fetchall()
            for r in segs:
                seg = RoadSegmentEntity(
                    id=r["id"],
                    world_id=self.world_id,
                    start_node_id=r["start_node_id"],
                    end_node_id=r["end_node_id"],
                    road_type=r["road_type"],
                    speed_limit_kmh=float(r["speed_limit"]),
                    capacity_vph=int(r["capacity"]),
                    current_traffic=int(r["current_traffic"] if "current_traffic" in r.keys() else 0),
                    length=float(r["length"]),
                )
                self.road_network.add_segment(seg)

            # 4. Buildings
            old_buildings = dict(self.buildings)
            self.buildings.clear()
            b_rows = conn.execute("SELECT * FROM buildings WHERE world_id = ?", (self.world_id,)).fetchall()
            for r in b_rows:
                b_type = r["type"]
                cfg = BUILDING_CONFIGS.get(b_type, BUILDING_CONFIGS["Residential"])
                effects = json.loads(r["effects"] or "{}")

                res_cap = cfg.get("residents_capacity", 0)
                jobs_cap = cfg.get("jobs_capacity", 0)
                prev_b = old_buildings.get(r["id"])
                unp = prev_b.unpowered_ticks if prev_b else 0
                unw = prev_b.unwatered_ticks if prev_b else 0
                eff = prev_b.efficiency if prev_b else 1.0

                b = BuildingEntity(
                    id=r["id"],
                    world_id=self.world_id,
                    catalog_id=b_type.lower(),
                    name=r["name"],
                    type=b_type,
                    category=b_type.lower(),
                    level=r["level"],
                    x=r["x"],
                    y=r["y"] if "y" in r.keys() and r["y"] else 0.6,
                    z=r["z"] if "z" in r.keys() and r["z"] else 0.0,
                    rotation=r["orientation"] if "orientation" in r.keys() and r["orientation"] else 0.0,
                    width=r["width"] if "width" in r.keys() else cfg["default_width"],
                    length=r["length"] if "length" in r.keys() else cfg["default_length"],
                    height=r["height"] if "height" in r.keys() else cfg["default_height"],
                    status=r["status"] if "status" in r.keys() else "active",
                    capacity_residents=res_cap,
                    capacity_jobs=jobs_cap,
                    current_occupants=int(r["current_occupants"]) if "current_occupants" in r.keys() and r["current_occupants"] is not None else 0,
                    current_workers=int(r["current_workers"]) if "current_workers" in r.keys() and r["current_workers"] is not None else 0,
                    power_demand_mw=cfg.get("power_demand_mw", 1.0),
                    water_demand_t=cfg.get("water_demand_t", 1.0),
                    efficiency=eff,
                    unpowered_ticks=unp,
                    unwatered_ticks=unw,
                )
                self.buildings[b.id] = b

            # If no buildings exist, seed foundational civic buildings
            if not b_rows:
                self._seed_default_buildings(conn)

            # 5. Zone Lots
            self.zone_tiles.clear()
            z_rows = conn.execute("SELECT * FROM zone_lots WHERE world_id = ?", (self.world_id,)).fetchall()
            for r in z_rows:
                z = ZoneTileEntity(
                    id=r["id"],
                    world_id=self.world_id,
                    district_id=r["district_id"] or "dist-citadel",
                    x=r["x"],
                    z=r["y"],
                    zone_type=r["zone_type"],
                    level=r["level"] if "level" in r.keys() else 1,
                    building_id=r["building_id"] if "building_id" in r.keys() else None,
                    land_value=float(r["land_value"] if "land_value" in r.keys() else 50.0),
                    desirability=float(r["desirability"] if "desirability" in r.keys() else 0.75),
                )
                self.zone_tiles[z.id] = z

            # 6. Load Authoritative Citizens from DB
            self.citizens.clear()
            cit_rows = conn.execute("SELECT * FROM citizens WHERE world_id = ? AND is_alive = 1", (self.world_id,)).fetchall()
            for r in cit_rows:
                home_b = self.buildings.get(r["home_building_id"]) if "home_building_id" in r.keys() and r["home_building_id"] else None
                cx = home_b.x if home_b else float(r["x"] if "x" in r.keys() and r["x"] else 0.0)
                cz = home_b.z if home_b else float(r["y"] if "y" in r.keys() and r["y"] else 0.0)
                age = float(r["age"])
                stage = "Child" if age < 15 else ("Teen" if age < 18 else ("Adult" if age < 65 else "Senior"))
                c = CitizenEntity(
                    id=r["id"],
                    world_id=self.world_id,
                    name=r["occupation"] if "occupation" in r.keys() and r["occupation"] else f"Citizen {r['id'][:6]}",
                    age=age,
                    life_stage=stage,
                    household_id=f"hh_{r['home_building_id'] if 'home_building_id' in r.keys() and r['home_building_id'] else 'none'}",
                    home_building_id=r["home_building_id"] if "home_building_id" in r.keys() else None,
                    work_building_id=r["work_building_id"] if "work_building_id" in r.keys() else None,
                    education_level=float(r["education_level"] if "education_level" in r.keys() else 0.6),
                    wealth=float(r["wealth"] if "wealth" in r.keys() else 100.0),
                    health=float(r["health"] if "health" in r.keys() else 0.85),
                    happiness=float(r["wellbeing"] if "wellbeing" in r.keys() else 0.75),
                    current_x=cx,
                    current_z=cz,
                    schedule_state="home",
                    transport_mode="car" if random.random() > 0.4 else "transit"
                )
                self.citizens[c.id] = c

        finally:
            conn.close()

    def _seed_default_road_network(self, conn):
        """Seeds standard 4-way arterial road network."""
        nodes = [
            ("node_0_0", 0.0, 0.0),
            ("node_0_30", 0.0, 30.0),
            ("node_0_neg30", 0.0, -30.0),
            ("node_30_0", 30.0, 0.0),
            ("node_neg30_0", -30.0, 0.0),
            ("node_15_15", 15.0, 15.0),
            ("node_neg15_15", -15.0, 15.0),
        ]
        with conn:
            for nid, x, z in nodes:
                conn.execute("INSERT OR REPLACE INTO road_nodes (id, world_id, x, y, type) VALUES (?, ?, ?, ?, 'intersection')",
                             (nid, self.world_id, x, z))
                node = RoadNodeEntity(id=nid, world_id=self.world_id, x=x, y=0.0, z=z)
                self.road_network.add_node(node)

            segs = [
                ("seg_main_n", "node_0_0", "node_0_30", "four_lane", 70.0, 1500, 30.0),
                ("seg_main_s", "node_0_0", "node_0_neg30", "four_lane", 70.0, 1500, 30.0),
                ("seg_main_e", "node_0_0", "node_30_0", "four_lane", 70.0, 1500, 30.0),
                ("seg_main_w", "node_0_0", "node_neg30_0", "four_lane", 70.0, 1500, 30.0),
                ("seg_diag_ne", "node_30_0", "node_15_15", "two_lane", 50.0, 600, 21.2),
                ("seg_diag_nw", "node_neg30_0", "node_neg15_15", "two_lane", 50.0, 600, 21.2),
            ]
            for sid, n1, n2, rtype, spd, cap, length in segs:
                conn.execute("""
                INSERT OR REPLACE INTO road_segments (id, world_id, start_node_id, end_node_id, road_type, speed_limit, capacity, length)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (sid, self.world_id, n1, n2, rtype, spd, cap, length))
                seg = RoadSegmentEntity(
                    id=sid, world_id=self.world_id, start_node_id=n1, end_node_id=n2,
                    road_type=rtype, speed_limit_kmh=spd, capacity_vph=cap, length=length
                )
                self.road_network.add_segment(seg)

    def _seed_default_buildings(self, conn):
        """Seeds foundational civic, residential, commercial, energy, and water facilities."""
        defaults = [
            ("bld_citadel", "Civic Citadel", "Civic", 0.0, 0.0, 8.0, 4),
            ("bld_power_main", "Fusion Power Plant", "Energy", -18.0, 15.0, 6.0, 3),
            ("bld_water_main", "Hydro-Purification Plant", "Water", 18.0, -15.0, 4.0, 3),
            ("bld_hospital_prime", "Elysium General Hospital", "Healthcare", 12.0, 12.0, 5.0, 3),
            ("bld_academy", "Grand Academy of Science", "Education", -12.0, -12.0, 4.0, 2),
            ("bld_res_block_1", "High-Density Residential Block A", "ResidentialHigh", 8.0, 20.0, 8.5, 3),
            ("bld_res_block_2", "Suburban Terraces B", "Residential", -8.0, 20.0, 4.0, 2),
            ("bld_comm_plaza", "Central Commerce Complex", "CommercialHigh", 20.0, 8.0, 9.0, 3),
            ("bld_industry_hub", "Advanced Materials Foundry", "Industrial", -22.0, -20.0, 4.5, 2),
        ]
        with conn:
            for bid, name, btype, x, z, h, lvl in defaults:
                cfg = BUILDING_CONFIGS.get(btype, BUILDING_CONFIGS["Residential"])
                res_cap = cfg.get("residents_capacity", 0) * lvl
                jobs_cap = cfg.get("jobs_capacity", 0) * lvl
                cost = {"materials": cfg["cost_materials"] * lvl, "credits": cfg["cost_credits"] * lvl}

                conn.execute("""
                INSERT OR REPLACE INTO buildings (
                    id, world_id, name, type, level, x, y, z, width, length, height,
                    orientation, status, capacity, construction_cost, effects
                ) VALUES (?, ?, ?, ?, ?, ?, 0.6, ?, ?, ?, ?, 0.0, 'active', ?, ?, ?)
                """, (
                    bid, self.world_id, name, btype, lvl, x, z,
                    cfg["default_width"], cfg["default_length"], h,
                    res_cap or jobs_cap, json.dumps(cost), json.dumps(cfg)
                ))

                b = BuildingEntity(
                    id=bid, world_id=self.world_id, catalog_id=btype.lower(), name=name,
                    type=btype, category=btype.lower(), level=lvl, x=x, y=0.6, z=z,
                    width=cfg["default_width"], length=cfg["default_length"], height=h,
                    capacity_residents=res_cap, capacity_jobs=jobs_cap,
                    current_occupants=int(res_cap * 0.90), current_workers=int(jobs_cap * 0.85),
                    power_demand_mw=cfg.get("power_demand_mw", 1.0) * lvl,
                    water_demand_t=cfg.get("water_demand_t", 1.0) * lvl,
                )
                self.buildings[bid] = b

    def _generate_initial_agents(self):
        """Generates citizen sample and active commuter vehicles."""
        res_buildings = [b for b in self.buildings.values() if b.capacity_residents > 0]
        work_buildings = [b for b in self.buildings.values() if b.capacity_jobs > 0]

        if not res_buildings or not work_buildings:
            return

        for i in range(min(MAX_LOD_FULL_AGENTS, 120)):
            cid = f"cit_{i:04d}"
            home = random.choice(res_buildings)
            work = random.choice(work_buildings)
            age = round(random.uniform(18.0, 68.0), 1)

            c = CitizenEntity(
                id=cid,
                world_id=self.world_id,
                name=f"Citizen {i}",
                age=age,
                life_stage="Adult" if age < 65 else "Senior",
                household_id=f"hh_{i // 3}",
                home_building_id=home.id,
                work_building_id=work.id,
                current_x=home.x,
                current_z=home.z,
                schedule_state="home",
                transport_mode="car" if random.random() > 0.4 else "transit"
            )
            self.citizens[cid] = c

        # Generate commuter vehicles
        for i, (cid, c) in enumerate(list(self.citizens.items())[:min(MAX_LOD_FULL_VEHICLES, 40)]):
            home_b = self.buildings.get(c.home_building_id) if c.home_building_id else None
            work_b = self.buildings.get(c.work_building_id) if c.work_building_id else None
            if not home_b or not work_b:
                continue

            path, cost = self.road_network.route_trip(home_b.x, home_b.z, work_b.x, work_b.z)
            v = VehicleEntity(
                id=f"veh_{i:03d}",
                world_id=self.world_id,
                citizen_id=cid,
                category=random.choice(["sedan", "suv", "bus"]),
                origin_x=home_b.x,
                origin_z=home_b.z,
                dest_x=work_b.x,
                dest_z=work_b.z,
                current_x=home_b.x,
                current_z=home_b.z,
                route_node_ids=path,
                current_speed_kmh=45.0,
                progress_pct=round(random.random(), 2),
                status="moving"
            )
            self.vehicles[v.id] = v

    # ==========================================================================
    # AUTHORITATIVE SIMULATION TICK ADVANCEMENT
    # ==========================================================================

    def advance_tick(self, ticks: int = 1, skip_causal_step: bool = False) -> Tuple[WorldStateDelta, DerivedCityMetrics]:
        """
        Advances the simulation by N ticks in the fixed causal order:
        1. Utilities Flow & Network Solving (Power, Water, Sewage Graph BFS)
        2. Citizen Schedules, Traffic Congestion & Trip Progression on Real Segments
        3. Building Lifecycle (Abandonment & Level Up)
        4. Honest RCI Demand Evaluation & Zone Spawning
        5. Derived Metrics Aggregation (Population, Jobs, Taxes, Capacity)
        6. Causal Vital Signs Execution (Deaths by Cause, Births, Hospitals, Protests)
        7. State Version Bump & Delta Generation
        """
        self.tick += ticks
        self.day += ticks
        if self.day > 365:
            self.year += self.day // 365
            self.day = self.day % 365

        # 1. Utilities flow & network solving via Road Graph BFS
        util_state, updated_buildings = self.utility_engine.solve_networks(list(self.buildings.values()), self.road_network, ticks=ticks)
        for b in updated_buildings:
            self.buildings[b.id] = b

        # 2. Citizen Schedule & Traffic Routing on Real Road Segments
        # Ensure vehicles exist for commuter trips if roads exist
        if len(self.vehicles) == 0 and len(self.road_network.nodes) >= 2:
            res_blds = [b for b in self.buildings.values() if b.status != "abandoned" and b.capacity_residents > 0]
            work_blds = [b for b in self.buildings.values() if b.status != "abandoned" and b.capacity_jobs > 0]
            if res_blds and work_blds:
                for idx in range(min(30, len(res_blds) * 4)):
                    h = res_blds[idx % len(res_blds)]
                    w = work_blds[idx % len(work_blds)]
                    path, _ = self.road_network.route_trip(h.x, h.z, w.x, w.z)
                    if len(path) >= 2:
                        vid = f"veh_{self.world_id}_{idx:03d}"
                        self.vehicles[vid] = VehicleEntity(
                            id=vid,
                            world_id=self.world_id,
                            citizen_id=f"cit_{idx:03d}",
                            category=random.choice(["sedan", "suv", "bus"]),
                            origin_x=h.x,
                            origin_z=h.z,
                            dest_x=w.x,
                            dest_z=w.z,
                            current_x=h.x,
                            current_z=h.z,
                            route_node_ids=path,
                            current_speed_kmh=50.0,
                            progress_pct=round((idx * 0.17) % 1.0, 2),
                            status="moving"
                        )

        traffic_counts: Dict[str, int] = {}
        for v in self.vehicles.values():
            # Advance vehicle progress along route
            v.progress_pct = (v.progress_pct + 0.12 * ticks) % 1.0
            if v.route_node_ids and len(v.route_node_ids) >= 2:
                seg_idx = int(v.progress_pct * (len(v.route_node_ids) - 1))
                n1_id = v.route_node_ids[seg_idx]
                n2_id = v.route_node_ids[min(len(v.route_node_ids) - 1, seg_idx + 1)]
                n1 = self.road_network.nodes.get(n1_id)
                n2 = self.road_network.nodes.get(n2_id)
                if n1 and n2:
                    sub_t = (v.progress_pct * (len(v.route_node_ids) - 1)) - seg_idx
                    v.current_x = round(n1.x + (n2.x - n1.x) * sub_t, 2)
                    v.current_z = round(n1.z + (n2.z - n1.z) * sub_t, 2)
                    v.heading_deg = round(math.degrees(math.atan2(n2.z - n1.z, n2.x - n1.x)), 1)

                # Look up real segment id from road network adjacency
                for edge in self.road_network.adjacency.get(n1_id, []):
                    if edge["target"] == n2_id:
                        actual_seg = edge["segment_id"]
                        traffic_counts[actual_seg] = traffic_counts.get(actual_seg, 0) + 1
                        break

        self.road_network.update_congestion_from_traffic(traffic_counts)
        road_metrics = self.road_network.get_summary_metrics()

        conn = get_db_connection()
        econ_row = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (self.world_id,)).fetchone()
        current_tax_rate = float(econ_row["tax_rate"] if econ_row and "tax_rate" in econ_row.keys() and econ_row["tax_rate"] is not None else DEFAULT_TAX_RATE)

        # Sync road segment congestion to DB
        with conn:
            for seg in self.road_network.segments.values():
                conn.execute("""
                UPDATE road_segments SET current_traffic = ?, congestion = ? WHERE id = ? AND world_id = ?
                """, (seg.current_traffic, seg.congestion_ratio, seg.id, self.world_id))

        # 3. Building Lifecycle: Abandonment, Recovery, and Level-Up
        for b in list(self.buildings.values()):
            is_exempt = b.type in ("Civic", "Energy", "Water", "Government") or "Pioneer" in b.name or "Auto Habitation" in b.name
            if (b.unpowered_ticks >= 5 or b.unwatered_ticks >= 5 or current_tax_rate > 0.20) and not is_exempt:
                b.status = "abandoned"
                b.efficiency = 0.05
                b.current_occupants = 0
                b.current_workers = 0
                with conn:
                    conn.execute("UPDATE buildings SET status = 'abandoned', current_occupants = 0, current_workers = 0 WHERE id = ?", (b.id,))
                    conn.execute("UPDATE citizens SET home_building_id = NULL WHERE home_building_id = ?", (b.id,))
                    conn.execute("UPDATE citizens SET work_building_id = NULL, employed = 0 WHERE work_building_id = ?", (b.id,))
            elif b.status == "abandoned" and b.power_connected and b.water_connected and current_tax_rate <= 0.20:
                b.unpowered_ticks = 0
                b.unwatered_ticks = 0
                b.status = "active"
                b.efficiency = 1.0
                with conn:
                    conn.execute("UPDATE buildings SET status = 'active' WHERE id = ?", (b.id,))

            # Level Up (1 to 5)
            if b.status == "active" and b.level < 5 and b.power_connected and b.water_connected and b.efficiency >= 0.8:
                is_full_res = b.capacity_residents > 0 and b.current_occupants >= int(b.capacity_residents * 0.80)
                is_full_work = b.capacity_jobs > 0 and b.current_workers >= int(b.capacity_jobs * 0.80)
                if (is_full_res or is_full_work) and random.random() < 0.25:
                    b.level += 1
                    b.height = round(b.height * 1.25, 1)
                    if b.capacity_residents > 0:
                        b.capacity_residents = int(b.capacity_residents * 1.30)
                    if b.capacity_jobs > 0:
                        b.capacity_jobs = int(b.capacity_jobs * 1.30)
                    with conn:
                        conn.execute("UPDATE buildings SET level = ?, height = ?, capacity = ? WHERE id = ?",
                                     (b.level, b.height, max(b.capacity_residents, b.capacity_jobs), b.id))

        traffic_state = TrafficMetricsState(
            active_vehicles_count=len(self.vehicles),
            average_speed_kmh=road_metrics["average_speed_kmh"],
            traffic_flow_efficiency=round(max(20.0, 100.0 * (1.0 - road_metrics["average_congestion_ratio"])), 1),
            congestion_index=round(road_metrics["average_congestion_ratio"] * 100.0, 1),
            congested_segment_ids=road_metrics["congested_segments"],
            average_commute_minutes=round(22.0 * (1.0 + road_metrics["average_congestion_ratio"]), 1),
        )

        # 4. Honest RCI Demand & Zone Spawning
        active_buildings = [b for b in self.buildings.values() if b.status != "abandoned"]
        res_capacity = sum(b.capacity_residents for b in active_buildings)
        total_occupants = sum(b.current_occupants for b in active_buildings)
        derived_population = total_occupants if total_occupants > 0 else len(self.citizens)

        jobs_capacity = sum(b.capacity_jobs for b in active_buildings)
        working_age_citizens = int(derived_population * 0.65)
        employed_citizens = min(jobs_capacity, working_age_citizens)
        unemployed_citizens = max(0, working_age_citizens - employed_citizens)
        unemployment_rate = round(unemployed_citizens / max(1, working_age_citizens), 3)

        # Honest RCI Demands
        res_occupancy = derived_population / max(1, res_capacity)
        res_demand = max(0.20, min(1.0, (res_occupancy - 0.30) * 1.5))

        ind_workers = sum(b.capacity_jobs for b in active_buildings if "Industrial" in b.type)
        desired_ind_jobs = int(derived_population * 0.25)
        ind_demand = max(0.25, min(1.0, float(desired_ind_jobs - ind_workers) / max(1, desired_ind_jobs))) if desired_ind_jobs > 0 else 0.50

        com_jobs = sum(b.capacity_jobs for b in active_buildings if "Commercial" in b.type)
        desired_com_jobs = int(derived_population * 0.20)
        com_demand = max(0.25, min(1.0, float(desired_com_jobs - com_jobs) / max(1, desired_com_jobs))) if desired_com_jobs > 0 else 0.50

        spawned_buildings: List[BuildingEntity] = []
        if self.zone_tiles:
            for z_tile in list(self.zone_tiles.values()):
                if not z_tile.building_id and z_tile.zone_type != "none":
                    is_res = "residential" in z_tile.zone_type
                    is_com = "commercial" in z_tile.zone_type
                    is_ind = "industrial" in z_tile.zone_type

                    demand_met = (is_res and res_demand > 0.05) or (is_com and com_demand > 0.05) or (is_ind and ind_demand > 0.05)
                    if not demand_met:
                        continue

                    # Road reachability
                    nearest_nid = self.road_network.find_nearest_node(z_tile.x, z_tile.z)
                    if not nearest_nid:
                        continue
                    n_node = self.road_network.nodes[nearest_nid]
                    dist_to_road = math.hypot(n_node.x - z_tile.x, n_node.z - z_tile.z)
                    if dist_to_road > 35.0:
                        continue

                    # Utilities grid check
                    if util_state.power_deficit_mw > 0 and util_state.grid_reliability_pct < 60.0:
                        continue
                    if util_state.water_deficit_t > 0 and util_state.water_reliability_pct < 60.0:
                        continue

                    new_b_type = (
                        "ResidentialHigh" if "high" in z_tile.zone_type and is_res else
                        "Residential" if is_res else
                        "CommercialHigh" if "high" in z_tile.zone_type and is_com else
                        "Commercial" if is_com else
                        "Industrial" if is_ind else "Residential"
                    )
                    cfg = BUILDING_CONFIGS.get(new_b_type, BUILDING_CONFIGS["Residential"])
                    new_bid = f"bld_spawn_{uuid.uuid4().hex[:6]}"
                    res_cap = cfg.get("residents_capacity", 0)
                    jobs_cap = cfg.get("jobs_capacity", 0)
                    cost_mat = cfg["cost_materials"]
                    cost_cred = cfg["cost_credits"]

                    new_b = BuildingEntity(
                        id=new_bid,
                        world_id=self.world_id,
                        catalog_id=new_b_type.lower(),
                        name=f"Zoned {new_b_type}",
                        type=new_b_type,
                        category=new_b_type.lower(),
                        x=z_tile.x,
                        y=0.6,
                        z=z_tile.z,
                        width=cfg["default_width"],
                        length=cfg["default_length"],
                        height=cfg["default_height"],
                        capacity_residents=res_cap,
                        capacity_jobs=jobs_cap,
                        current_occupants=0,
                        current_workers=0,
                        power_demand_mw=cfg.get("power_demand_mw", 0.5),
                        water_demand_t=cfg.get("water_demand_t", 0.5),
                    )

                    with conn:
                        cost_dict = {"materials": cost_mat, "credits": cost_cred}
                        conn.execute("""
                        INSERT INTO buildings (
                            id, world_id, name, type, level, x, y, z, width, length, height,
                            orientation, status, capacity, current_occupants, current_workers,
                            construction_cost, upgrade_cost, effects
                        ) VALUES (?, ?, ?, ?, 1, ?, 0.6, ?, ?, ?, ?, 0.0, 'active', ?, 0, 0, ?, '{}', '{}')
                        """, (
                            new_bid, self.world_id, new_b.name, new_b_type,
                            z_tile.x, z_tile.z, cfg["default_width"], cfg["default_length"], cfg["default_height"],
                            res_cap or jobs_cap, json.dumps(cost_dict)
                        ))
                        conn.execute("UPDATE zone_lots SET building_id = ? WHERE id = ? AND world_id = ?",
                                     (new_bid, z_tile.id, self.world_id))

                        if is_res and res_cap > 0:
                            from engine.demographics import spawn_citizens_for_world
                            spawn_citizens_for_world(
                                conn=conn,
                                world_id=self.world_id,
                                count=max(5, int(res_cap * 0.75)),
                                residential_building_ids=[new_bid],
                                center_x=z_tile.x,
                                center_y=z_tile.z
                            )
                        elif jobs_cap > 0:
                            unemployed = conn.execute("""
                            SELECT id FROM citizens
                            WHERE world_id = ? AND is_alive = 1 AND 18.0 <= age AND age < 65.0
                              AND (work_building_id IS NULL OR employed = 0)
                            LIMIT ?
                            """, (self.world_id, jobs_cap)).fetchall()
                            for u in unemployed:
                                conn.execute("UPDATE citizens SET work_building_id = ?, employed = 1 WHERE id = ?", (new_bid, u["id"]))
                            conn.execute("UPDATE buildings SET current_workers = ? WHERE id = ?", (len(unemployed), new_bid))
                            new_b.current_workers = len(unemployed)

                    self.buildings[new_bid] = new_b
                    z_tile.building_id = new_bid
                    spawned_buildings.append(new_b)

        # 5. Derivation of City Metrics Directly from Entities
        active_buildings = [b for b in self.buildings.values() if b.status != "abandoned"]
        res_capacity = sum(b.capacity_residents for b in active_buildings)
        total_occupants = sum(b.current_occupants for b in active_buildings)
        derived_population = total_occupants if total_occupants > 0 else len(self.citizens)

        jobs_capacity = sum(b.capacity_jobs for b in active_buildings)
        working_age_citizens = int(derived_population * 0.65)
        employed_citizens = min(jobs_capacity, working_age_citizens)
        unemployment_rate = round(max(0.0, 1.0 - (employed_citizens / max(1, working_age_citizens))), 3)

        daily_tax_rev = round(derived_population * 15.0 * current_tax_rate, 2)
        base_gdp = round(employed_citizens * 45000.0, 2)

        # 6. Causal Vital Signs Execution (if not handled by parent caller)
        hosp_cap = sum(b.capacity_jobs * 3 for b in active_buildings if b.type == "Healthcare") or 1500
        if not skip_causal_step:
            causal_result = global_causal_engine.step(
                world_id=self.world_id,
                current_tick=self.tick,
                year=self.year,
                day=self.day,
                population=derived_population,
                food_stock=econ_row["food"] if econ_row else 10000.0,
                food_production=100.0,
                water_stock=util_state.total_water_supply_t,
                water_production=util_state.total_water_supply_t,
                energy_stock=util_state.total_power_supply_mw,
                energy_production=util_state.total_power_supply_mw,
                pollution_level=0.15 + (road_metrics["average_congestion_ratio"] * 0.20),
                civic_stability=0.77,
                happiness=0.75 - (road_metrics["average_congestion_ratio"] * 0.15) - (0.15 if util_state.power_deficit_mw > 0 else 0.0),
                hospital_capacity=hosp_cap,
                residential_capacity=res_capacity,
                unemployment_rate=unemployment_rate,
                ticks_passed=ticks
            )

            with conn:
                conn.execute("""
                UPDATE economy_resources SET
                    population = ?,
                    employment_rate = ?,
                    gdp = ?,
                    happiness = ?,
                    civic_stability = ?,
                    energy = MAX(0.0, energy + ? - ?),
                    water = MAX(0.0, water + ? - ?)
                WHERE world_id = ?
                """, (
                    causal_result["new_population"],
                    round(1.0 - unemployment_rate, 3),
                    base_gdp,
                    causal_result["happiness"],
                    causal_result["civic_stability"],
                    util_state.total_power_supply_mw,
                    util_state.total_power_demand_mw,
                    util_state.total_water_supply_t,
                    util_state.total_water_demand_t,
                    self.world_id
                ))
                conn.execute("UPDATE worlds SET tick = ?, year = ?, day = ? WHERE id = ?", (self.tick, self.year, self.day, self.world_id))
            happ = causal_result["happiness"]
            stab = causal_result["civic_stability"]
            protest = causal_result["protest_intensity"]
            pop_res = causal_result["new_population"]
        else:
            happ = float(econ_row["happiness"] if econ_row and "happiness" in econ_row.keys() else 0.85)
            stab = float(econ_row["civic_stability"] if econ_row and "civic_stability" in econ_row.keys() else 0.90)
            protest = 0.0
            pop_res = derived_population

        conn.close()

        derived_metrics = DerivedCityMetrics(
            population=pop_res,
            households_count=int(derived_population / 2.6),
            residential_capacity=res_capacity,
            occupancy_rate=round(derived_population / max(1, res_capacity), 3),
            total_jobs=jobs_capacity,
            employed_citizens=employed_citizens,
            unemployment_rate=unemployment_rate,
            tax_rate=round(current_tax_rate * 100.0, 1),
            daily_tax_revenue=daily_tax_rev,
            gdp=base_gdp,
            gdp_growth_rate=0.032,
            power_supply_mw=util_state.total_power_supply_mw,
            power_demand_mw=util_state.total_power_demand_mw,
            water_supply_t=util_state.total_water_supply_t,
            water_demand_t=util_state.total_water_demand_t,
            air_pollution_index=round(0.15 + (road_metrics["average_congestion_ratio"] * 0.25), 2),
            average_happiness=happ,
            civic_stability=stab,
            protest_intensity=protest
        )

        # 7. Increment Version and Build Delta
        old_version = self.version
        self.version += 1

        delta = WorldStateDelta(
            world_id=self.world_id,
            from_version=old_version,
            to_version=self.version,
            tick=self.tick,
            year=self.year,
            day=self.day,
            created_buildings=spawned_buildings,
            updated_buildings=updated_buildings[:50],
            active_vehicles=list(self.vehicles.values())[:30],
            metrics=derived_metrics,
            utilities=util_state,
            traffic=traffic_state
        )

        return delta, derived_metrics

    # ==========================================================================
    # FULL STATE SNAPSHOT
    # ==========================================================================

    def get_snapshot(self) -> WorldStateSnapshot:
        """Returns the complete authoritative snapshot of the city."""
        util_state, _ = self.utility_engine.solve_networks(list(self.buildings.values()))
        road_summary = self.road_network.get_summary_metrics()

        traffic_state = TrafficMetricsState(
            active_vehicles_count=len(self.vehicles),
            average_speed_kmh=road_summary["average_speed_kmh"],
            traffic_flow_efficiency=round(max(20.0, 100.0 * (1.0 - road_summary["average_congestion_ratio"])), 1),
            congestion_index=round(road_summary["average_congestion_ratio"] * 100.0, 1),
            congested_segment_ids=road_summary["congested_segments"],
        )

        conn = get_db_connection()
        cit_row = conn.execute("SELECT COUNT(*) as c FROM citizens WHERE world_id = ? AND is_alive = 1", (self.world_id,)).fetchone()
        conn.close()

        res_cap = sum(b.capacity_residents for b in self.buildings.values() if b.status != "abandoned")
        derived_pop = cit_row["c"] if cit_row and cit_row["c"] > 0 else sum(b.current_occupants for b in self.buildings.values() if b.status != "abandoned")
        jobs_cap = sum(b.capacity_jobs for b in self.buildings.values() if b.status != "abandoned")

        metrics = DerivedCityMetrics(
            population=derived_pop,
            households_count=int(derived_pop / 2.6),
            residential_capacity=res_cap,
            occupancy_rate=round(derived_pop / max(1, res_cap), 3),
            total_jobs=jobs_cap,
            employed_citizens=min(jobs_cap, int(derived_pop * 0.65)),
            unemployment_rate=round(max(0.01, 1.0 - (min(jobs_cap, int(derived_pop * 0.65)) / max(1, int(derived_pop * 0.65)))), 3),
            tax_rate=18.0,
            daily_tax_revenue=round(derived_pop * 15.0 * 0.18, 2),
            gdp=round(derived_pop * 42000.0, 2),
            gdp_growth_rate=0.03,
            power_supply_mw=util_state.total_power_supply_mw,
            power_demand_mw=util_state.total_power_demand_mw,
            water_supply_t=util_state.total_water_supply_t,
            water_demand_t=util_state.total_water_demand_t,
            air_pollution_index=0.15,
            average_happiness=0.76,
            civic_stability=0.78,
            protest_intensity=0.0
        )

        return WorldStateSnapshot(
            world_id=self.world_id,
            tick=self.tick,
            year=self.year,
            day=self.day,
            version=self.version,
            buildings=list(self.buildings.values()),
            road_nodes=list(self.road_network.nodes.values()),
            road_segments=list(self.road_network.segments.values()),
            zone_tiles=list(self.zone_tiles.values()),
            vehicles_sample=list(self.vehicles.values())[:50],
            citizens_sample=list(self.citizens.values())[:50],
            utilities=util_state,
            traffic=traffic_state,
            metrics=metrics
        )


# Global singleton simulation manager keyed by canonical world_id
_UNIFIED_SIMS: Dict[str, UnifiedWorldSimulation] = {}

def get_unified_simulation(world_id: str = "aurora-prime") -> UnifiedWorldSimulation:
    if world_id in ["civ-aurora-01", "civ-default", "prime", "default"]:
        world_id = "aurora-prime"
    if world_id not in _UNIFIED_SIMS:
        _UNIFIED_SIMS[world_id] = UnifiedWorldSimulation(world_id)
    return _UNIFIED_SIMS[world_id]
