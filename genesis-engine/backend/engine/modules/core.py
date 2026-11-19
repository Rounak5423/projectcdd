"""
GENESIS Engine v2.0 - Authoritative Unified Simulation Core
Module: engine.modules.core
Orchestrates the 9 authoritative modules in strict causal tick order:
1. Needs & Utilities -> 2. Environment -> 3. Health & Disease -> 4. Incidents ->
5. Emergency Response -> 6. Mortality & Births -> 7. Economy -> 8. Satisfaction ->
9. Unrest & Protest -> 10. Governance & Policy Reaction.
Supports deterministic seeded replay, continuous autosave, and multi-slot persistence.
"""

import copy
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple

from db.database import get_db_connection
from engine.world.state import (
    BuildingEntity,
    RoadNodeEntity,
    RoadSegmentEntity,
    ZoneTileEntity,
    VehicleEntity,
    UtilityNetworkState,
    TrafficMetricsState,
    DerivedCityMetrics,
    WorldStateSnapshot,
    WorldStateDelta
)
from .config import (
    TICKS_PER_DAY,
    TICKS_PER_MONTH,
    TICKS_PER_YEAR,
    get_seeded_rng
)
from .population import PopulationModule
from .resources import ResourcesModule
from .economy import EconomyModule
from .infrastructure import InfrastructureModule
from .environment import EnvironmentModule
from .governance import GovernanceModule
from .events import EventsModule
from .progression import ProgressionModule
from .future_sim import FutureSimModule
from .movement import MovementModule


class AuthoritativeSimulationCore:
    """
    Single authoritative world simulation engine enforcing 10-step causal order,
    deterministic reproducibility, multi-timescale passes (hourly/daily/monthly/yearly),
    and zero disconnected client numbers.
    """
    def __init__(self, world_id: str = "aurora-prime", seed: Optional[Any] = None):
        self.world_id = world_id
        self.seed = seed or world_id
        self.rng = get_seeded_rng(self.seed)

        # Simulation clock
        self.tick: int = 0
        self.year: int = 1
        self.day: int = 1
        self.version: int = 1
        self.status: str = "paused" # 'running', 'paused', 'stopped'
        self.speed: str = "1x"

        # Instantiate 9 subsystem modules + movement
        self.population_module = PopulationModule(world_id)
        self.resources_module = ResourcesModule(world_id)
        self.economy_module = EconomyModule(world_id)
        self.infra_module = InfrastructureModule(world_id)
        self.env_module = EnvironmentModule(world_id)
        self.gov_module = GovernanceModule(world_id)
        self.events_module = EventsModule(world_id)
        self.prog_module = ProgressionModule(world_id)
        self.future_module = FutureSimModule(world_id)
        self.movement_module = MovementModule(world_id)

        # In-memory entity collections
        self.buildings: Dict[str, BuildingEntity] = {}
        self.zone_tiles: Dict[str, ZoneTileEntity] = {}

        # Save slot registry
        self.save_slots: Dict[str, Dict[str, Any]] = {}

        # Load initial state from database
        self.load_from_db()

    def set_seed(self, seed: Any):
        """Resets RNG seed for deterministic replay testing."""
        self.seed = seed
        self.rng = get_seeded_rng(seed)

    def load_from_db(self):
        """Hydrates world entities and metrics from SQLite database."""
        conn = get_db_connection()
        world_row = conn.execute("SELECT * FROM worlds WHERE id = ?", (self.world_id,)).fetchone()
        if world_row:
            self.tick = int(world_row["tick"] or 0)
            self.year = int(world_row["year"] or 1)
            self.day = int(world_row["day"] or 1)
            self.status = world_row["simulation_status"] or "paused"
            self.speed = world_row["simulation_speed"] or "1x"

        # Load Buildings
        b_rows = conn.execute("SELECT * FROM buildings WHERE world_id = ?", (self.world_id,)).fetchall()
        for r in b_rows:
            b_id = r["id"]
            self.buildings[b_id] = BuildingEntity(
                id=b_id,
                world_id=self.world_id,
                catalog_id=r["type"].lower(),
                name=r["name"],
                type=r["type"],
                category=r["type"].lower(),
                level=r["level"],
                x=r["x"],
                y=r["y"] or 0.6,
                z=r["z"],
                width=r["width"] or 2.5,
                length=r["length"] or 2.5,
                height=r["height"] or 4.0,
                status=r["status"] or "active",
                capacity_residents=r["capacity"] if "Residential" in r["type"] else 0,
                capacity_jobs=r["capacity"] if ("Commercial" in r["type"] or "Industrial" in r["type"]) else 0,
                current_occupants=r["current_occupants"] or 0,
                current_workers=r["current_workers"] or 0
            )

        if not self.buildings:
            defaults = [
                ("bld_citadel", "Civic Citadel", "Civic", 0.0, 0.0, 8.0, 4, 0, 50, 2.0, 2.0),
                ("bld_power_main", "Fusion Power Plant", "Energy", -18.0, 15.0, 6.0, 3, 0, 20, 0.0, 1.0),
                ("bld_water_main", "Hydro-Purification Plant", "Water", 18.0, -15.0, 4.0, 3, 0, 20, 1.0, 0.0),
                ("bld_hospital_prime", "Elysium General Hospital", "Healthcare", 12.0, 12.0, 5.0, 3, 0, 60, 2.0, 2.0),
                ("bld_academy", "Grand Academy of Science", "Education", -12.0, -12.0, 4.0, 2, 0, 40, 1.5, 1.5),
                ("bld_res_block_1", "High-Density Residential Block A", "ResidentialHigh", 8.0, 20.0, 8.5, 3, 120, 0, 3.0, 3.0),
                ("bld_res_block_2", "Suburban Terraces B", "Residential", -8.0, 20.0, 4.0, 2, 60, 0, 1.5, 1.5),
                ("bld_comm_plaza", "Central Commerce Complex", "CommercialHigh", 20.0, 8.0, 9.0, 3, 0, 80, 2.5, 2.0),
                ("bld_industry_hub", "Advanced Materials Foundry", "Industrial", -22.0, -20.0, 4.5, 2, 0, 70, 4.0, 2.5),
            ]
            for bid, bname, btype, bx, bz, bh, blvl, bres, bjob, bpow, bwat in defaults:
                self.buildings[bid] = BuildingEntity(
                    id=bid,
                    world_id=self.world_id,
                    catalog_id=btype.lower(),
                    name=bname,
                    type=btype,
                    category=btype.lower(),
                    level=blvl,
                    x=bx,
                    y=0.6,
                    z=bz,
                    width=4.0,
                    length=4.0,
                    height=bh,
                    status="active",
                    capacity_residents=bres,
                    capacity_jobs=bjob,
                    current_occupants=int(bres * 0.90),
                    current_workers=int(bjob * 0.85),
                    power_demand_mw=bpow,
                    water_demand_t=bwat
                )

        # Load Citizens
        cit_rows = conn.execute("SELECT * FROM citizens WHERE world_id = ?", (self.world_id,)).fetchall()
        if cit_rows:
            self.population_module.load_from_list([dict(cr) for cr in cit_rows])
        else:
            sample_citizens = []
            for i in range(150):
                cid = f"cit_{self.world_id}_{i:04d}"
                sample_citizens.append({
                    "id": cid,
                    "world_id": self.world_id,
                    "name": f"Citizen {i}",
                    "age": 22.0 + (i % 55),
                    "sex": "F" if i % 2 == 0 else "M",
                    "education": 0.55,
                    "health": 0.90,
                    "wealth": 120.0,
                    "employed": 1 if 18 <= (22 + (i % 55)) < 65 else 0,
                    "occupation": "Technician" if i % 3 == 0 else "Specialist"
                })
            self.population_module.load_from_list(sample_citizens)

        # Load Economy Resources
        econ_row = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (self.world_id,)).fetchone()
        if econ_row:
            self.resources_module.food_stock = float(econ_row["food"] or 10000.0)
            self.resources_module.water_stock = float(econ_row["water"] or 15000.0)
            self.resources_module.energy_stock = float(econ_row["energy"] or 5000.0)
            self.resources_module.materials_stock = float(econ_row["materials"] or 8000.0)
            self.economy_module.tax_rate = float(econ_row["tax_rate"] or 0.15)
            self.economy_module.treasury_credits = float(econ_row["genesis_research_credits"] or 250000.0)

        # Load Road Network
        nodes = conn.execute("SELECT * FROM road_nodes WHERE world_id = ?", (self.world_id,)).fetchall()
        for r in nodes:
            node = RoadNodeEntity(
                id=r["id"],
                world_id=self.world_id,
                x=r["x"],
                y=0.0,
                z=r["y"],
                elevation=r["elevation"] if "elevation" in r.keys() else 0.0,
                node_type=r["type"] if "type" in r.keys() else "intersection",
                has_traffic_light=bool(r["has_traffic_light"] if "has_traffic_light" in r.keys() else 0),
                congestion=float(r["congestion"] if "congestion" in r.keys() else 0.0),
            )
            self.infra_module.road_network.add_node(node)

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
            self.infra_module.road_network.add_segment(seg)

        # Ensure seed road network exists if empty
        if not nodes:
            default_nodes = [
                ("rn_center", 0.0, 0.0),
                ("rn_north", 0.0, 60.0),
                ("rn_south", 0.0, -60.0),
                ("rn_east", 60.0, 0.0),
                ("rn_west", -60.0, 0.0),
            ]
            for nid, nx, nz in default_nodes:
                self.infra_module.road_network.add_node(RoadNodeEntity(
                    id=nid, world_id=self.world_id, x=nx, y=0.0, z=nz
                ))
            default_segs = [
                ("rs_ns1", "rn_north", "rn_center", 60.0),
                ("rs_ns2", "rn_center", "rn_south", 60.0),
                ("rs_ew1", "rn_west", "rn_center", 60.0),
                ("rs_ew2", "rn_center", "rn_east", 60.0),
            ]
            for sid, n1, n2, l in default_segs:
                self.infra_module.road_network.add_segment(RoadSegmentEntity(
                    id=sid, world_id=self.world_id, start_node_id=n1, end_node_id=n2,
                    road_type="four_lane", speed_limit_kmh=50.0, capacity_vph=1200, length=l
                ))

        conn.close()

    def advance_tick(self, ticks: int = 1) -> Tuple[WorldStateDelta, DerivedCityMetrics]:
        """
        Advances the entire civilization by N ticks following the strict 10-step causal loop:
        1. Needs & Utilities
        2. Environment
        3. Health & Disease
        4. Incidents
        5. Emergency Response
        6. Mortality & Births
        7. Economy
        8. Citizen Satisfaction
        9. Unrest & Protest
        10. Governance & Policy Reaction
        """
        # Time progression
        self.tick += ticks
        days_advanced = ticks // TICKS_PER_DAY
        hours_remainder = ticks % TICKS_PER_DAY
        if ticks >= TICKS_PER_DAY:
            self.day += days_advanced
        else:
            if (self.tick % TICKS_PER_DAY) < ticks:
                self.day += 1

        if self.day > 365:
            self.year += self.day // 365
            self.day = self.day % 365

        # Active policy multipliers from prior step
        policy_mults = {}
        for pid, pstate in self.gov_module.policy_states.items():
            if pstate["status"] == "active":
                from .config import POLICY_CATALOG
                for k, v in POLICY_CATALOG[pid].get("effects", {}).items():
                    policy_mults[k] = policy_mults.get(k, 0.0) + v

        # STEP 1: Needs & Utilities (Power, Water, Sewage Graph BFS)
        util_state, updated_b_list, infra_summary = self.infra_module.step(
            ticks=ticks,
            buildings=self.buildings,
            current_tax_rate=self.economy_module.tax_rate,
            policy_multipliers=policy_mults
        )

        # STEP 1B: Resource Production Chains & Rationing
        res_summary = self.resources_module.step(
            ticks=ticks,
            population=len([c for c in self.population_module.citizens.values() if c.is_alive == 1]),
            buildings=list(self.buildings.values()),
            policy_multipliers=policy_mults
        )

        # STEP 1C: Traffic Movement & Commute Graph Solving
        # Plan sample commuter trips if roads exist
        if len(self.movement_module.vehicles) < 15 and len(self.infra_module.road_network.nodes) >= 2:
            res_blds = [b for b in self.buildings.values() if b.status != "abandoned" and b.capacity_residents > 0]
            work_blds = [b for b in self.buildings.values() if b.status != "abandoned" and b.capacity_jobs > 0]
            if res_blds and work_blds:
                h = res_blds[0]
                w = work_blds[0]
                self.movement_module.plan_trip(
                    self.infra_module.road_network,
                    h.x, h.z, w.x, w.z,
                    category="sedan", purpose="work"
                )

        lod_vehicles, traffic_summary = self.movement_module.step(
            ticks=ticks,
            road_net=self.infra_module.road_network
        )

        # STEP 2: Environment (Diffusion, Weather, Seasons)
        env_summary = self.env_module.step(
            ticks=ticks,
            day_of_year=self.day,
            buildings=list(self.buildings.values()),
            traffic_congestion_ratio=traffic_summary["congestion_index"] / 100.0,
            policy_multipliers=policy_mults
        )

        # STEP 3 & 4: Incidents & Outbreaks
        active_events = self.events_module.step(
            tick=self.tick,
            year=self.year,
            day=self.day,
            ticks_passed=ticks,
            food_stock=res_summary["food_stock"],
            water_stock=res_summary["water_stock"],
            power_deficit=util_state.power_deficit_mw,
            air_pollution=env_summary["mean_air_pollution"],
            protest_intensity=self.gov_module.protest_intensity,
            congestion_index=traffic_summary["congestion_index"],
            rng=self.rng
        )

        # STEP 5 & 6: Hospital Response, Mortality & Births (Gompertz Hazard)
        active_buildings = [b for b in self.buildings.values() if b.status != "abandoned"]
        res_capacity = sum(b.capacity_residents for b in active_buildings)
        jobs_capacity = sum(b.capacity_jobs for b in active_buildings)
        hosp_capacity = sum(b.capacity_jobs * 3 for b in active_buildings if b.type == "Healthcare") or 200

        pop_summary = self.population_module.step(
            ticks=ticks,
            food_available_ratio=res_summary["food_available_ratio"],
            water_available_ratio=res_summary["water_available_ratio"],
            energy_available_ratio=res_summary["energy_available_ratio"],
            pollution_level=env_summary["composite_pollution_index"],
            hospital_capacity=hosp_capacity,
            residential_capacity=res_capacity,
            jobs_capacity=jobs_capacity,
            policy_multipliers=policy_mults,
            rng=self.rng
        )

        # STEP 7: Economy (Bottom-Up GDP, Wages, Taxes, Gini)
        econ_summary = self.economy_module.step(
            ticks=ticks,
            citizens=list(self.population_module.citizens.values()),
            buildings=list(self.buildings.values()),
            resources_state=res_summary,
            policy_multipliers=policy_mults
        )

        # STEP 8 & 9: Satisfaction, Unrest & Governance Feedback
        food_deficit = 1.0 - res_summary["food_available_ratio"]
        water_deficit = 1.0 - res_summary["water_available_ratio"]
        energy_deficit = 1.0 - res_summary["energy_available_ratio"]
        # Basic survival needs (food, water) are non-compensatory
        current_unmet_needs = max(food_deficit, water_deficit) * 0.70 + ((food_deficit + water_deficit + energy_deficit) / 3.0) * 0.30
        current_death_rate = float(pop_summary["deaths_this_step"]) / max(1, pop_summary["population"])

        _, gov_summary = self.gov_module.step(
            ticks=ticks,
            average_happiness=pop_summary["average_happiness"],
            gini_coefficient=econ_summary["gini_coefficient"],
            unmet_needs_ratio=current_unmet_needs,
            recent_deaths_rate=current_death_rate
        )

        self._last_happiness = pop_summary["average_happiness"]
        self._last_gini = econ_summary["gini_coefficient"]
        self._last_unmet_needs = current_unmet_needs
        self._last_death_rate = current_death_rate

        # STEP 8B: Progression Milestones
        prog_summary = self.prog_module.step(
            tick=self.tick,
            population=pop_summary["population"],
            residential_capacity=res_capacity,
            unemployment_rate=pop_summary["unemployment_rate"],
            air_pollution=env_summary["mean_air_pollution"],
            grid_reliability=util_state.grid_reliability_pct,
            gini_coefficient=econ_summary["gini_coefficient"]
        )

        # Build Derived City Metrics
        derived_metrics = DerivedCityMetrics(
            population=pop_summary["population"],
            households_count=int(pop_summary["population"] / 2.6),
            residential_capacity=res_capacity,
            occupancy_rate=round(pop_summary["population"] / max(1, res_capacity), 3),
            total_jobs=jobs_capacity,
            employed_citizens=pop_summary["employed_citizens"],
            unemployment_rate=pop_summary["unemployment_rate"],
            tax_rate=econ_summary["tax_rate_percent"],
            daily_tax_revenue=econ_summary["tax_revenue_step"] * 24.0,
            gdp=econ_summary["gdp"],
            gdp_growth_rate=0.032,
            power_supply_mw=util_state.total_power_supply_mw,
            power_demand_mw=util_state.total_power_demand_mw,
            water_supply_t=util_state.total_water_supply_t,
            water_demand_t=util_state.total_water_demand_t,
            air_pollution_index=env_summary["mean_air_pollution"],
            average_happiness=pop_summary["average_happiness"],
            civic_stability=gov_summary["public_trust"],
            protest_intensity=gov_summary["protest_intensity"]
        )

        # Monotonic Version Increment
        old_version = self.version
        self.version += 1

        traffic_state = TrafficMetricsState(
            active_vehicles_count=traffic_summary["active_vehicles_count"],
            average_speed_kmh=traffic_summary["average_speed_kmh"],
            traffic_flow_efficiency=traffic_summary["traffic_flow_efficiency"],
            congestion_index=traffic_summary["congestion_index"],
            average_commute_minutes=traffic_summary["average_commute_minutes"]
        )

        delta = WorldStateDelta(
            world_id=self.world_id,
            from_version=old_version,
            to_version=self.version,
            tick=self.tick,
            year=self.year,
            day=self.day,
            created_buildings=[],
            updated_buildings=updated_b_list[:40],
            active_vehicles=lod_vehicles[:30],
            metrics=derived_metrics,
            utilities=util_state,
            traffic=traffic_state
        )

        # Continuous Autosave (Every 24 ticks / 1 sim day)
        if self.tick % TICKS_PER_DAY == 0:
            self.save_to_slot(slot_name="autosave_latest", slot_type="autosave")

        return delta, derived_metrics

    # ==========================================================================
    # SAVE & LOAD SLOTS WITH PERSISTENCE
    # ==========================================================================

    def save_to_slot(self, slot_name: str = "manual_01", slot_type: str = "manual") -> str:
        """Saves complete world snapshot to in-memory slot and DB world_saves table."""
        snapshot = self.get_full_world_state()
        slot_id = f"save_{self.world_id}_{slot_name}_{self.tick}"
        save_dict = {
            "id": slot_id,
            "world_id": self.world_id,
            "name": slot_name,
            "slot_type": slot_type,
            "tick": self.tick,
            "year": self.year,
            "day": self.day,
            "state": snapshot,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        self.save_slots[slot_name] = save_dict

        try:
            conn = get_db_connection()
            with conn:
                conn.execute("""
                INSERT OR REPLACE INTO world_saves (id, world_id, name, slot_type, tick, year, day, state_json, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    slot_id, self.world_id, slot_name, slot_type,
                    self.tick, self.year, self.day,
                    json.dumps(snapshot), save_dict["created_at"]
                ))
            conn.close()
        except Exception:
            pass

        return slot_id

    def load_from_slot(self, slot_name: str) -> bool:
        """Restores world state from a saved slot."""
        saved = self.save_slots.get(slot_name)
        if not saved:
            # Check DB
            try:
                conn = get_db_connection()
                row = conn.execute("SELECT * FROM world_saves WHERE world_id = ? AND name = ? ORDER BY tick DESC LIMIT 1",
                                   (self.world_id, slot_name)).fetchone()
                conn.close()
                if row:
                    saved = {
                        "tick": row["tick"],
                        "year": row["year"],
                        "day": row["day"],
                        "state": json.loads(row["state_json"])
                    }
            except Exception:
                pass

        if not saved:
            return False

        state = saved["state"]
        self.tick = state["tick"]
        self.year = state["year"]
        self.day = state["day"]
        self.resources_module.food_stock = state["resources"]["food_stock"]
        self.resources_module.water_stock = state["resources"]["water_stock"]
        self.resources_module.energy_stock = state["resources"]["energy_stock"]
        self.resources_module.materials_stock = state["resources"]["materials_stock"]
        self.economy_module.tax_rate = state["economy"]["tax_rate_percent"] / 100.0
        self.economy_module.treasury_credits = state["economy"]["treasury_credits"]
        return True

    # ==========================================================================
    # COMPLETE SINGLE JSON WORLD STATE
    # ==========================================================================

    def get_full_world_state(self) -> Dict[str, Any]:
        """
        Returns the unified canonical single JSON world state compliant with
        docs/schema/world_state.schema.json.
        """
        active_blds = [b for b in self.buildings.values() if b.status != "abandoned"]
        living_cits = [c for c in self.population_module.citizens.values() if c.is_alive == 1]
        res_cap = sum(b.capacity_residents for b in active_blds)
        jobs_cap = sum(b.capacity_jobs for b in active_blds)

        util_state, _ = self.infra_module.utility_engine.solve_networks(list(self.buildings.values()), self.infra_module.road_network)
        road_summary = self.infra_module.road_network.get_summary_metrics()

        return {
            "world_id": self.world_id,
            "tick": self.tick,
            "year": self.year,
            "day": self.day,
            "version": self.version,
            "simulation_status": self.status,
            "simulation_speed": self.speed,
            "population": {
                "total": len(living_cits),
                "living_citizens_count": len(living_cits),
                "cumulative_births": self.population_module.cumulative_births,
                "cumulative_deaths": self.population_module.cumulative_deaths,
                "deaths_by_cause": dict(self.population_module.deaths_by_cause),
                "average_health": round(sum(c.health for c in living_cits) / max(1, len(living_cits)), 3),
                "average_happiness": round(sum(c.mood for c in living_cits) / max(1, len(living_cits)), 3),
                "sample_citizens": [c.to_dict() for c in living_cits[:25]]
            },
            "resources": {
                "food_stock": round(self.resources_module.food_stock, 1),
                "water_stock": round(self.resources_module.water_stock, 1),
                "energy_stock": round(self.resources_module.energy_stock, 1),
                "materials_stock": round(self.resources_module.materials_stock, 1),
                "food_capacity": self.resources_module.food_capacity,
                "water_capacity": self.resources_module.water_capacity,
                "energy_capacity": self.resources_module.energy_capacity,
                "materials_capacity": self.resources_module.materials_capacity
            },
            "economy": {
                "gdp": round(self.economy_module.step(0, living_cits, list(self.buildings.values()), {})["gdp"], 2),
                "treasury_credits": round(self.economy_module.treasury_credits, 2),
                "tax_rate_percent": round(self.economy_module.tax_rate * 100.0, 1),
                "gini_coefficient": self.economy_module.compute_gini([c.wealth for c in living_cits]),
                "jobs_capacity": jobs_cap,
                "employed_citizens": sum(1 for c in living_cits if c.employed == 1)
            },
            "infrastructure": {
                "buildings_count": len(self.buildings),
                "residential_capacity": res_cap,
                "jobs_capacity": jobs_cap,
                "road_nodes_count": len(self.infra_module.road_network.nodes),
                "road_segments_count": len(self.infra_module.road_network.segments),
                "power_supply_mw": util_state.total_power_supply_mw,
                "power_demand_mw": util_state.total_power_demand_mw,
                "grid_reliability_pct": util_state.grid_reliability_pct,
                "water_supply_t": util_state.total_water_supply_t,
                "water_demand_t": util_state.total_water_demand_t,
                "water_reliability_pct": util_state.water_reliability_pct
            },
            "environment": {
                "current_season": self.env_module.current_season,
                "temperature_c": self.env_module.temperature_c,
                "weather_condition": self.env_module.weather_condition,
                "environmental_health_index": self.env_module.environmental_health
            },
            "governance": {
                "public_trust": round(self.gov_module.public_trust, 3),
                "grievance_index": self.gov_module.grievance_index,
                "protest_intensity": round(self.gov_module.protest_intensity, 3),
                "active_policies": [pid for pid, s in self.gov_module.policy_states.items() if s["status"] == "active"]
            },
            "events": {
                "active_events": [e.to_dict() for e in self.events_module.active_events.values()]
            },
            "progression": {
                "level": self.prog_module.level,
                "title": self.prog_module.title,
                "xp": self.prog_module.xp,
                "grc_balance": self.prog_module.grc_balance
            }
        }


# Global singleton registry for active simulation instances
_SIMULATION_CORES: Dict[str, AuthoritativeSimulationCore] = {}

def get_authoritative_simulation(world_id: str = "aurora-prime") -> AuthoritativeSimulationCore:
    """Returns or initializes the AuthoritativeSimulationCore singleton for a given world."""
    if world_id not in _SIMULATION_CORES:
        _SIMULATION_CORES[world_id] = AuthoritativeSimulationCore(world_id)
    return _SIMULATION_CORES[world_id]
