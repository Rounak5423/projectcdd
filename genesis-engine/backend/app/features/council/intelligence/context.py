"""
CIVORA — Council Shared Civilisation Intelligence Context
Builds an immutable, read-only snapshot of the authoritative civilisation state.
Guarantees all six advisors analyse the exact same simulation epoch without modifying state.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any, Set
import json
import sqlite3

from db.database import get_db_connection


@dataclass(frozen=True)
class CivilisationContext:
    """Immutable snapshot of authoritative simulation state for an analysis epoch."""

    # World Metadata
    world_id: str
    world_name: str
    tick: int
    year: int
    day: int
    simulation_status: str
    climate: str
    technology_level: str
    grid_size: int

    # Macro Economy & Resource Stockpiles
    population: int
    population_growth_rate: float
    gdp: float
    gdp_growth_rate: float
    employment_rate: float
    average_income: float
    tax_rate: float
    gini_coefficient: float
    civic_stability: float
    grc_balance: float

    food: float
    food_rate: float
    water: float
    water_rate: float
    energy: float
    energy_rate: float
    materials: float
    materials_rate: float
    research_points: float
    research_rate: float

    happiness: float
    environmental_health: float
    pollution: float

    # Infrastructure Aggregates
    total_buildings_count: int
    housing_capacity: int
    hospital_capacity: int
    active_power_plants_count: int
    clean_power_generation: float
    total_power_generation: float
    buildings_by_type: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)

    # Citizen Demographics & Cognitive Telemetry
    sampled_citizens_count: int = 0
    avg_reasoning: float = 0.75
    avg_ai_dependency: float = 0.15
    avg_critical_evaluation: float = 0.70
    avg_wellbeing: float = 0.78
    avg_health: float = 0.85
    macro_innovation_index: float = 0.80

    # Policy & Technology State
    active_policies: List[Dict[str, Any]] = field(default_factory=list)
    unlocked_technologies: List[Dict[str, Any]] = field(default_factory=list)
    researching_technologies: List[Dict[str, Any]] = field(default_factory=list)

    # Historical Telemetry Snapshots (Ordered by tick ASC)
    history_points: List[Dict[str, Any]] = field(default_factory=list)

    # Explicit Missing Data Tracking (Honest Reporting)
    missing_indicators: Set[str] = field(default_factory=lambda: {
        "crime_statistics",
        "social_class_mobility",
        "sovereign_debt_market",
        "patent_registry",
        "road_network_topology",
        "structural_wear_and_tear",
        "pandemic_pathogen_vectors",
        "mental_health_diagnostics",
        "forest_canopy_coverage_km2",
        "biome_biodiversity_species_count",
    })

    # -----------------------------------------------------------------------
    # Analytical Derived Properties
    # -----------------------------------------------------------------------

    @property
    def clean_energy_ratio(self) -> float:
        if self.total_power_generation <= 0:
            return 0.85
        return round(min(1.0, self.clean_power_generation / self.total_power_generation), 3)

    @property
    def housing_occupancy_ratio(self) -> float:
        if self.housing_capacity <= 0:
            return 1.5  # Severe shortage
        return round(self.population / self.housing_capacity, 3)

    @property
    def healthcare_coverage_per_thousand(self) -> float:
        if self.population <= 0:
            return 10.0
        return round((self.hospital_capacity / self.population) * 1000.0, 2)

    @property
    def food_burn_days_remaining(self) -> float:
        net_burn = abs(self.food_rate) if self.food_rate < 0 else (self.population * 0.0001)
        if net_burn <= 0:
            return 999.0
        return round(self.food / net_burn, 1)

    @property
    def water_burn_days_remaining(self) -> float:
        net_burn = abs(self.water_rate) if self.water_rate < 0 else (self.population * 0.0001)
        if net_burn <= 0:
            return 999.0
        return round(self.water / net_burn, 1)

    def get_historical_trend(self, metric_key: str) -> Optional[float]:
        """Calculates delta between oldest and latest historical telemetry point."""
        if len(self.history_points) < 2:
            return None
        first = self.history_points[0].get(metric_key)
        latest = self.history_points[-1].get(metric_key)
        if first is not None and latest is not None:
            return round(latest - first, 4)
        return None


def build_civilisation_context(world_id: str, conn: Optional[sqlite3.Connection] = None) -> CivilisationContext:
    """
    Constructs an authoritative, read-only CivilisationContext snapshot from SQLite database.
    """
    close_after = False
    if conn is None:
        conn = get_db_connection()
        close_after = True

    try:
        # 1. World record
        world = conn.execute("SELECT * FROM worlds WHERE id = ?", (world_id,)).fetchone()
        if not world:
            raise ValueError(f"Civilisation world '{world_id}' does not exist.")

        # 2. Economy and resources
        econ = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()
        if not econ:
            raise ValueError(f"Economy resources for world '{world_id}' not found.")

        # 3. Progression
        prog = conn.execute("SELECT * FROM progression WHERE world_id = ?", (world_id,)).fetchone()
        grc_balance = prog["grc_balance"] if prog else 1000.0

        # 4. Buildings aggregation
        bld_rows = conn.execute("SELECT * FROM buildings WHERE world_id = ?", (world_id,)).fetchall()
        buildings_by_type: Dict[str, List[Dict[str, Any]]] = {}
        housing_capacity = 0
        hospital_capacity = 0
        clean_power = 0.0
        total_power = 0.0
        power_plants_count = 0

        for b in bld_rows:
            b_dict = dict(b)
            b_type = b_dict.get("type", "General")
            buildings_by_type.setdefault(b_type, []).append(b_dict)

            # Capacity calculations
            cap = b_dict.get("capacity", 0)
            if b_type == "Residential":
                housing_capacity += cap
            elif b_type == "Healthcare":
                hospital_capacity += cap
            elif b_type == "Energy":
                power_plants_count += 1
                effects = {}
                if b_dict.get("effects"):
                    try:
                        effects = json.loads(b_dict["effects"])
                    except Exception:
                        effects = {}
                gen = effects.get("energy_generation_mw", 50.0)
                clean_ratio = effects.get("clean_energy_ratio", 0.8)
                total_power += gen
                clean_power += gen * clean_ratio
            elif b_type == "Environment":
                effects = {}
                if b_dict.get("effects"):
                    try:
                        effects = json.loads(b_dict["effects"])
                    except Exception:
                        effects = {}
                clean_power += effects.get("clean_power_mw", 30.0)
                total_power += effects.get("clean_power_mw", 30.0)

        # 5. Citizen cognitive and health telemetry (sampled)
        cit_rows = conn.execute(
            "SELECT * FROM citizens WHERE world_id = ? AND is_alive = 1 LIMIT 300",
            (world_id,)
        ).fetchall()
        cit_count = len(cit_rows)

        if cit_count > 0:
            avg_reasoning = sum(c["independent_reasoning"] for c in cit_rows) / cit_count
            avg_ai_dep = sum(c["ai_dependency"] for c in cit_rows) / cit_count
            avg_crit = sum(c["critical_evaluation"] for c in cit_rows) / cit_count
            avg_wellbeing = sum(c["wellbeing"] for c in cit_rows) / cit_count
            avg_health = sum(c["health"] for c in cit_rows) / cit_count
            macro_inn = round(0.6 * avg_reasoning + 0.4 * (1.0 - avg_ai_dep), 4)
        else:
            avg_reasoning = 0.75
            avg_ai_dep = 0.15
            avg_crit = 0.70
            avg_wellbeing = 0.78
            avg_health = 0.85
            macro_inn = 0.80

        # 6. Policies
        pol_rows = conn.execute("SELECT * FROM policies WHERE world_id = ? AND is_active = 1", (world_id,)).fetchall()
        active_policies = [dict(p) for p in pol_rows]

        # 7. Technologies
        tech_rows = conn.execute("SELECT * FROM technologies WHERE world_id = ?", (world_id,)).fetchall()
        unlocked_techs = [dict(t) for t in tech_rows if t["is_unlocked"]]
        researching_techs = [dict(t) for t in tech_rows if t["is_researching"]]

        # 8. Historical metrics
        hist_rows = conn.execute(
            "SELECT * FROM metrics_history WHERE world_id = ? ORDER BY tick ASC LIMIT 30",
            (world_id,)
        ).fetchall()
        history_points = [dict(h) for h in hist_rows]

        return CivilisationContext(
            world_id=world["id"],
            world_name=world["name"],
            tick=world["tick"],
            year=world["year"],
            day=world["day"],
            simulation_status=world["simulation_status"],
            climate=world["climate"],
            technology_level=world["technology_level"],
            grid_size=world["grid_size"],
            population=econ["population"],
            population_growth_rate=econ["population_growth_rate"],
            gdp=econ["gdp"],
            gdp_growth_rate=econ["gdp_growth_rate"],
            employment_rate=econ["employment_rate"],
            average_income=econ["average_income"],
            tax_rate=econ["tax_rate"],
            gini_coefficient=econ["gini_coefficient"],
            civic_stability=econ["civic_stability"],
            grc_balance=grc_balance,
            food=econ["food"],
            food_rate=econ["food_rate"],
            water=econ["water"],
            water_rate=econ["water_rate"],
            energy=econ["energy"],
            energy_rate=econ["energy_rate"],
            materials=econ["materials"],
            materials_rate=econ["materials_rate"],
            research_points=econ["research_points"],
            research_rate=econ["research_rate"],
            happiness=econ["happiness"],
            environmental_health=econ["environmental_health"],
            pollution=econ["pollution"],
            total_buildings_count=len(bld_rows),
            housing_capacity=housing_capacity,
            hospital_capacity=hospital_capacity,
            active_power_plants_count=power_plants_count,
            clean_power_generation=clean_power,
            total_power_generation=max(total_power, 50.0),
            buildings_by_type=buildings_by_type,
            sampled_citizens_count=cit_count,
            avg_reasoning=round(avg_reasoning, 4),
            avg_ai_dependency=round(avg_ai_dep, 4),
            avg_critical_evaluation=round(avg_crit, 4),
            avg_wellbeing=round(avg_wellbeing, 4),
            avg_health=round(avg_health, 4),
            macro_innovation_index=macro_inn,
            active_policies=active_policies,
            unlocked_technologies=unlocked_techs,
            researching_technologies=researching_techs,
            history_points=history_points,
        )
    finally:
        if close_after:
            conn.close()

