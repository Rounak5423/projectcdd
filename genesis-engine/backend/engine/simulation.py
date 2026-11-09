"""
================================================================================
GENESIS Engine: Authoritative Consolidated Simulation Engine
================================================================================
Unifies SQLite-backed multi-engine simulation and in-memory Pydantic state stepping.
Implements:
- 1 tick = 1 simulated day (configurable)
- Separate annual aggregation pass (demographics, census, milestones)
- Resource shortage penalties on happiness and civic stability
- Autosave integration
- Batched WAL-mode SQLite transactions
- Full backward-compatible API contracts
"""

import os
import math
import json
import uuid
import time
import random
import sqlite3
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
import logging
logger = logging.getLogger(__name__)

from db.database import get_db_connection
from .models import (
    WorldState, Citizen, Demographics, NeedsVector, CognitiveProfile,
    Resources, HistorySnapshot, OccupationType, Building, EnvironmentStats,
    ClimateType, TechLevel
)
from .cognitive import update_citizen_cognition
from .economy import process_economy_tick, calculate_gini_coefficient, calculate_civic_stability
from .policies import get_default_policies, extract_policy_modifiers
from monitoring.collector import perf_collector

OCCUPATIONS: List[OccupationType] = ["Farmer", "Engineer", "Scholar", "Builder", "Merchant"]


def format_currency(val: float) -> str:
    """Formats numeric currency into human-readable compact strings."""
    if val >= 1_000_000_000:
        return f"${val / 1_000_000_000:.1f}B"
    elif val >= 1_000_000:
        return f"${val / 1_000_000:.1f}M"
    elif val >= 1_000:
        return f"${val / 1_000:.1f}K"
    return f"${val:.2f}"


# ==============================================================================
# 1. SEEDING & WORLD BOOTSTRAP
# ==============================================================================

def seed_aurora_prime_if_not_exists():
    """Seeds default persistent world 'Aurora Prime' if not present in SQLite."""
    conn = get_db_connection()
    row = conn.execute("SELECT id FROM worlds WHERE id = 'aurora-prime'").fetchone()
    if row:
        conn.close()
        return

    now = datetime.now(timezone.utc).isoformat()

    with conn:
        # 1. World record
        conn.execute("""
        INSERT INTO worlds (
            id, name, parent_world_id, owner_id, tick, year, day,
            simulation_status, simulation_speed, climate, technology_level,
            grid_size, created_at, updated_at
        ) VALUES (
            'aurora-prime', 'Aurora Prime', NULL, 'usr_player1_001', 124, 12, 146,
            'running', '1x', 'Temperate', 'Automated', 32, ?, ?
        )
        """, (now, now))

        # 2. Economy and Resources
        conn.execute("""
        INSERT INTO economy_resources (
            world_id, population, population_growth_rate, gdp, gdp_growth_rate,
            employment_rate, average_income, gini_coefficient, civic_stability,
            tax_rate, food, food_rate, water, water_rate, energy, energy_rate,
            materials, materials_rate, research_points, research_rate,
            genesis_research_credits, happiness, environmental_health, pollution
        ) VALUES (
            'aurora-prime', 1248532, 0.024, 48600000000.0, 0.051,
            0.91, 52400.0, 0.285, 0.772, 0.16,
            12500.0, 120.0, 18400.0, 180.0, 9800.0, 95.0,
            6100.0, 60.0, 4250.0, 45.0, 2500.0, 0.78, 0.72, 0.18
        )
        """)

        # 3. Progression
        conn.execute("""
        INSERT INTO progression (
            world_id, xp, level, title, thriving_score, grc_balance
        ) VALUES (
            'aurora-prime', 48500, 4, 'Level 4 Civilisation', 0.88, 2500.0
        )
        """)

        # 4. Seeded Buildings
        buildings_data = [
            ("bld_gov_1", "aurora-prime", "Government Citadel", "Government", 4, 16.0, 16.0, 0.0, 4.0, 4.0, 8.5, 0.0, "active", 500,
             '{"materials": 2500, "energy": 1200, "credits": 400}', '{"materials": 3500, "energy": 1800, "credits": 600}',
             '{"civic_stability_bonus": 0.15, "administrative_efficiency": 0.95}'),

            ("bld_res_hub_1", "aurora-prime", "Research Hub", "Research", 3, 23.5, 18.0, 0.0, 3.5, 3.5, 6.0, 45.0, "active", 250,
             '{"materials": 1800, "energy": 900, "credits": 300}', '{"materials": 2800, "energy": 1400, "credits": 500}',
             '{"research_generation": 45.0, "experiment_discount": 0.10}'),

            ("bld_res_zone_1", "aurora-prime", "Residential Zone North", "Residential", 4, 11.0, 14.0, 0.0, 3.0, 3.0, 5.0, 0.0, "active", 650000,
             '{"materials": 2000, "energy": 800, "credits": 200}', '{"materials": 3000, "energy": 1200, "credits": 350}',
             '{"housing_capacity": 650000, "happiness_bonus": 0.04}'),

            ("bld_res_zone_2", "aurora-prime", "Residential Zone South", "Residential", 3, 14.0, 24.0, 0.0, 3.0, 3.0, 4.0, 90.0, "active", 600000,
             '{"materials": 1800, "energy": 750, "credits": 180}', '{"materials": 2600, "energy": 1100, "credits": 300}',
             '{"housing_capacity": 600000, "happiness_bonus": 0.03}'),

            ("bld_hospital_1", "aurora-prime", "Central Hospital & Healthcare", "Healthcare", 3, 21.0, 24.5, 0.0, 3.0, 2.5, 4.2, 0.0, "active", 1500,
             '{"materials": 1400, "energy": 600, "credits": 150}', '{"materials": 2200, "energy": 900, "credits": 250}',
             '{"health_bonus": 0.08, "mortality_reduction": 0.12}'),

            ("bld_power_1", "aurora-prime", "Geothermal Power Plant", "Energy", 3, 8.0, 10.5, 0.0, 3.5, 3.5, 5.5, 30.0, "active", 200,
             '{"materials": 2200, "energy": 400, "credits": 250}', '{"materials": 3200, "energy": 600, "credits": 400}',
             '{"energy_generation_mw": 95.0, "clean_energy_ratio": 0.88}'),

            ("bld_farm_1", "aurora-prime", "Hydroponic Vertical Farm", "Agriculture", 3, 9.5, 22.0, 0.0, 4.0, 4.0, 3.0, 0.0, "active", 100,
             '{"materials": 1500, "energy": 500, "credits": 120}', '{"materials": 2400, "energy": 800, "credits": 220}',
             '{"food_generation_t": 120.0, "water_efficiency": 0.85}'),

            ("bld_wind_1", "aurora-prime", "Wind Turbine Array", "Environment", 3, 25.0, 7.0, 0.0, 2.0, 6.0, 9.0, 15.0, "active", 50,
             '{"materials": 1200, "energy": 300, "credits": 100}', '{"materials": 1900, "energy": 500, "credits": 180}',
             '{"environmental_health_boost": 0.06, "clean_power_mw": 35.0}'),

            ("bld_industry_1", "aurora-prime", "Advanced Materials Foundry", "Industry", 3, 27.0, 12.0, 0.0, 4.0, 3.5, 4.5, 0.0, "active", 1200,
             '{"materials": 2400, "energy": 1100, "credits": 300}', '{"materials": 3600, "energy": 1600, "credits": 500}',
             '{"materials_generation_t": 60.0, "employment_capacity": 1200}'),

            ("bld_comm_1", "aurora-prime", "Central Commercial Hub", "Commercial", 3, 18.0, 21.0, 0.0, 3.0, 3.0, 4.0, 0.0, "active", 800,
             '{"materials": 1600, "energy": 700, "credits": 200}', '{"materials": 2400, "energy": 1000, "credits": 350}',
             '{"gdp_boost": 0.03, "commercial_tax_efficiency": 0.92}')
        ]
        for b in buildings_data:
            conn.execute("""
            INSERT INTO buildings (
                id, world_id, name, type, level, x, y, z, width, length, height,
                orientation, status, capacity, construction_cost, upgrade_cost, effects
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, b)

        # 5. Seeded Citizens (sample cohort)
        sample_occupations = ["Engineer", "Scholar", "Farmer", "Builder", "Merchant", "Physician", "Councilor"]
        for i in range(1, 41):
            cit_id = f"cit_ap_{i:03d}"
            occ = sample_occupations[i % len(sample_occupations)]
            age = 22.0 + (i * 1.3) % 45.0
            wealth = 45000.0 + (i * 2100.0)
            conn.execute("""
            INSERT INTO citizens (
                id, world_id, age, occupation, wealth, x, y,
                hunger, energy, wellbeing, education_level, health,
                independent_reasoning, problem_solving, critical_evaluation,
                creativity, knowledge_retention, ai_dependency, is_alive
            ) VALUES (
                ?, 'aurora-prime', ?, ?, ?, ?, ?,
                0.15, 0.85, 0.80, 0.75, 0.88,
                0.78, 0.72, 0.75, 0.68, 0.80, 0.18, 1
            )
            """, (cit_id, age, occ, wealth, 8.0 + (i % 16) * 1.4, 8.0 + (i // 16) * 4.0))

        # 6. Missions
        missions_data = [
            ("mis_food_sec", "aurora-prime", "Food Security Threshold", "Surpass 20,000 tons of reserve food stores.", "food", 20000.0, 12500.0, 0, 500, 150.0),
            ("mis_clean_grid", "aurora-prime", "Zero-Carbon Grid", "Achieve 90%+ clean energy generation capacity.", "clean_energy", 0.90, 0.88, 0, 800, 250.0),
            ("mis_pop_milestone", "aurora-prime", "Mega Metropolis Expansion", "Expand civilisation population to 1,500,000 citizens.", "population", 1500000.0, 1248532.0, 0, 1200, 400.0),
            ("mis_ai_equilibrium", "aurora-prime", "Cognitive Scaffolding Balance", "Maintain independent reasoning > 0.75 with AI usage > 0.80.", "reasoning", 0.75, 0.78, 1, 1500, 500.0)
        ]
        for m in missions_data:
            conn.execute("""
            INSERT INTO missions (id, world_id, title, description, target_metric, target_value, current_value, is_completed, reward_xp, reward_grc)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, m)

        # 6.5 Seeded Historical Events
        events_data = [
            ("evt_1", "aurora-prime", 12, 142, "New residential zone completed", "milestone",
             "North sector modular high-rise construction completed, accommodating additional population.", now),
            ("evt_2", "aurora-prime", 12, 138, "AI Education Policy activated", "policy",
             "Cognitive scaffolding guidelines integrated into primary and secondary curricula.", now),
            ("evt_3", "aurora-prime", 12, 135, "Food production increased by 12%", "economy",
             "Hydroponic vertical farming yields improved following thermal regulation upgrade.", now),
            ("evt_4", "aurora-prime", 12, 112, "Research Hub Level 3 upgrade completed", "milestone",
             "Quantum and simulation laboratories fully operational.", now),
            ("evt_5", "aurora-prime", 12, 95, "Clean Energy Grid achieved 9.8 MW", "milestone",
             "Geothermal and wind array output met peak summer demand without fossil fallback.", now)
        ]
        for e in events_data:
            conn.execute("""
            INSERT INTO events (id, world_id, year, day, title, category, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, e)

        # 7. Seeded Technologies
        techs_data = [
            ("tech_fusion_core", "aurora-prime", "Compact Fusion Core", "Energy", 3, 5000.0, 5000.0, 1, 0,
             '{"energy_boost": 0.35, "clean_energy": 0.95}'),
            ("tech_hyper_loop", "aurora-prime", "Sub-Surface Hyperloop", "Infrastructure", 2, 3500.0, 3500.0, 1, 0,
             '{"logistics_efficiency": 0.25, "commute_reduction": 0.40}'),
            ("tech_bio_dome", "aurora-prime", "Atmospheric Bio-Domes", "Agriculture", 2, 2500.0, 2500.0, 1, 0,
             '{"food_output_boost": 0.25, "water_saving": 0.15}'),
            ("tech_quantum_mesh", "aurora-prime", "Quantum Telemetry Mesh", "Research", 3, 4000.0, 2600.0, 0, 1,
             '{"simulation_speedup": 0.20, "grc_generation": 25.0}'),
            ("tech_neuro_scaffold", "aurora-prime", "Neuro-Cognitive Scaffolding", "Cognitive", 4, 6000.0, 0.0, 0, 0,
             '{"atrophy_prevention": 0.90, "macro_innovation_boost": 0.15}')
        ]
        for t in techs_data:
            conn.execute("""
            INSERT INTO technologies (id, world_id, name, category, level, research_cost, research_progress, is_unlocked, is_researching, effects)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, t)

        # 8. Policies
        policies_data = [
            ("universal_ai", "aurora-prime", "Universal AI Assistance", "Cognitive", 1, 150.0,
             '{"ai_access_coverage": 0.90}', '{"efficiency_boost": 0.12, "atrophy_risk": 0.015}'),
            ("cognitive_scaffolding", "aurora-prime", "Cognitive Scaffolding Mandate", "Cognitive", 1, 200.0,
             '{"scaffolding_friction": 0.75}', '{"atrophy_mitigation": 0.80, "reasoning_growth": 0.004}'),
            ("universal_basic_income", "aurora-prime", "Universal Basic Dividend (UBI)", "Social", 1, 500.0,
             '{"ubi_amount": 4.0}', '{"gini_reduction": 0.05, "civic_stability_boost": 0.08}'),
            ("clean_energy_subsidies", "aurora-prime", "Ecological Transition Subsidies", "Environment", 1, 350.0,
             '{"subsidy_rate": 0.25}', '{"environmental_health_boost": 0.07, "pollution_reduction": 0.12}')
        ]
        for p in policies_data:
            conn.execute("""
            INSERT INTO policies (id, world_id, name, category, is_active, implementation_cost, parameters, effects)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, p)

        # 9. Achievements
        achievements_data = [
            ("ach_first_colony", "aurora-prime", "First Steps", "Establish an initial artificial civilization settlement.", "flag", 1, now),
            ("ach_pop_1m", "aurora-prime", "Mega Metropolis", "Surpass 1,000,000 citizens in your civilisation.", "users", 1, now),
            ("ach_clean_power", "aurora-prime", "Renewable Era", "Achieve 80%+ clean power generation ratio.", "zap", 1, now),
            ("ach_ai_harmony", "aurora-prime", "Cognitive Balance", "Maintain Macro Innovation > 0.80 under 80%+ AI coverage.", "award", 0, None)
        ]
        for a in achievements_data:
            conn.execute("""
            INSERT INTO achievements (id, world_id, title, description, icon, is_unlocked, unlocked_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, a)

        # 10. Initial Metrics History point
        conn.execute("""
        INSERT INTO metrics_history (
            world_id, tick, year, day, population, gdp, happiness, employment, environment,
            gini, civic_stability, macro_innovation, avg_ai_dependency, avg_reasoning,
            food, energy, materials
        ) VALUES (
            'aurora-prime', 124, 12, 146, 1248532, 48600000000.0, 0.78, 0.91, 0.72,
            0.285, 0.772, 0.84, 0.18, 0.79, 12500.0, 9800.0, 6100.0
        )
        """)

    conn.close()


# ==============================================================================
# 2. YEARLY AGGREGATION & AUTOSAVE ROUTINES
# ==============================================================================

def perform_yearly_aggregation(conn: sqlite3.Connection, world_id: str, new_year: int) -> Dict[str, Any]:
    """
    Executes a discrete annual aggregation pass:
    - Annual Census and milestone logging
    - Single truth state synchronization
    """
    now = datetime.now(timezone.utc).isoformat()
    from engine.demographics import sync_demographics_state
    sync_demographics_state(conn, world_id)

    # Log annual milestone event
    evt_id = f"evt_year_{new_year}_{uuid.uuid4().hex[:6]}"
    conn.execute("""
    INSERT INTO events (id, world_id, year, day, title, category, description, created_at)
    VALUES (?, ?, ?, 1, ?, 'milestone', ?, ?)
    """, (
        evt_id, world_id, new_year,
        f"Annual Civilisation Census — Year {new_year}",
        f"Census concluded for Year {new_year}. Macroeconomic yields and demographic distributions consolidated.",
        now
    ))
    return {"year": new_year, "status": "completed"}


def perform_autosave(conn: sqlite3.Connection, world_id: str, tick: int, year: int, day: int):
    """Saves periodic snapshot into world_saves table."""
    save_id = f"autosave_{world_id}"
    now = datetime.now(timezone.utc).isoformat()
    econ = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()
    state_payload = {
        "world_id": world_id,
        "tick": tick,
        "year": year,
        "day": day,
        "economy": dict(econ) if econ else {},
        "saved_at": now
    }
    conn.execute("""
    INSERT OR REPLACE INTO world_saves (id, world_id, name, slot_type, tick, year, day, state_json, created_at)
    VALUES (?, ?, ?, 'autosave', ?, ?, ?, ?, ?)
    """, (save_id, world_id, f"Autosave Year {year} Day {day}", tick, year, day, json.dumps(state_payload), now))


# ==============================================================================
# 3. AUTHORITATIVE SQLITE DATABASE SIMULATION STEP
# ==============================================================================

def advance_world_simulation(world_id: str, ticks: int = 1) -> Dict[str, Any]:
    """
    Authoritative simulation step for a persistent SQLite world.
    - 1 tick = 1 simulated day (configurable via DAYS_PER_TICK)
    - Full yearly aggregation when crossing year boundary
    - Behavioral resource shortage feedback (penalizes happiness and civic stability)
    - Batched single-transaction database execution
    - Periodic autosave
    """
    conn = get_db_connection()
    world = conn.execute("SELECT * FROM worlds WHERE id = ?", (world_id,)).fetchone()
    if not world and world_id in ["civ-aurora-01", "civ-default", "prime", "default"]:
        world_id = "aurora-prime"
        world = conn.execute("SELECT * FROM worlds WHERE id = ?", (world_id,)).fetchone()

    if not world:
        conn.close()
        raise ValueError(f"World '{world_id}' not found")

    econ = conn.execute("SELECT * FROM economy_resources WHERE world_id = ?", (world_id,)).fetchone()
    if not econ:
        conn.close()
        raise ValueError(f"Economy data for '{world_id}' not found")

    prog = conn.execute("SELECT * FROM progression WHERE world_id = ?", (world_id,)).fetchone()

    cur_tick = world["tick"]
    cur_year = world["year"]
    cur_day = world["day"]

    days_per_tick = int(os.environ.get("DAYS_PER_TICK", "1"))
    days_per_year = int(os.environ.get("DAYS_PER_YEAR", "365"))

    new_tick = cur_tick + ticks
    total_days = cur_day + (ticks * days_per_tick)
    add_years = (total_days - 1) // days_per_year
    new_day = ((total_days - 1) % days_per_year) + 1
    new_year = cur_year + add_years

    # Check if a new simulated year has commenced
    has_year_rolled_over = new_year > cur_year

    # GDP growth
    gdp_multiplier = (1.0 + (econ["gdp_growth_rate"] * (days_per_tick / float(days_per_year)))) ** ticks
    new_gdp = round(econ["gdp"] * gdp_multiplier, 2)

    # 0. Advance Unified World State (Road Graph Utilities BFS, Real Traffic, RCI Zone Growth, Abandonment/Level-Up)
    try:
        from engine.world.simulation import get_unified_simulation
        sim = get_unified_simulation(world_id)
        sim.load_world_from_db()
        sim.advance_tick(ticks=ticks, skip_causal_step=True)
    except Exception as e:
        logger.warning(f"UnifiedWorldSimulation step error: {e}")

    # Resource consumption & Demographics
    from engine.demographics import sync_demographics_state, spawn_citizens_for_world

    cit_rows = conn.execute(
        "SELECT id, age, health, home_building_id, work_building_id, employed FROM citizens WHERE world_id = ? AND is_alive = 1",
        (world_id,)
    ).fetchall()

    if not cit_rows and world_id != "aurora-prime":
        res_blds = [r["id"] for r in conn.execute(
            "SELECT id FROM buildings WHERE world_id = ? AND (type LIKE '%Residential%' OR type = 'Government')",
            (world_id,)
        ).fetchall()]
        if not res_blds:
            res_id = f"bld_res_auto_{uuid.uuid4().hex[:6]}"
            with conn:
                conn.execute("""
                INSERT INTO buildings (id, world_id, name, type, level, x, y, z, status, capacity, current_occupants)
                VALUES (?, ?, 'Auto Habitation Unit', 'Residential', 1, 16.0, 16.0, 0.0, 'active', ?, 0)
                """, (res_id, world_id, max(100, econ["population"])))
            res_blds = [res_id]
        with conn:
            spawn_citizens_for_world(conn, world_id, max(1, econ["population"]), res_blds)
        cit_rows = conn.execute(
            "SELECT id, age, health, home_building_id, work_building_id, employed FROM citizens WHERE world_id = ? AND is_alive = 1",
            (world_id,)
        ).fetchall()

    current_pop = len(cit_rows) if cit_rows else econ["population"]
    mean_age = sum(c["age"] for c in cit_rows) / max(1, len(cit_rows)) if cit_rows else 38.0
    mean_health = sum(c["health"] for c in cit_rows) / max(1, len(cit_rows)) if cit_rows else 0.85

    # Advance citizen ages
    dt_years = (ticks * days_per_tick) / float(days_per_year)
    with conn:
        conn.execute("UPDATE citizens SET age = age + ? WHERE world_id = ? AND is_alive = 1", (dt_years, world_id))

    # Job allocation: match unemployed working-age citizens to workplaces with open capacity
    work_blds = conn.execute("""
    SELECT id, type, level, capacity, current_workers
    FROM buildings
    WHERE world_id = ? AND status = 'active' AND capacity > 0
      AND type NOT LIKE '%Residential%'
    """, (world_id,)).fetchall()

    for wb in work_blds:
        open_jobs = max(0, wb["capacity"] - (wb["current_workers"] or 0))
        if open_jobs > 0:
            unemployed = conn.execute("""
            SELECT id FROM citizens
            WHERE world_id = ? AND is_alive = 1 AND 18.0 <= age AND age < 65.0
              AND (work_building_id IS NULL OR employed = 0)
            LIMIT ?
            """, (world_id, open_jobs)).fetchall()
            for u in unemployed:
                conn.execute("UPDATE citizens SET work_building_id = ?, employed = 1 WHERE id = ?", (wb["id"], u["id"]))
            conn.execute("""
            UPDATE buildings SET current_workers = (
                SELECT COUNT(*) FROM citizens WHERE work_building_id = ? AND is_alive = 1
            ) WHERE id = ?
            """, (wb["id"], wb["id"]))

    # Honest labor force & unemployment calculation (no hardcoded 0.01)
    labor_row = conn.execute("""
    SELECT
        COUNT(*) as labor_force,
        SUM(CASE WHEN employed = 1 AND work_building_id IS NOT NULL THEN 1 ELSE 0 END) as employed_count
    FROM citizens
    WHERE world_id = ? AND is_alive = 1 AND age >= 18.0 AND age < 65.0
    """, (world_id,)).fetchone()
    labor_force = labor_row["labor_force"] if labor_row else 0
    employed_count = labor_row["employed_count"] if labor_row and labor_row["employed_count"] else 0
    if labor_force > 0:
        unemployment_rate = round(float(labor_force - employed_count) / float(labor_force), 4)
        employment_rate = round(float(employed_count) / float(labor_force), 4)
    else:
        unemployment_rate = 0.0
        employment_rate = 1.0

    # Query unlocked technology multipliers from technologies table
    tech_rows = conn.execute(
        "SELECT id, effects FROM technologies WHERE world_id = ? AND is_unlocked = 1",
        (world_id,)
    ).fetchall()

    tech_mining_mult = 1.0
    tech_industry_mult = 1.0
    tech_science_mult = 1.0
    tech_tax_mult = 1.0
    tech_power_mult = 1.0

    for tr in tech_rows:
        try:
            eff = json.loads(tr["effects"]) if isinstance(tr["effects"], str) else (tr["effects"] or {})
            if "mining_yield" in eff:
                tech_mining_mult += float(eff["mining_yield"])
            if "heavy_industry_boost" in eff:
                tech_industry_mult += float(eff["heavy_industry_boost"])
            if "science_boost" in eff:
                tech_science_mult += float(eff["science_boost"])
            if "tax_revenue_boost" in eff:
                tech_tax_mult += float(eff["tax_revenue_boost"])
            if "power_efficiency" in eff or "efficiency_boost" in eff:
                tech_power_mult += float(eff.get("power_efficiency", 0.0) or eff.get("efficiency_boost", 0.0))
        except Exception:
            pass

    # Dynamic honest materials production: derived strictly from employed workers in industrial buildings
    ind_workers_row = conn.execute("""
    SELECT SUM(current_workers) as workers, SUM(capacity) as cap
    FROM buildings
    WHERE world_id = ? AND status = 'active'
      AND (type LIKE '%Industrial%' OR type LIKE '%Industry%' OR type LIKE '%Mining%' OR type LIKE '%Foundry%')
    """, (world_id,)).fetchone()
    ind_workers = ind_workers_row["workers"] if ind_workers_row and ind_workers_row["workers"] is not None else 0
    if world_id == "aurora-prime" and ind_workers == 0:
        # Aurora prime legacy fallback
        materials_rate = float(econ["materials_rate"] if econ["materials_rate"] is not None else 50.0) * tech_mining_mult * tech_industry_mult
    else:
        materials_rate = round(float(ind_workers) * 0.5 * tech_mining_mult * tech_industry_mult, 2)
    with conn:
        conn.execute("UPDATE economy_resources SET materials_rate = ? WHERE world_id = ?", (materials_rate, world_id))

    # Tax & Municipal Bond Debt Calculation
    res_tax = econ["residential_tax"] if "residential_tax" in econ.keys() and econ["residential_tax"] is not None else 0.14
    com_tax = econ["commercial_tax"] if "commercial_tax" in econ.keys() and econ["commercial_tax"] is not None else 0.12
    ind_tax = econ["industrial_tax"] if "industrial_tax" in econ.keys() and econ["industrial_tax"] is not None else 0.15

    daily_tax_rev = (current_pop * 20.0 * (res_tax / 0.14) + current_pop * 12.0 * (com_tax / 0.12) + ind_workers * 10.0 * (ind_tax / 0.15)) * (ticks / 30.0) * tech_tax_mult
    debt = float(econ["municipal_debt"] if "municipal_debt" in econ.keys() and econ["municipal_debt"] is not None else 0.0)
    interest_charge = round(debt * (0.02 / 30.0) * ticks, 2) if debt > 0 else 0.0

    time_factor = (ticks * days_per_tick) / 30.0
    food_prod = econ["food_rate"] * time_factor * 10.0
    water_prod = econ["water_rate"] * time_factor * 10.0
    energy_prod = econ["energy_rate"] * time_factor * 10.0 * tech_power_mult
    materials_prod = materials_rate * time_factor * 10.0
    research_prod = econ["research_rate"] * time_factor * 5.0 * tech_science_mult

    food_cons = (current_pop / 10000.0) * time_factor * 8.0
    water_cons = (current_pop / 10000.0) * time_factor * 10.0
    energy_cons = (current_pop / 10000.0) * time_factor * 6.5
    materials_cons = (materials_prod * 0.1) if materials_prod > 0 else 0.0

    new_food = max(0.0, econ["food"] + food_prod - food_cons)
    new_water = max(0.0, econ["water"] + water_prod - water_cons)
    new_energy = max(0.0, econ["energy"] + energy_prod - energy_cons)
    new_materials = max(0.0, econ["materials"] + materials_prod - materials_cons)
    new_research = econ["research_points"] + research_prod

    # Query healthcare and residential building capacities for causal coupling
    hosp_row = conn.execute("SELECT SUM(capacity) as cap FROM buildings WHERE world_id = ? AND type = 'Healthcare'", (world_id,)).fetchone()
    hosp_cap = hosp_row["cap"] if hosp_row and hosp_row["cap"] else 1500

    res_row = conn.execute("SELECT SUM(capacity) as cap FROM buildings WHERE world_id = ? AND type = 'Residential'", (world_id,)).fetchone()
    res_cap = res_row["cap"] if res_row and res_row["cap"] else 1500000

    # Causal coupling: fixed update order per tick
    from engine.causal import global_causal_engine

    causal_res = global_causal_engine.step(
        world_id=world_id,
        current_tick=cur_tick,
        year=new_year,
        day=new_day,
        population=current_pop,
        food_stock=new_food,
        food_production=food_prod,
        water_stock=new_water,
        water_production=water_prod,
        energy_stock=new_energy,
        energy_production=energy_prod,
        pollution_level=econ["pollution"] if "pollution" in econ.keys() and econ["pollution"] is not None else 0.15,
        civic_stability=econ["civic_stability"] if econ["civic_stability"] is not None else 0.77,
        happiness=econ["happiness"] if econ["happiness"] is not None else 0.78,
        hospital_capacity=hosp_cap,
        residential_capacity=res_cap,
        unemployment_rate=unemployment_rate,
        ticks_passed=ticks,
        mean_age=mean_age,
        mean_health=mean_health,
    )

    num_deaths = causal_res["vitals"]["deaths"]
    num_births = causal_res["vitals"]["births"]

    with conn:
        if num_deaths > 0:
            dead_cits = conn.execute("""
            SELECT id FROM citizens
            WHERE world_id = ? AND is_alive = 1
            ORDER BY (age * (1.6 - health)) DESC
            LIMIT ?
            """, (world_id, num_deaths)).fetchall()
            for dc in dead_cits:
                conn.execute("""
                UPDATE citizens SET
                    is_alive = 0,
                    home_building_id = NULL,
                    work_building_id = NULL,
                    employed = 0
                WHERE id = ?
                """, (dc["id"],))

        if num_births > 0:
            res_rows = conn.execute("""
            SELECT id FROM buildings
            WHERE world_id = ? AND (type LIKE '%Residential%' OR type = 'Government')
            ORDER BY current_occupants ASC
            """, (world_id,)).fetchall()
            default_home = res_rows[0]["id"] if res_rows else None
            for b_idx in range(num_births):
                b_cit_id = f"cit_{world_id}_{uuid.uuid4().hex[:8]}"
                h_id = res_rows[b_idx % len(res_rows)]["id"] if res_rows else default_home
                conn.execute("""
                INSERT INTO citizens (
                    id, world_id, age, occupation, wealth, x, y, hunger, energy, wellbeing,
                    education_level, health, independent_reasoning, problem_solving, critical_evaluation,
                    creativity, knowledge_retention, ai_dependency, is_alive, home_building_id, work_building_id, employed
                ) VALUES (?, ?, 0.0, 'Infant', 50.0, 16.0, 16.0, 0.1, 0.9, 0.95, 0.1, 0.95, 0.5, 0.5, 0.5, 0.5, 0.5, 0.0, 1, ?, NULL, 0)
                """, (b_cit_id, world_id, h_id))

        new_population = sync_demographics_state(conn, world_id)

    new_happiness = causal_res["happiness"]
    new_stability = causal_res["civic_stability"]

    # Single batched transaction for entire simulation step
    with conn:
        if has_year_rolled_over:
            perform_yearly_aggregation(conn, world_id, new_year)

        # Research tech progress
        active_tech = conn.execute("SELECT * FROM technologies WHERE world_id = ? AND is_researching = 1", (world_id,)).fetchall()
        for t in active_tech:
            add_prog = research_prod * 0.5 * ticks
            total_prog = t["research_progress"] + add_prog
            cost = float(t["cost_points"] if "cost_points" in t.keys() and t["cost_points"] else t["research_cost"])
            if total_prog >= cost:
                conn.execute("""
                UPDATE technologies SET research_progress = ?, is_unlocked = 1, is_researching = 0, turns_remaining = 0
                WHERE world_id = ? AND id = ?
                """, (cost, world_id, t["id"]))
                evt_id = f"evt_{uuid.uuid4().hex[:8]}"
                conn.execute("""
                INSERT INTO events (id, world_id, year, day, title, category, description, created_at)
                VALUES (?, ?, ?, ?, ?, 'breakthrough', ?, ?)
                """, (evt_id, world_id, new_year, new_day, f"Research Breakthrough: {t['name']}",
                      f"Civilisation successfully unlocked {t['name']}.", datetime.now(timezone.utc).isoformat()))
            else:
                rem_turns = max(1, math.ceil((cost - total_prog) / max(add_prog, 1.0)))
                conn.execute("""
                UPDATE technologies SET research_progress = ?, turns_remaining = ?
                WHERE world_id = ? AND id = ?
                """, (total_prog, rem_turns, world_id, t["id"]))

        # Missions evaluation
        missions = conn.execute("SELECT * FROM missions WHERE world_id = ?", (world_id,)).fetchall()
        earned_xp = 50 * ticks
        earned_grc = 10.0 * ticks
        for m in missions:
            if not m["is_completed"]:
                cur_val = m["current_value"]
                if m["target_metric"] == "population":
                    cur_val = new_population
                elif m["target_metric"] == "happiness":
                    cur_val = new_happiness

                is_done = 1 if cur_val >= m["target_value"] else 0
                conn.execute("""
                UPDATE missions SET current_value = ?, is_completed = ? WHERE world_id = ? AND id = ?
                """, (cur_val, is_done, world_id, m["id"]))

                if is_done and not m["is_completed"]:
                    evt_id = f"evt_{uuid.uuid4().hex[:8]}"
                    conn.execute("""
                    INSERT INTO events (id, world_id, year, day, title, category, description, created_at)
                    VALUES (?, ?, ?, ?, ?, 'milestone', ?, ?)
                    """, (evt_id, world_id, new_year, new_day, f"Objective Completed: {m['title']}",
                          f"Citizens achieved target for {m['title']}.", datetime.now(timezone.utc).isoformat()))

        # Update Progression
        new_xp = (prog["xp"] if prog else 0) + earned_xp
        new_level = max(1, min(10, (new_xp // 15000) + 1))
        new_grc = (prog["grc_balance"] if prog else 1000.0) + earned_grc
        thriving = min(0.99, 0.70 + (new_happiness * 0.15) + (econ["employment_rate"] * 0.10))

        now_str = datetime.now(timezone.utc).isoformat()
        conn.execute("""
        UPDATE worlds SET tick = ?, year = ?, day = ?, updated_at = ? WHERE id = ?
        """, (new_tick, new_year, new_day, now_str, world_id))

        new_grc = max(0.0, float(econ["genesis_research_credits"]) + daily_tax_rev - interest_charge)

        conn.execute("""
        UPDATE economy_resources SET
            population = ?, gdp = ?, food = ?, water = ?, energy = ?,
            materials = ?, research_points = ?, genesis_research_credits = ?,
            happiness = ?, civic_stability = ?, employment_rate = ?,
            total_interest_paid = COALESCE(total_interest_paid, 0.0) + ?
        WHERE world_id = ?
        """, (
            new_population, new_gdp, new_food, new_water, new_energy,
            new_materials, new_research, new_grc, new_happiness, new_stability,
            employment_rate, interest_charge, world_id
        ))

        conn.execute("""
        UPDATE progression SET
            xp = ?, level = ?, title = ?, thriving_score = ?, grc_balance = ?
        WHERE world_id = ?
        """, (new_xp, new_level, f"Level {new_level} Civilisation", thriving, new_grc, world_id))

        # Metrics history logging
        conn.execute("""
        INSERT INTO metrics_history (
            world_id, tick, year, day, population, gdp, happiness, employment, environment,
            gini, civic_stability, macro_innovation, avg_ai_dependency, avg_reasoning,
            food, energy, materials
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        """, (
            world_id, new_tick, new_year, new_day, new_population, new_gdp,
            new_happiness, econ["employment_rate"], econ["environmental_health"],
            econ["gini_coefficient"], new_stability, 0.84,
            0.18, 0.79, new_food, new_energy, new_materials
        ))

        # Record new causal events to database
        for evt in causal_res.get("events", []):
            conn.execute("""
            INSERT OR IGNORE INTO events (id, world_id, year, day, title, category, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                evt["id"],
                world_id,
                new_year,
                new_day,
                evt["title"],
                evt["category"],
                evt["description"],
                now_str
            ))

        # Record vitals to causal_vitals table
        v = causal_res["vitals"]
        dbc = v["deaths_by_cause"]
        un = v["unmet_needs"]
        conn.execute("""
        INSERT OR REPLACE INTO causal_vitals (
            id, world_id, tick, year, day, population, births, deaths,
            deaths_aging, deaths_starvation, deaths_dehydration, deaths_hospital_overload,
            deaths_pollution, deaths_trauma, hospital_admissions, bed_capacity,
            bed_occupancy_pct, overflow_patients, unmet_food, unmet_water, unmet_energy,
            unmet_healthcare, unmet_shelter, health_index, protest_intensity,
            protest_participants, grievance_score, happiness, civic_stability,
            environmental_health, created_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?
        )
        """, (
            f"cv_{world_id}_{new_tick}", world_id, new_tick, new_year, new_day, new_population, v["births"], v["deaths"],
            dbc["aging"], dbc["starvation"], dbc["dehydration"], dbc["hospital_overload"],
            dbc["pollution"], dbc["trauma"], v["hospital_admissions"], v["bed_capacity"],
            v["bed_occupancy_pct"], v["overflow_patients"], un["food"], un["water"], un["energy"],
            un["healthcare"], un["shelter"], v["health_index"], v["protest_intensity"],
            v["protest_participants"], v["grievance_score"], new_happiness, new_stability,
            v["environmental_health"], now_str
        ))

        # Autosave snapshot trigger
        autosave_interval = int(os.environ.get("AUTOSAVE_INTERVAL_TICKS", "50"))
        if new_tick % autosave_interval == 0:
            perform_autosave(conn, world_id, new_tick, new_year, new_day)

    conn.close()

    try:
        from engine.world.simulation import get_unified_simulation
        sim = get_unified_simulation(world_id)
        sim.load_world_from_db()
    except Exception:
        pass

    return {
        "world_id": world_id,
        "tick": new_tick,
        "year": new_year,
        "day": new_day,
        "population": new_population,
        "gdp": new_gdp,
        "gdp_formatted": format_currency(new_gdp),
        "happiness": round(new_happiness, 3),
        "civic_stability": round(new_stability, 3),
        "resources": {
            "food": round(new_food, 1),
            "water": round(new_water, 1),
            "energy": round(new_energy, 1),
            "materials": round(new_materials, 1),
            "research_points": round(new_research, 1),
            "grc_balance": round(new_grc, 1)
        },
        "progression": {
            "level": new_level,
            "xp": new_xp,
            "thriving_score": round(thriving, 2)
        },
        "vitals": causal_res["vitals"],
        "events": causal_res["events"],
        "deaths": causal_res["deaths"],
        "births": causal_res["births"],
        "deaths_by_cause": causal_res["deaths_by_cause"],
        "protest_intensity": causal_res["protest_intensity"],
        "trace_graph": causal_res["trace_graph"],
    }


# ==============================================================================
# 4. IN-MEMORY PYDANTIC SIMULATION (For Testing & Branching Comparisons)
# ==============================================================================

def generate_buildings_and_infrastructure(grid_size: int = 32) -> List[Building]:
    """Generates structured civic, residential, agricultural, industrial, and research infrastructure."""
    buildings: List[Building] = []
    b_id = 0
    center = grid_size / 2.0

    buildings.append(Building(id=f"bld_{b_id}", type="Civic", x=center, y=center, height=6.0, level=3, capacity=100))
    b_id += 1

    for dx, dy in [(-3, -3), (3, -3), (-3, 3), (3, 3)]:
        buildings.append(Building(id=f"bld_{b_id}", type="Research", x=center + dx, y=center + dy, height=4.8, level=2, capacity=30))
        b_id += 1

    for qx, qy in [(7, 7), (25, 25)]:
        for ix in [-2.5, 0.0, 2.5]:
            for iy in [-2.5, 0.0, 2.5]:
                h = round(random.uniform(2.2, 4.0), 1)
                buildings.append(Building(id=f"bld_{b_id}", type="Residential", x=qx + ix, y=qy + iy, height=h, level=1, capacity=20))
                b_id += 1

    for ix in range(6, 14, 3):
        for iy in range(20, 28, 3):
            buildings.append(Building(id=f"bld_{b_id}", type="Agricultural", x=float(ix), y=float(iy), height=1.6, level=1, capacity=25))
            b_id += 1

    for ix in range(20, 28, 3):
        for iy in range(6, 14, 3):
            buildings.append(Building(id=f"bld_{b_id}", type="Industrial", x=float(ix), y=float(iy), height=3.2, level=1, capacity=25))
            b_id += 1

    for cx, cy in [(center, 8.0), (center, 24.0), (8.0, center), (24.0, center)]:
        buildings.append(Building(id=f"bld_{b_id}", type="Commercial", x=float(cx), y=float(cy), height=2.8, level=2, capacity=40))
        b_id += 1

    return buildings


def create_initial_world(
    world_id: Optional[str] = None,
    name: str = "Civilisation Alpha",
    population_size: int = 100,
    grid_size: int = 32,
    climate: ClimateType = "Temperate",
    technology_level: TechLevel = "Automated",
    resource_tier: str = "Balanced",
    active_policy_ids: Optional[List[str]] = None,
    seed: Optional[int] = 42
) -> WorldState:
    """Initializes a new in-memory WorldState with configured population, climate, resources, and technology."""
    if seed is not None:
        random.seed(seed)

    actual_id = world_id or str(uuid.uuid4())[:8]
    citizens: List[Citizen] = []

    climate_temps = {
        "Temperate": 21.0,
        "Arid": 34.0,
        "Boreal": 2.0,
        "Tropical": 28.5,
        "Cyber-Industrial": 24.0
    }
    base_temp = climate_temps.get(climate, 21.0)

    tier_mult = 1.8 if resource_tier == "Abundant" else 0.6 if resource_tier == "Scarce" else 1.0
    water_factor = 0.5 if climate == "Arid" else 1.2 if climate == "Tropical" else 1.0
    food_factor = 1.3 if climate == "Tropical" else 0.7 if climate == "Boreal" else 1.0

    initial_resources = Resources(
        food=float(population_size * 22 * tier_mult * food_factor),
        water=float(population_size * 22 * tier_mult * water_factor),
        energy=float(population_size * 18 * tier_mult),
        materials=float(population_size * 12 * tier_mult)
    )

    for i in range(population_size):
        c_id = f"cit_{actual_id}_{i:04d}"
        occ = OCCUPATIONS[i % len(OCCUPATIONS)]
        base_wealth = round(random.uniform(50.0, 150.0) * tier_mult, 2)
        grid_x = round(random.uniform(0.0, float(grid_size)), 2)
        grid_y = round(random.uniform(0.0, float(grid_size)), 2)

        demo = Demographics(
            id=c_id,
            age=round(random.uniform(20.0, 50.0), 1),
            occupation=occ,
            wealth=base_wealth,
            x=grid_x,
            y=grid_y
        )

        needs = NeedsVector(
            hunger=round(random.uniform(0.1, 0.25), 3),
            energy=round(random.uniform(0.7, 0.95), 3),
            wellbeing=round(random.uniform(0.7, 0.9), 3)
        )

        cognitive = CognitiveProfile(
            independent_reasoning=round(random.uniform(0.68, 0.82), 3),
            problem_solving=round(random.uniform(0.55, 0.70), 3),
            critical_evaluation=round(random.uniform(0.65, 0.80), 3),
            creativity=round(random.uniform(0.60, 0.75), 3),
            knowledge_retention=round(random.uniform(0.70, 0.85), 3),
            ai_dependency=round(random.uniform(0.05, 0.15), 3)
        )

        citizens.append(Citizen(
            id=c_id,
            demographics=demo,
            needs=needs,
            cognitive=cognitive,
            is_alive=True
        ))

    buildings = generate_buildings_and_infrastructure(grid_size=grid_size)

    policies = get_default_policies()
    if active_policy_ids:
        for p_id in active_policy_ids:
            if p_id in policies:
                policies[p_id].active = True

    environment = EnvironmentStats(
        climate=climate,
        technology_level=technology_level,
        environmental_quality=0.70 if climate == "Cyber-Industrial" else 0.88,
        temperature_celsius=base_temp,
        weather="Clear"
    )

    world = WorldState(
        id=actual_id,
        name=name,
        tick=0,
        year=2026.0,
        population_count=population_size,
        environment=environment,
        buildings=buildings,
        citizens=citizens,
        resources=initial_resources,
        policies=policies,
        grid_size=grid_size,
        history=[]
    )

    resources_after, stats = process_economy_tick(world.citizens, world.resources)
    world.resources = resources_after
    world.economy = stats

    initial_snapshot = HistorySnapshot(
        tick=0,
        year=2026.0,
        population=len(world.citizens),
        gini=stats.gini,
        civic_stability=stats.civic_stability,
        macro_innovation=stats.macro_innovation_index,
        avg_ai_dependency=stats.avg_ai_dependency,
        avg_reasoning=stats.avg_reasoning,
        food=round(world.resources.food, 1),
        energy=round(world.resources.energy, 1),
        materials=round(world.resources.materials, 1),
        average_wealth=stats.average_wealth
    )
    world.history.append(initial_snapshot)

    return world


def step_world(world: WorldState, ticks: int = 1, ticks_per_year: int = 10) -> WorldState:
    """
    Advances the in-memory world simulation by N ticks.
    Default ticks_per_year=10 preserves 10 ticks = 1 year behavior for existing unit tests.
    """
    t0 = time.perf_counter()
    year_increment = round(1.0 / float(ticks_per_year), 2)
    try:
        for _ in range(ticks):
            world.tick += 1
            world.year = round(world.year + year_increment, 1)

            ai_coverage, scaffolding, ubi_amt, edu_boost, auto_tax = extract_policy_modifiers(world.policies)

            alive_citizens: List[Citizen] = []
            for c in world.citizens:
                if not c.is_alive:
                    continue

                c.demographics.age = round(c.demographics.age + year_increment, 1)

                update_citizen_cognition(
                    citizen=c,
                    ai_access_coverage=ai_coverage,
                    scaffolding_friction=scaffolding,
                    education_boost=edu_boost,
                    dt=year_increment * 10.0
                )

                dx = random.uniform(-0.5, 0.5)
                dy = random.uniform(-0.5, 0.5)
                c.demographics.x = max(0.0, min(float(world.grid_size), c.demographics.x + dx))
                c.demographics.y = max(0.0, min(float(world.grid_size), c.demographics.y + dy))

                # Level 3 AI Model: Calibrated Gompertz adult mortality hazard
                try:
                    from ml.inference.registry import calculate_gompertz_mortality_hazard
                    mortality_prob = calculate_gompertz_mortality_hazard(
                        age=c.demographics.age,
                        health=getattr(c.needs, "wellbeing", 0.75)
                    ) * year_increment
                except Exception:
                    mortality_prob = 0.05 if c.demographics.age > 85.0 else 0.001

                if random.random() < mortality_prob:
                    c.is_alive = False
                else:
                    alive_citizens.append(c)

            if len(alive_citizens) < len(world.citizens) * 0.95:
                new_idx = len(world.citizens)
                c_id = f"cit_{world.id}_{new_idx:04d}"
                occ = OCCUPATIONS[new_idx % len(OCCUPATIONS)]
                new_c = Citizen(
                    id=c_id,
                    demographics=Demographics(
                        id=c_id,
                        age=18.0,
                        occupation=occ,
                        wealth=50.0,
                        x=round(random.uniform(0.0, float(world.grid_size)), 2),
                        y=round(random.uniform(0.0, float(world.grid_size)), 2)
                    ),
                    needs=NeedsVector(hunger=0.1, energy=0.9, wellbeing=0.85),
                    cognitive=CognitiveProfile(
                        independent_reasoning=round(random.uniform(0.65, 0.78), 3),
                        problem_solving=0.6,
                        critical_evaluation=0.7,
                        creativity=0.65,
                        knowledge_retention=0.75,
                        ai_dependency=0.1
                    ),
                    is_alive=True
                )
                world.citizens.append(new_c)
                alive_citizens.append(new_c)

            world.population_count = len(alive_citizens)

            # Process macro economy
            updated_resources, economy_stats = process_economy_tick(
                world.citizens,
                world.resources,
                ubi_amount=ubi_amt,
                automation_tax_rate=auto_tax
            )
            world.resources = updated_resources
            world.economy = economy_stats

            # Record history snapshot
            snapshot = HistorySnapshot(
                tick=world.tick,
                year=world.year,
                population=world.population_count,
                gini=economy_stats.gini,
                civic_stability=economy_stats.civic_stability,
                macro_innovation=economy_stats.macro_innovation_index,
                avg_ai_dependency=economy_stats.avg_ai_dependency,
                avg_reasoning=economy_stats.avg_reasoning,
                food=round(world.resources.food, 1),
                energy=round(world.resources.energy, 1),
                materials=round(world.resources.materials, 1),
                average_wealth=economy_stats.average_wealth
            )
            world.history.append(snapshot)
            if len(world.history) > 600:
                world.history.pop(0)

            # Telemetry exporter hook (zero overhead when TELEMETRY_ENABLED=False)
            try:
                from ml.telemetry import get_telemetry_exporter
                exporter = get_telemetry_exporter()
                if exporter and exporter.enabled and (world.tick % getattr(exporter, "interval_ticks", 1) == 0):
                    cit_records = []
                    trip_records = []
                    hour = world.tick % 24
                    from ml.inference.registry import (
                        predict_citizen_activity,
                        predict_commute_mode,
                        predict_incident_risk
                    )
                    for c in world.citizens[:50]:
                        # Level 1 AI Model: Neural MLP Activity Predictor
                        activity = predict_citizen_activity(
                            cur_activity="home",
                            hour=hour,
                            age=c.demographics.age,
                            education=round(c.cognitive.knowledge_retention * 2.0, 1),
                            health=round(c.needs.wellbeing, 2),
                            wealth=round(c.demographics.wealth, 2)
                        )
                        cit_records.append({
                            "id": c.id,
                            "age": c.demographics.age,
                            "education": round(c.cognitive.knowledge_retention * 2.0, 1),
                            "health": round(c.needs.wellbeing, 2),
                            "wealth": round(c.demographics.wealth, 2),
                            "household_id": f"hh_{c.id}",
                            "home_id": "bld_res_01",
                            "work_id": "bld_ind_01",
                            "school_id": "bld_edu_01",
                            "current_activity": activity
                        })
                        if hour in [7, 8, 17, 18]:
                            # Level 1 AI Model: Discrete Mode Choice Model (LightGBM)
                            mode = predict_commute_mode(
                                age=c.demographics.age,
                                wealth=c.demographics.wealth,
                                departure_time=float(hour)
                            )
                            trip_records.append({
                                "trip_id": f"trp_{c.id}_{world.tick}",
                                "citizen_id": c.id,
                                "origin_id": "node_home",
                                "destination_id": "node_work",
                                "mode": mode,
                                "departure_time": float(hour),
                                "travel_time": round(random.uniform(12.0, 28.0), 1),
                                "cost": 3.0 if mode == "car" else (1.5 if mode == "transit" else 0.0)
                            })

                    dem_events = []
                    if len(world.citizens) > 0 and (world.tick % 10 == 0):
                        dem_events.append({
                            "event_id": f"dem_{world.id}_{world.tick}",
                            "event_type": "birth",
                            "age": 0.0,
                            "cause": "natural"
                        })

                    incidents = []
                    if random.random() < 0.15:
                        loc_x = random.uniform(0.0, float(world.grid_size))
                        loc_y = random.uniform(0.0, float(world.grid_size))
                        resp_time = round(random.uniform(3.5, 9.0), 1)
                        is_night = 1 if (hour >= 21 or hour <= 5) else 0

                        # Level 2 AI Model: Calibrated Incident Severity & Risk Classifier
                        inc_eval = predict_incident_risk(
                            location_x=loc_x,
                            location_y=loc_y,
                            response_time=resp_time,
                            hour=hour,
                            is_night=is_night
                        )

                        incidents.append({
                            "incident_id": f"inc_{world.id}_{world.tick}",
                            "type": "traffic",
                            "severity": inc_eval["severity_code"],
                            "location_x": loc_x,
                            "location_y": loc_y,
                            "response_time": resp_time,
                            "casualties": 2 if inc_eval["is_severe"] else 1
                        })

                    city_stats = {
                        "population": world.population_count,
                        "gdp": world.resources.food * 50.0 + world.resources.energy * 80.0 + world.resources.materials * 100.0,
                        "gini": economy_stats.gini,
                        "happiness": round(sum(c.needs.wellbeing for c in world.citizens) / max(1, len(world.citizens)), 3),
                        "pollution": 0.12,
                        "civic_stability": economy_stats.civic_stability,
                        "average_health": round(sum(c.needs.wellbeing for c in world.citizens) / max(1, len(world.citizens)), 3),
                        "average_education": round(economy_stats.macro_innovation_index, 3),
                        "traffic_congestion": 0.22
                    }

                    policy_dict = {p_id: p.active for p_id, p in world.policies.items()}
                    exporter.record_snapshot(
                        world_id=world.id,
                        tick=world.tick,
                        seed=getattr(world, "seed", 42),
                        policies=policy_dict,
                        citizens=cit_records,
                        trips=trip_records,
                        incidents=incidents,
                        demographics=dem_events,
                        city_metrics=city_stats
                    )
            except Exception:
                pass

        dt = (time.perf_counter() - t0) * 1000.0
        perf_collector.record_simulation_tick(
            tick_duration_ms=dt,
            processed_agents=world.population_count,
            state_updates=ticks,
            events_generated=0,
            db_writes=0
        )
        return world
    except Exception as e:
        perf_collector.record_simulation_error()
        raise e
