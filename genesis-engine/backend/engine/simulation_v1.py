import json
import uuid
import random
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple
from db.database import get_db_connection


def format_currency(val: float) -> str:
    if val >= 1_000_000_000:
        return f"${val / 1_000_000_000:.1f}B"
    elif val >= 1_000_000:
        return f"${val / 1_000_000:.1f}M"
    elif val >= 1_000:
        return f"${val / 1_000:.1f}K"
    return f"${val:.2f}"


def seed_aurora_prime_if_not_exists():
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

        # 2. Economy and Resources (Exact values from UI screenshot)
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

        # 4. Seeded Buildings (From UI screenshot)
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
             '{"materials": 2400, "energy": 1100, "credits": 300}', '{"materials": 3600, "energy": 1600, "credits": 450}',
             '{"materials_generation_t": 60.0, "gdp_contribution_rate": 0.12}'),

            ("bld_uni_1", "aurora-prime", "Foundational Logic Academy", "Education", 3, 18.0, 10.0, 0.0, 3.2, 3.2, 4.8, 60.0, "active", 800,
             '{"materials": 1600, "energy": 700, "credits": 200}', '{"materials": 2500, "energy": 1000, "credits": 320}',
             '{"education_boost": 0.07, "independent_reasoning_preservation": 0.85}')
        ]

        for b in buildings_data:
            conn.execute("""
            INSERT INTO buildings (
                id, world_id, name, type, level, x, y, z, width, length, height,
                orientation, status, capacity, construction_cost, upgrade_cost, effects
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, b)

        # 5. Seeded Citizens Sample (representing demographics)
        occupations = ["Scholar", "Engineer", "Farmer", "Builder", "Merchant"]
        for i in range(120):
            c_id = f"cit_aurora_{i:04d}"
            occ = occupations[i % len(occupations)]
            conn.execute("""
            INSERT INTO citizens (
                id, world_id, age, occupation, wealth, x, y, hunger, energy, wellbeing,
                education_level, health, independent_reasoning, problem_solving,
                critical_evaluation, creativity, knowledge_retention, ai_dependency, is_alive
            ) VALUES (?, 'aurora-prime', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """, (
                c_id,
                round(random.uniform(22.0, 52.0), 1),
                occ,
                round(random.uniform(42000.0, 95000.0), 2),
                round(random.uniform(4.0, 28.0), 2),
                round(random.uniform(4.0, 28.0), 2),
                round(random.uniform(0.1, 0.25), 3),
                round(random.uniform(0.7, 0.95), 3),
                round(random.uniform(0.75, 0.92), 3),
                round(random.uniform(0.7, 0.9), 3),
                round(random.uniform(0.8, 0.95), 3),
                round(random.uniform(0.72, 0.86), 3),
                round(random.uniform(0.65, 0.80), 3),
                round(random.uniform(0.70, 0.85), 3),
                round(random.uniform(0.65, 0.80), 3),
                round(random.uniform(0.75, 0.90), 3),
                round(random.uniform(0.12, 0.24), 3)
            ))

        # 6. Missions (Active Objectives from UI screenshot)
        missions_data = [
            ("mission_pop_15m", "aurora-prime", "Reach 1.5M population",
             "Expand urban capacity and medical infrastructure to support 1.5 million citizens.",
             "population", 1500000.0, 1248532.0, 0, 0, 5000, 300.0),

            ("mission_build_res_hub", "aurora-prime", "Build a Research Hub",
             "Construct and commission a specialized Level 3 Research Hub for advanced experiments.",
             "building_Research", 1.0, 1.0, 1, 1, 3000, 150.0),

            ("mission_happiness_75", "aurora-prime", "Maintain Happiness >= 75%",
             "Ensure citizen wellbeing and basic needs satisfaction remain above 75%.",
             "happiness", 0.75, 0.78, 1, 0, 4000, 200.0),

            ("mission_food_prod_20", "aurora-prime", "Increase Food Production by 20%",
             "Upgrade vertical agriculture to expand total food surplus by 20%.",
             "food_rate_pct", 20.0, 12.0, 0, 0, 3500, 180.0)
        ]
        for m in missions_data:
            conn.execute("""
            INSERT INTO missions (
                id, world_id, title, description, target_metric, target_value,
                current_value, is_completed, is_claimed, reward_xp, reward_grc
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, m)

        # 7. Recent Events (From UI screenshot)
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

        # 8. Technologies
        techs_data = [
            ("tech_ai_copilots", "aurora-prime", "Automated AI Assistance", "Cognitive", 1, 1000.0, 1000.0, 1, 0,
             '{"efficiency_boost": 0.15, "ai_dependency_growth": 0.02}'),
            ("tech_clean_fusion", "aurora-prime", "Geothermal & Fusion Grid", "Energy", 2, 2500.0, 2500.0, 1, 0,
             '{"clean_energy_mw": 95.0, "pollution_reduction": 0.20}'),
            ("tech_vertical_hydro", "aurora-prime", "Vertical Hydroponics", "Agriculture", 2, 2000.0, 2000.0, 1, 0,
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

        # 9. Policies
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

        # 10. Achievements
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

        # 11. Initial Metrics History point
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


def advance_world_simulation(world_id: str, ticks: int = 1) -> Dict[str, Any]:
    conn = get_db_connection()
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

    # In our simulation engine:
    # 1 tick = 0.1 simulated years = 36.5 days
    days_per_tick = 36
    new_tick = cur_tick + ticks
    total_days = cur_day + (ticks * days_per_tick)
    add_years = total_days // 365
    new_day = (total_days % 365) + 1
    new_year = cur_year + add_years

    # Population growth
    growth_multiplier = (1.0 + (econ["population_growth_rate"] * 0.1)) ** ticks
    new_population = int(econ["population"] * growth_multiplier)

    # GDP growth
    gdp_multiplier = (1.0 + (econ["gdp_growth_rate"] * 0.1)) ** ticks
    new_gdp = round(econ["gdp"] * gdp_multiplier, 2)

    # Resource updates
    food_prod = econ["food_rate"] * ticks * 10
    water_prod = econ["water_rate"] * ticks * 10
    energy_prod = econ["energy_rate"] * ticks * 10
    materials_prod = econ["materials_rate"] * ticks * 10
    research_prod = econ["research_rate"] * ticks * 5

    # Resource consumption
    food_cons = (new_population / 10000.0) * ticks * 8.0
    water_cons = (new_population / 10000.0) * ticks * 10.0
    energy_cons = (new_population / 10000.0) * ticks * 6.5
    materials_cons = ticks * 40.0

    new_food = max(0.0, econ["food"] + food_prod - food_cons)
    new_water = max(0.0, econ["water"] + water_prod - water_cons)
    new_energy = max(0.0, econ["energy"] + energy_prod - energy_cons)
    new_materials = max(0.0, econ["materials"] + materials_prod - materials_cons)
    new_research = econ["research_points"] + research_prod

    # Research tech progress
    active_tech = conn.execute("SELECT * FROM technologies WHERE world_id = ? AND is_researching = 1", (world_id,)).fetchall()
    with conn:
        for t in active_tech:
            add_prog = research_prod * 0.5
            total_prog = t["research_progress"] + add_prog
            if total_prog >= t["research_cost"]:
                conn.execute("""
                UPDATE technologies SET research_progress = ?, is_unlocked = 1, is_researching = 0
                WHERE world_id = ? AND id = ?
                """, (t["research_cost"], world_id, t["id"]))
                # Add event
                evt_id = f"evt_{uuid.uuid4().hex[:8]}"
                conn.execute("""
                INSERT INTO events (id, world_id, year, day, title, category, description, created_at)
                VALUES (?, ?, ?, ?, ?, 'breakthrough', ?, ?)
                """, (evt_id, world_id, new_year, new_day, f"Research Breakthrough: {t['name']}",
                      f"Civilisation successfully unlocked {t['name']}.", datetime.utcnow().isoformat()))
            else:
                conn.execute("""
                UPDATE technologies SET research_progress = ?
                WHERE world_id = ? AND id = ?
                """, (total_prog, world_id, t["id"]))

    # Check and update missions
    missions = conn.execute("SELECT * FROM missions WHERE world_id = ?", (world_id,)).fetchall()
    earned_xp = 50 * ticks
    earned_grc = 10.0 * ticks
    with conn:
        for m in missions:
            if not m["is_completed"]:
                cur_val = m["current_value"]
                if m["target_metric"] == "population":
                    cur_val = new_population
                elif m["target_metric"] == "happiness":
                    cur_val = econ["happiness"]

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
                          f"Citizens achieved target for {m['title']}.", datetime.utcnow().isoformat()))

    # Update Progression (15,000 XP per level threshold)
    new_xp = (prog["xp"] if prog else 0) + earned_xp
    new_level = max(1, min(10, (new_xp // 15000) + 1))
    new_grc = (prog["grc_balance"] if prog else 1000.0) + earned_grc
    thriving = min(0.99, 0.70 + (econ["happiness"] * 0.15) + (econ["employment_rate"] * 0.10))

    now = datetime.now(timezone.utc).isoformat()
    with conn:
        conn.execute("""
        UPDATE worlds SET tick = ?, year = ?, day = ?, updated_at = ? WHERE id = ?
        """, (new_tick, new_year, new_day, now, world_id))

        conn.execute("""
        UPDATE economy_resources SET
            population = ?, gdp = ?, food = ?, water = ?, energy = ?,
            materials = ?, research_points = ?, genesis_research_credits = ?
        WHERE world_id = ?
        """, (new_population, new_gdp, new_food, new_water, new_energy, new_materials, new_research, new_grc, world_id))

        conn.execute("""
        UPDATE progression SET
            xp = ?, level = ?, title = ?, thriving_score = ?, grc_balance = ?
        WHERE world_id = ?
        """, (new_xp, new_level, f"Level {new_level} Civilisation", thriving, new_grc, world_id))

        # Record metrics history
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
            econ["happiness"], econ["employment_rate"], econ["environmental_health"],
            econ["gini_coefficient"], econ["civic_stability"], 0.84,
            0.18, 0.79, new_food, new_energy, new_materials
        ))

    conn.close()

    return {
        "world_id": world_id,
        "tick": new_tick,
        "year": new_year,
        "day": new_day,
        "population": new_population,
        "gdp": new_gdp,
        "gdp_formatted": format_currency(new_gdp),
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
        }
    }
