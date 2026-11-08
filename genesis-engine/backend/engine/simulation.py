import random
import uuid
import time
from typing import List, Dict, Any, Optional
from .models import (
    WorldState, Citizen, Demographics, NeedsVector, CognitiveProfile,
    Resources, HistorySnapshot, OccupationType, Building, EnvironmentStats,
    ClimateType, TechLevel
)
from .cognitive import update_citizen_cognition
from .economy import process_economy_tick
from .policies import get_default_policies, extract_policy_modifiers
from monitoring.collector import perf_collector

OCCUPATIONS: List[OccupationType] = ["Farmer", "Engineer", "Scholar", "Builder", "Merchant"]


def generate_buildings_and_infrastructure(grid_size: int = 32) -> List[Building]:
    """
    Generates structured civic, residential, agricultural, industrial, and research infrastructure.
    """
    buildings: List[Building] = []
    b_id = 0
    center = grid_size / 2.0

    # 1. Central Civic Council & Research Citadel
    buildings.append(Building(id=f"bld_{b_id}", type="Civic", x=center, y=center, height=6.0, level=3, capacity=100))
    b_id += 1

    # 2. High-Tech Scholar Spires
    for dx, dy in [(-3, -3), (3, -3), (-3, 3), (3, 3)]:
        buildings.append(Building(id=f"bld_{b_id}", type="Research", x=center + dx, y=center + dy, height=4.8, level=2, capacity=30))
        b_id += 1

    # 3. Residential Sectors
    for qx, qy in [(7, 7), (25, 25)]:
        for ix in [-2.5, 0.0, 2.5]:
            for iy in [-2.5, 0.0, 2.5]:
                h = round(random.uniform(2.2, 4.0), 1)
                buildings.append(Building(id=f"bld_{b_id}", type="Residential", x=qx + ix, y=qy + iy, height=h, level=1, capacity=20))
                b_id += 1

    # 4. Agricultural Hydroponic Domes
    for ix in range(6, 14, 3):
        for iy in range(20, 28, 3):
            buildings.append(Building(id=f"bld_{b_id}", type="Agricultural", x=float(ix), y=float(iy), height=1.6, level=1, capacity=25))
            b_id += 1

    # 5. Industrial Materials & Energy Fabricators
    for ix in range(20, 28, 3):
        for iy in range(6, 14, 3):
            buildings.append(Building(id=f"bld_{b_id}", type="Industrial", x=float(ix), y=float(iy), height=3.2, level=1, capacity=25))
            b_id += 1

    # 6. Commercial Trading Plazas
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
    """
    Initializes a new WorldState with configured population, climate, resources and technology.
    """
    if seed is not None:
        random.seed(seed)

    actual_id = world_id or str(uuid.uuid4())[:8]
    citizens: List[Citizen] = []

    # Climate base temperature
    climate_temps = {
        "Temperate": 21.0,
        "Arid": 34.0,
        "Boreal": 2.0,
        "Tropical": 28.5,
        "Cyber-Industrial": 24.0
    }
    base_temp = climate_temps.get(climate, 21.0)

    # Initial resources based on tier & climate
    tier_mult = 1.8 if resource_tier == "Abundant" else 0.6 if resource_tier == "Scarce" else 1.0
    water_factor = 0.5 if climate == "Arid" else 1.2 if climate == "Tropical" else 1.0
    food_factor = 1.3 if climate == "Tropical" else 0.7 if climate == "Boreal" else 1.0

    initial_resources = Resources(
        food=float(population_size * 22 * tier_mult * food_factor),
        water=float(population_size * 22 * tier_mult * water_factor),
        energy=float(population_size * 18 * tier_mult),
        materials=float(population_size * 12 * tier_mult)
    )

    # Generate Citizens
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

    # Generate Buildings and Infrastructure
    buildings = generate_buildings_and_infrastructure(grid_size=grid_size)

    # Policies
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

    # Initial snapshot
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


def step_world(world: WorldState, ticks: int = 1) -> WorldState:
    """
    Advances the world simulation by N ticks (1 tick = 0.1 years).
    """
    t0 = time.perf_counter()
    try:
        for _ in range(ticks):
            world.tick += 1
            world.year = round(world.year + 0.1, 1)

            # Policy modifiers
            ai_coverage, scaffolding, ubi_amt, edu_boost, auto_tax = extract_policy_modifiers(world.policies)

            # Update each citizen
            alive_citizens: List[Citizen] = []
            for c in world.citizens:
                if not c.is_alive:
                    continue

                c.demographics.age = round(c.demographics.age + 0.1, 1)

                # Cognitive update under AI Paradox
                update_citizen_cognition(
                    citizen=c,
                    ai_access_coverage=ai_coverage,
                    scaffolding_friction=scaffolding,
                    education_boost=edu_boost
                )

                # Spatial jitter (agents move within city grid)
                dx = random.uniform(-0.5, 0.5)
                dy = random.uniform(-0.5, 0.5)
                c.demographics.x = max(0.0, min(float(world.grid_size), c.demographics.x + dx))
                c.demographics.y = max(0.0, min(float(world.grid_size), c.demographics.y + dy))

                # Natural mortality check
                if c.demographics.age > 85.0 and random.random() < 0.05:
                    c.is_alive = False
                else:
                    alive_citizens.append(c)

            # Demographic replacement: keep population stable
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
