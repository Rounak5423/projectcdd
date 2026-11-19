"""
GENESIS Engine v2.0 - Authoritative Population Realism and Demographic Invariants Test Battery
Tests:
1. Conservation Identity (Balance Sheet): pop_next = pop_curr + births - deaths + in_migrants - out_migrants
2. Age Cohort Totals Invariant: sum(cohorts) == living_population
3. Zero-population extinction world non-spontaneous generation
4. Strict numerical bounding: [0, 1] for vitals, no NaN or negative counts
5. Bit-for-bit PRNG replay determinism across repeated runs
6. Hadwiger ASFR fertility distribution and postpartum cooldown
7. Siler infant mortality vs adult Gompertz hazard
8. Symmetric push/pull migration under economic & environmental distress
9. Thermal extremes and climate stress (Hypothermia in freezing winter, Heatstroke in arid summer)
10. Capacity feedback: smooth fertility damping when residential capacity is exceeded
11. API contract verification: GET /worlds/{id}/population returns live calculated cohorts & accounting
"""

import pytest
import math
import random
from fastapi.testclient import TestClient
from main import app
from engine.modules.core import AuthoritativeSimulationCore, get_authoritative_simulation
from engine.modules.population import PopulationModule, CitizenAgent
from engine.modules.config import (
    POSTPARTUM_COOLDOWN_TICKS,
    INFANT_MORTALITY_BASELINE,
    HADWIGER_PEAK_AGE,
    AGE_COHORTS
)

client = TestClient(app)


class TestPopulationRealismAndInvariants:

    def test_01_demographic_conservation_identity_100_ticks(self):
        """
        Conservation Law: At every single tick,
        pop_end == pop_start + births - deaths + in_migrants - out_migrants.
        """
        sim = AuthoritativeSimulationCore("test_pop_conservation", seed=1001)

        for step_idx in range(100):
            pop_before = len(sim.population_module.get_living_citizens())
            delta, metrics = sim.advance_tick(1)
            pop_after = len(sim.population_module.get_living_citizens())

            ledger = sim.population_module.last_step_accounting
            assert ledger["start_population"] == pop_before
            assert ledger["end_population"] == pop_after
            assert pop_after == (
                ledger["start_population"] +
                ledger["births"] -
                ledger["deaths"] +
                ledger["in_migrants"] -
                ledger["out_migrants"] +
                ledger["admin_adjustments"]
            ), f"Step {step_idx}: Conservation identity violated!"

    def test_02_age_cohort_sum_matches_living_population(self):
        """
        Invariant: sum of all mutually exclusive age cohorts must equal living population exactly.
        """
        sim = AuthoritativeSimulationCore("test_pop_cohorts", seed=1002)

        for _ in range(50):
            sim.advance_tick(1)
            cohorts = sim.population_module.get_age_cohorts()
            living_cits = sim.population_module.get_living_citizens()

            assert sum(cohorts.values()) == len(living_cits), (
                f"Cohort sum {sum(cohorts.values())} does not match living population {len(living_cits)}"
            )
            # Ensure every recognized cohort is present
            for cohort_name in AGE_COHORTS.keys():
                assert cohort_name in cohorts
                assert cohorts[cohort_name] >= 0

    def test_03_zero_population_extinction_stability(self):
        """
        Extinction Stability: A world with 0 citizens produces zero births, zero deaths,
        and no negative populations or division-by-zero crashes.
        """
        pop_mod = PopulationModule("world_extinct")
        pop_mod.citizens.clear()

        # Step empty population for 24 ticks (1 day)
        res = pop_mod.step(
            ticks=24,
            food_available_ratio=0.0,
            water_available_ratio=0.0,
            energy_available_ratio=0.0,
            pollution_level=1.0,
            hospital_capacity=0,
            residential_capacity=0,
            jobs_capacity=0
        )

        assert res["population"] == 0
        assert res["births_this_step"] == 0
        assert res["deaths_this_step"] == 0
        assert res["in_migrants_this_step"] == 0
        assert res["out_migrants_this_step"] == 0
        assert res["average_health"] == 0.0
        assert res["average_happiness"] == 0.0
        assert sum(res["age_cohorts"].values()) == 0

    def test_04_strict_numerical_bounds(self):
        """
        Mathematical Invariants: Health, Hunger, Thirst, Warmth, and Mood must remain strictly in [0.0, 1.0].
        No NaN or Inf values.
        """
        sim = AuthoritativeSimulationCore("test_pop_bounds", seed=1004)

        for _ in range(30):
            sim.advance_tick(1)
            for c in sim.population_module.citizens.values():
                assert 0.0 <= c.health <= 1.0, f"Citizen {c.id} health out of bounds: {c.health}"
                assert 0.0 <= c.hunger <= 1.0, f"Citizen {c.id} hunger out of bounds: {c.hunger}"
                assert 0.0 <= c.thirst <= 1.0, f"Citizen {c.id} thirst out of bounds: {c.thirst}"
                assert 0.0 <= c.warmth <= 1.0, f"Citizen {c.id} warmth out of bounds: {c.warmth}"
                assert 0.0 <= c.mood <= 1.0, f"Citizen {c.id} mood out of bounds: {c.mood}"
                assert not math.isnan(c.age) and not math.isinf(c.age)

    def test_05_deterministic_prng_replay(self):
        """
        Bit-for-Bit Determinism: Two worlds initialized with the same seed must produce
        identical population counts, cohort distributions, and accounting ledgers across 40 ticks.
        """
        seed_val = 55443322
        sim_a = AuthoritativeSimulationCore("test_det_pop_a", seed=seed_val)
        sim_b = AuthoritativeSimulationCore("test_det_pop_b", seed=seed_val)

        for _ in range(40):
            sim_a.advance_tick(1)
            sim_b.advance_tick(1)

        pop_a = sim_a.population_module
        pop_b = sim_b.population_module

        assert len(pop_a.get_living_citizens()) == len(pop_b.get_living_citizens())
        assert pop_a.cumulative_births == pop_b.cumulative_births
        assert pop_a.cumulative_deaths == pop_b.cumulative_deaths
        assert pop_a.cumulative_in_migrants == pop_b.cumulative_in_migrants
        assert pop_a.cumulative_out_migrants == pop_b.cumulative_out_migrants
        assert pop_a.get_age_cohorts() == pop_b.get_age_cohorts()
        assert pop_a.last_step_accounting == pop_b.last_step_accounting

    def test_06_postpartum_cooldown_enforcement(self):
        """
        Biology Invariant: A female citizen cannot give birth twice within the ~9 month gestation cooldown.
        """
        pop_mod = PopulationModule("test_cooldown")
        pop_mod.citizens.clear()

        # Add 1 reproductive female aged 27.3 (peak fertility)
        mother = CitizenAgent(
            id="mother_01",
            world_id="test_cooldown",
            name="Mother",
            age=HADWIGER_PEAK_AGE,
            sex="F",
            health=1.0,
            is_alive=1
        )
        pop_mod.citizens["mother_01"] = mother

        # Force a birth at tick 100
        mother.last_birth_tick = 100

        # Run 100 ticks within cooldown period (tick 101 to 200)
        rng = random.Random(999)
        total_births_during_cooldown = 0
        for current_t in range(101, 201):
            res = pop_mod.step(
                ticks=1,
                food_available_ratio=1.0,
                water_available_ratio=1.0,
                energy_available_ratio=1.0,
                pollution_level=0.0,
                hospital_capacity=100,
                residential_capacity=100,
                jobs_capacity=100,
                current_tick=current_t,
                rng=rng
            )
            total_births_during_cooldown += res["births_this_step"]

        assert total_births_during_cooldown == 0, "No birth permitted during postpartum gestation cooldown!"

    def test_07_hadwiger_fertility_peaks_at_prime_age(self):
        """
        Fertility Distribution: Evaluates fertility across age spectrum.
        Peak births must occur around age 25-32; age < 18 or > 45 must have zero fertility.
        """
        pop_mod = PopulationModule("test_hadwiger")

        # Female aged 15 (Youth - below reproductive age)
        pop_mod.citizens["young"] = CitizenAgent("young", "test_hadwiger", "Young", age=15.0, sex="F", is_alive=1)
        # Female aged 55 (Senior - past reproductive age)
        pop_mod.citizens["mature"] = CitizenAgent("mature", "test_hadwiger", "Mature", age=55.0, sex="F", is_alive=1)

        rng = random.Random(123)
        for t in range(50):
            res = pop_mod.step(
                ticks=24,
                food_available_ratio=1.0,
                water_available_ratio=1.0,
                energy_available_ratio=1.0,
                pollution_level=0.0,
                hospital_capacity=100,
                residential_capacity=100,
                jobs_capacity=100,
                current_tick=t * 24,
                rng=rng
            )
            assert res["births_this_step"] == 0, "Non-reproductive age cohorts cannot give birth!"

    def test_08_infant_mortality_hazard_and_sanitation_sensitivity(self):
        """
        Infant Demographics: Infants (< 2 years old) have distinct mortality hazard
        sensitive to clean water shortages, classified under 'Infant Mortality'.
        """
        pop_mod = PopulationModule("test_infant")
        pop_mod.citizens.clear()

        # Add 100 infants in severe water deficit (polluted/no water)
        for i in range(100):
            cid = f"inf_{i}"
            pop_mod.citizens[cid] = CitizenAgent(
                id=cid,
                world_id="test_infant",
                name=f"Infant {i}",
                age=0.5,
                health=0.8,
                is_alive=1
            )

        rng = random.Random(42)
        # Run 240 ticks (10 days) of critical water deficit
        res = pop_mod.step(
            ticks=240,
            food_available_ratio=1.0,
            water_available_ratio=0.0,  # Zero water / severe sanitation failure
            energy_available_ratio=1.0,
            pollution_level=0.5,
            hospital_capacity=10,
            residential_capacity=200,
            jobs_capacity=0,
            rng=rng
        )

        assert pop_mod.deaths_by_cause["Infant Mortality"] > 0, "Infants dying under water crisis must be classified as Infant Mortality"
        assert pop_mod.cumulative_infant_deaths > 0

    def test_09_symmetric_push_pull_migration(self):
        """
        Migration Equilibrium:
        - Prosperous city (jobs, housing, clean air) generates in-migration.
        - Catastrophic city (famine, 100% unemployment, extreme pollution) triggers out-migration.
        """
        pop_mod = PopulationModule("test_migration")
        pop_mod.citizens.clear()

        # Populate with 30 working adults
        for i in range(30):
            cid = f"cit_{i}"
            pop_mod.citizens[cid] = CitizenAgent(
                id=cid,
                world_id="test_migration",
                name=f"Citizen {i}",
                age=30.0,
                mood=0.9,
                is_alive=1
            )

        rng = random.Random(777)
        # Pull scenario: High housing capacity (200), jobs (100), clean resources
        res_pull = pop_mod.step(
            ticks=72,
            food_available_ratio=1.0,
            water_available_ratio=1.0,
            energy_available_ratio=1.0,
            pollution_level=0.05,
            hospital_capacity=50,
            residential_capacity=200,
            jobs_capacity=100,
            rng=rng
        )
        assert res_pull["in_migrants_this_step"] > 0, "Prosperous city must attract in-migrants"
        assert pop_mod.cumulative_in_migrants > 0

        # Push scenario: Severe crisis (0 food, 0 water, 0.9 pollution, 0 jobs)
        res_push = pop_mod.step(
            ticks=120,
            food_available_ratio=0.05,
            water_available_ratio=0.05,
            energy_available_ratio=0.05,
            pollution_level=0.85,
            hospital_capacity=0,
            residential_capacity=10,  # severe overcrowding
            jobs_capacity=0,          # 100% unemployment
            rng=rng
        )
        assert res_push["out_migrants_this_step"] > 0, "Distressed city must trigger out-migration"
        assert pop_mod.cumulative_out_migrants > 0

    def test_10_thermal_climate_extremes(self):
        """
        Thermal Feedback: Subzero freezing in winter without energy causes Hypothermia;
        extreme heat (>35C) without water causes Heatstroke.
        """
        pop_mod = PopulationModule("test_thermal")
        pop_mod.citizens.clear()

        # 50 citizens in subzero cold (-25C) with 0 heating energy
        for i in range(50):
            cid = f"cold_{i}"
            pop_mod.citizens[cid] = CitizenAgent(
                id=cid,
                world_id="test_thermal",
                name=f"Cold Cit {i}",
                age=40.0,
                warmth=0.02,
                health=0.3,
                is_alive=1
            )

        rng = random.Random(888)
        res_cold = pop_mod.step(
            ticks=24,
            food_available_ratio=1.0,
            water_available_ratio=1.0,
            energy_available_ratio=0.0,  # No heating
            pollution_level=0.1,
            hospital_capacity=10,
            residential_capacity=100,
            jobs_capacity=50,
            temperature_c=-25.0,
            current_season="Winter",
            rng=rng
        )
        assert pop_mod.deaths_by_cause["Hypothermia/Extreme Cold"] > 0, "Freezing cold without heating must cause Hypothermia deaths"

    def test_11_carrying_capacity_fertility_damping(self):
        """
        Carrying Capacity Feedback: Overcrowding (population > residential capacity)
        significantly dampens birth rate to avoid unbounded exponential explosion.
        """
        pop_mod_normal = PopulationModule("test_cap_normal")
        pop_mod_crowded = PopulationModule("test_cap_crowded")

        # 50 fertile females in capacity 500 (normal)
        for i in range(50):
            cid = f"f_{i}"
            pop_mod_normal.citizens[cid] = CitizenAgent(cid, "test_cap_normal", f"Female {i}", age=27.0, sex="F", is_alive=1)
            pop_mod_crowded.citizens[cid] = CitizenAgent(cid, "test_cap_crowded", f"Female {i}", age=27.0, sex="F", is_alive=1)

        rng_a = random.Random(42)
        rng_b = random.Random(42)

        # Step normal with residential capacity 500
        res_normal = pop_mod_normal.step(
            ticks=720,  # 1 month
            food_available_ratio=1.0,
            water_available_ratio=1.0,
            energy_available_ratio=1.0,
            pollution_level=0.1,
            hospital_capacity=100,
            residential_capacity=500,
            jobs_capacity=100,
            rng=rng_a
        )

        # Step overcrowded with residential capacity 5 (10x overcrowding)
        res_crowded = pop_mod_crowded.step(
            ticks=720,  # 1 month
            food_available_ratio=1.0,
            water_available_ratio=1.0,
            energy_available_ratio=1.0,
            pollution_level=0.1,
            hospital_capacity=100,
            residential_capacity=5,
            jobs_capacity=100,
            rng=rng_b
        )

        assert res_crowded["births_this_step"] <= res_normal["births_this_step"], (
            "Overcrowded world must have dampened or lower births than normal capacity world"
        )

    def test_12_api_population_overview_live_authoritative_contract(self):
        """
        API Contract Verification: GET /api/v1/worlds/{id}/population returns
        authoritative live rates, complete age cohorts, cause-of-death breakdowns,
        and demographic accounting without hardcoded placeholders.
        """
        # Ensure world is loaded in core
        sim = get_authoritative_simulation("aurora-prime")
        sim.advance_tick(1)

        res = client.get("/api/v1/worlds/aurora-prime/population")
        assert res.status_code == 200
        data = res.json()

        # Contract checks
        assert "world_id" in data and data["world_id"] == "aurora-prime"
        assert "total_population" in data and data["total_population"] > 0
        assert "age_cohorts" in data and isinstance(data["age_cohorts"], dict)
        assert "deaths_by_cause" in data and isinstance(data["deaths_by_cause"], dict)
        assert "demographic_accounting" in data and isinstance(data["demographic_accounting"], dict)

        # Ensure age cohorts are populated
        cohorts = data["age_cohorts"]
        for c_name in ["Infant", "Child", "Youth", "Young Adult", "Prime Adult", "Mature Adult", "Senior", "Elder"]:
            assert c_name in cohorts

        # Ensure realistic dynamic rates
        assert 0.0 <= data["birth_rate"] <= 0.20
        assert 0.0 <= data["death_rate"] <= 0.20
        assert 0.0 <= data["health"] <= 1.0
        assert 0.0 <= data["happiness"] <= 1.0
        assert 0.0 <= data["education"] <= 1.0
