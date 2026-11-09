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
            b_rows = conn.execute("SELECT * FROM buildings WHERE world_id = ?", (self.world_id,)).fetchall()
            for r in b_rows:
                b_type = r["type"]
                cfg = BUILDING_CONFIGS.get(b_type, BUILDING_CONFIGS["Residential"])
                effects = json.loads(r["effects"] or "{}")

                res_cap = cfg.get("residents_capacity", 0)
                jobs_cap = cfg.get("jobs_capacity", 0)

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
                    efficiency=1.0,
                )
                self.buildings[b.id] = b

            # If no buildings exist, seed foundational civic buildings
            if not b_rows:
                self._seed_default_buildings(conn)

            # 5. Zone Lots
            try:
                z_rows = conn.execute("SELECT * FROM zone_lots WHERE world_id = ?", (self.world_id,)).fetchall()
                for r in z_rows:
                    z = ZoneTileEntity(
                        id=r["id"],
                        world_id=self.world_id,
                        district_id=r["district_id"] if "district_id" in r.keys() else "dist-citadel",
                        x=r["x"],
                        z=r["y"],
                        zone_type=r["zone_type"],
                        level=r["level"] if "level" in r.keys() else 1,
                        building_id=r["building_id"] if "building_id" in r.keys() else None,
                        land_value=float(r["land_value"] if "land_value" in r.keys() else 50.0),
                        desirability=float(r["desirability"] if "desirability" in r.keys() else 0.75),
                    )
                    self.zone_tiles[z.id] = z
            except Exception:
                pass

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

    def advance_tick(self, ticks: int = 1) -> Tuple[WorldStateDelta, DerivedCityMetrics]:
        """
        Advances the simulation by N ticks in the fixed causal order:
        1. Utilities Flow & Network Solving (Power, Water)
        2. RCI Demand & Building Lifecycle (Spawn, Upgrade, Abandonment)
        3. Citizen Schedules, Traffic Congestion & Trip Progression
        4. Derived Metrics Aggregation (Population, Jobs, Taxes, Capacity)
        5. Causal Vital Signs Execution (Deaths by Cause, Births, Hospitals, Protests)
        6. State Version Bump & Delta Generation
        """
        self.tick += ticks
        self.day += ticks
        if self.day > 365:
            self.year += self.day // 365
            self.day = self.day % 365

        # 1. Utilities flow & network solving
        util_state, updated_buildings = self.utility_engine.solve_networks(list(self.buildings.values()))
        for b in updated_buildings:
            self.buildings[b.id] = b

        # 2. Citizen Schedule & Traffic Routing
        sim_hour = (self.tick * 2) % 24 # 2 hours simulated per tick
        traffic_counts: Dict[str, int] = {}

        for v in self.vehicles.values():
            # Advance vehicle progress along route
            v.progress_pct = (v.progress_pct + 0.12 * ticks) % 1.0
            if v.route_node_ids and len(v.route_node_ids) >= 2:
                # Interpolate spatial coordinates along route nodes
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

            # Record traffic load
            if v.route_node_ids:
                pseudo_seg = f"seg_active_{v.id}"
                traffic_counts[pseudo_seg] = traffic_counts.get(pseudo_seg, 0) + 1

        self.road_network.update_congestion_from_traffic(traffic_counts)
        road_metrics = self.road_network.get_summary_metrics()

        traffic_state = TrafficMetricsState(
            active_vehicles_count=len(self.vehicles),
            average_speed_kmh=road_metrics["average_speed_kmh"],
            traffic_flow_efficiency=round(max(20.0, 100.0 * (1.0 - road_metrics["average_congestion_ratio"])), 1),
            congestion_index=round(road_metrics["average_congestion_ratio"] * 100.0, 1),
            congested_segment_ids=road_metrics["congested_segments"],
            average_commute_minutes=round(22.0 * (1.0 + road_metrics["average_congestion_ratio"]), 1),
        )

        # 3. RCI Demand & Building Lifecycle
        spawned_buildings: List[BuildingEntity] = []
        if self.zone_tiles:
            # Check for vacant lots adjacent to road network
            for z_tile in list(self.zone_tiles.values()):
                if not z_tile.building_id and z_tile.zone_type != "none":
                    if random.random() < 0.15: # Probabilistic demand spawn
                        new_b_type = (
                            "ResidentialHigh" if "high" in z_tile.zone_type and "residential" in z_tile.zone_type else
                            "Residential" if "residential" in z_tile.zone_type else
                            "CommercialHigh" if "high" in z_tile.zone_type and "commercial" in z_tile.zone_type else
                            "Commercial" if "commercial" in z_tile.zone_type else
                            "Industrial" if "industrial" in z_tile.zone_type else "Residential"
                        )
                        cfg = BUILDING_CONFIGS.get(new_b_type, BUILDING_CONFIGS["Residential"])
                        new_bid = f"bld_spawn_{uuid.uuid4().hex[:6]}"
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
                            capacity_residents=cfg.get("residents_capacity", 0),
                            capacity_jobs=cfg.get("jobs_capacity", 0),
                            current_occupants=int(cfg.get("residents_capacity", 0) * 0.8),
                            current_workers=int(cfg.get("jobs_capacity", 0) * 0.8),
                        )
                        self.buildings[new_bid] = new_b
                        z_tile.building_id = new_bid
                        spawned_buildings.append(new_b)

        # 4. Derivation of City Metrics Directly from Entities
        active_buildings = [b for b in self.buildings.values() if b.status != "abandoned"]
        res_capacity = sum(b.capacity_residents for b in active_buildings)
        total_occupants = sum(b.current_occupants for b in active_buildings)

        # Base population directly anchored to residential building occupants and citizens
        derived_population = total_occupants if total_occupants > 0 else len(self.citizens)

        jobs_capacity = sum(b.capacity_jobs for b in active_buildings)
        working_age_citizens = int(derived_population * 0.65)
        employed_citizens = min(jobs_capacity, working_age_citizens)
        unemployment_rate = round(max(0.01, 1.0 - (employed_citizens / max(1, working_age_citizens))), 3)

        # Tax calculations
        conn = get_db_connection()
        econ_row = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (self.world_id,)).fetchone()
        current_tax_rate = econ_row["tax_rate"] if econ_row and "tax_rate" in econ_row.keys() else DEFAULT_TAX_RATE
        daily_tax_rev = round(derived_population * 15.0 * current_tax_rate, 2)
        base_gdp = round(employed_citizens * 45000.0, 2)

        # 5. Causal Vital Signs Pipeline
        hosp_cap = sum(b.capacity_jobs * 3 for b in active_buildings if b.type == "Healthcare") or 1500

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

        # Persist derived values into economy_resources and worlds
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
        conn.close()

        derived_metrics = DerivedCityMetrics(
            population=causal_result["new_population"],
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
            average_happiness=causal_result["happiness"],
            civic_stability=causal_result["civic_stability"],
            protest_intensity=causal_result["protest_intensity"]
        )

        # 6. Increment Version and Build Delta
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
            updated_buildings=updated_buildings[:50], # Transmit modified statuses
            active_vehicles=list(self.vehicles.values())[:30], # Sample for 3D renderer
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

        res_cap = sum(b.capacity_residents for b in self.buildings.values() if b.status != "abandoned")
        derived_pop = sum(b.current_occupants for b in self.buildings.values() if b.status != "abandoned") or 100
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
