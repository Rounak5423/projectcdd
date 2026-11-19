"""
GENESIS Engine v2.0 - Population Subsystem Module
Module: engine.modules.population
Authoritative agent demographics, Gompertz + Siler infant mortality with cause logging,
Hadwiger fertility with postpartum cooldown, symmetric push/pull migration,
employment matching, education pipeline, non-compensatory needs, and demographic conservation balance sheet.
"""

import math
from typing import Dict, List, Optional, Any, Tuple
import random
from .config import (
    GOMPERTZ_ALPHA,
    GOMPERTZ_BETA,
    CITIZEN_HOURLY_FOOD,
    CITIZEN_HOURLY_WATER,
    CITIZEN_HOURLY_ENERGY,
    STARVATION_HEALTH_DECAY,
    DEHYDRATION_HEALTH_DECAY,
    FREEZING_HEALTH_DECAY,
    POLLUTION_HEALTH_DECAY,
    HADWIGER_PEAK_AGE,
    HADWIGER_PEAK_RATE,
    HADWIGER_SPREAD,
    POSTPARTUM_COOLDOWN_TICKS,
    INFANT_MORTALITY_BASELINE,
    SEX_RATIO_AT_BIRTH_MALE,
    AGE_COHORTS
)


class CitizenAgent:
    """Agent representation for individual citizens."""
    __slots__ = (
        'id', 'world_id', 'name', 'age', 'sex', 'education', 'health', 'wealth',
        'household_id', 'home_building_id', 'work_building_id', 'employed',
        'occupation', 'hunger', 'thirst', 'warmth', 'safety', 'mood',
        'personality', 'is_alive', 'cause_of_death', 'last_birth_tick'
    )

    def __init__(
        self,
        id: str,
        world_id: str,
        name: str,
        age: float,
        sex: str = "F",
        education: float = 0.5,
        health: float = 0.9,
        wealth: float = 100.0,
        household_id: str = "hh_001",
        home_building_id: Optional[str] = None,
        work_building_id: Optional[str] = None,
        employed: int = 0,
        occupation: str = "Worker",
        hunger: float = 1.0,
        thirst: float = 1.0,
        warmth: float = 1.0,
        safety: float = 1.0,
        mood: float = 0.8,
        personality: Optional[Dict[str, float]] = None,
        is_alive: int = 1,
        last_birth_tick: Optional[int] = None
    ):
        self.id = id
        self.world_id = world_id
        self.name = name
        self.age = age
        self.sex = sex
        self.education = education
        self.health = health
        self.wealth = wealth
        self.household_id = household_id
        self.home_building_id = home_building_id
        self.work_building_id = work_building_id
        self.employed = employed
        self.occupation = occupation
        self.hunger = hunger
        self.thirst = thirst
        self.warmth = warmth
        self.safety = safety
        self.mood = mood
        self.personality = personality or {"neuroticism": 0.5, "conscientiousness": 0.5, "agreeableness": 0.5}
        self.is_alive = is_alive
        self.cause_of_death: Optional[str] = None
        self.last_birth_tick: Optional[int] = last_birth_tick

    @property
    def cohort(self) -> str:
        """Returns the demographic age cohort classification."""
        if self.age < 2.0:
            return "Infant"
        elif self.age < 13.0:
            return "Child"
        elif self.age < 18.0:
            return "Youth"
        elif self.age < 25.0:
            return "Young Adult"
        elif self.age < 55.0:
            return "Prime Adult"
        elif self.age < 65.0:
            return "Mature Adult"
        elif self.age < 80.0:
            return "Senior"
        else:
            return "Elder"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "world_id": self.world_id,
            "name": self.name,
            "age": round(self.age, 2),
            "sex": self.sex,
            "cohort": self.cohort,
            "education": round(self.education, 3),
            "health": round(self.health, 3),
            "wealth": round(self.wealth, 2),
            "household_id": self.household_id,
            "home_building_id": self.home_building_id,
            "work_building_id": self.work_building_id,
            "employed": self.employed,
            "occupation": self.occupation,
            "hunger": round(self.hunger, 3),
            "thirst": round(self.thirst, 3),
            "warmth": round(self.warmth, 3),
            "safety": round(self.safety, 3),
            "mood": round(self.mood, 3),
            "is_alive": self.is_alive,
            "cause_of_death": self.cause_of_death,
            "last_birth_tick": self.last_birth_tick
        }


class PopulationModule:
    """
    Simulates the living populace of the civilisation with entity-level integrity,
    conservation identity tracking, UN WPP 2024 calibrated demographics, and thermal/climate feedbacks.
    """
    def __init__(self, world_id: str):
        self.world_id = world_id
        self.citizens: Dict[str, CitizenAgent] = {}
        self.deaths_by_cause: Dict[str, int] = {
            "Old Age": 0,
            "Infant Mortality": 0,
            "Starvation": 0,
            "Dehydration": 0,
            "Hypothermia/Extreme Cold": 0,
            "Heatstroke/Extreme Heat": 0,
            "Pollution": 0,
            "Hospital Deficit": 0,
            "Accident": 0
        }
        self.cumulative_births = 0
        self.cumulative_deaths = 0
        self.cumulative_in_migrants = 0
        self.cumulative_out_migrants = 0
        self.cumulative_infant_deaths = 0
        self.demographic_accounting_ledger: List[Dict[str, Any]] = []
        self.last_step_accounting: Dict[str, Any] = {}

    def get_living_citizens(self) -> List[CitizenAgent]:
        """Returns all currently living citizens."""
        return [c for c in self.citizens.values() if c.is_alive == 1]

    def get_age_cohorts(self) -> Dict[str, int]:
        """Returns the distribution of living citizens across demographic age cohorts."""
        cohorts = {
            "Infant": 0,
            "Child": 0,
            "Youth": 0,
            "Young Adult": 0,
            "Prime Adult": 0,
            "Mature Adult": 0,
            "Senior": 0,
            "Elder": 0
        }
        for c in self.get_living_citizens():
            cohorts[c.cohort] = cohorts.get(c.cohort, 0) + 1
        return cohorts

    def get_average_health(self) -> float:
        living = self.get_living_citizens()
        if not living:
            return 0.0
        return round(sum(c.health for c in living) / len(living), 3)

    def get_average_happiness(self) -> float:
        living = self.get_living_citizens()
        if not living:
            return 0.0
        return round(sum(c.mood for c in living) / len(living), 3)

    def get_average_education(self) -> float:
        living = self.get_living_citizens()
        if not living:
            return 0.0
        return round(sum(c.education for c in living) / len(living), 3)

    def get_annual_birth_rate(self) -> float:
        if not self.last_step_accounting:
            return 0.020
        return self.last_step_accounting.get("crude_birth_rate_annual_per_1000", 20.0) / 1000.0

    def get_annual_death_rate(self) -> float:
        if not self.last_step_accounting:
            return 0.008
        return self.last_step_accounting.get("crude_death_rate_annual_per_1000", 8.0) / 1000.0

    def get_annual_net_migration_rate(self) -> float:
        if not self.last_step_accounting:
            return 0.005
        return self.last_step_accounting.get("net_migration_rate_annual_per_1000", 5.0) / 1000.0

    def load_from_list(self, citizen_records: List[Dict[str, Any]]):
        self.citizens.clear()
        for r in citizen_records:
            cid = r.get("id") or f"cit_{r.get('world_id', self.world_id)}_{len(self.citizens):04d}"
            agent = CitizenAgent(
                id=cid,
                world_id=r.get("world_id", self.world_id),
                name=r.get("name", f"Citizen {cid[-6:]}"),
                age=float(r.get("age", 25.0)),
                sex=r.get("sex", "F" if len(self.citizens) % 2 == 0 else "M"),
                education=float(r.get("education_level", r.get("education", 0.5))),
                health=float(r.get("health", 0.85)),
                wealth=float(r.get("wealth", 100.0)),
                household_id=r.get("household_id", f"hh_{cid[-4:]}"),
                home_building_id=r.get("home_building_id"),
                work_building_id=r.get("work_building_id"),
                employed=int(r.get("employed", 1 if float(r.get("age", 25)) >= 18 and float(r.get("age", 25)) < 65 else 0)),
                occupation=r.get("occupation", "Worker"),
                hunger=float(r.get("hunger", 1.0)),
                thirst=float(r.get("thirst", 1.0)),
                warmth=float(r.get("energy", r.get("warmth", 1.0))),
                safety=1.0,
                mood=float(r.get("wellbeing", r.get("mood", 0.8))),
                is_alive=int(r.get("is_alive", 1)),
                last_birth_tick=r.get("last_birth_tick")
            )
            self.citizens[cid] = agent

    def step(
        self,
        ticks: int,
        food_available_ratio: float,
        water_available_ratio: float,
        energy_available_ratio: float,
        pollution_level: float,
        hospital_capacity: int,
        residential_capacity: int,
        jobs_capacity: int,
        policy_multipliers: Optional[Dict[str, float]] = None,
        temperature_c: float = 21.0,
        current_season: str = "Spring",
        weather_condition: str = "Clear",
        climate: str = "Temperate",
        current_tick: int = 0,
        rng: Optional[random.Random] = None
    ) -> Dict[str, Any]:
        """
        Advances all citizens by N ticks according to causal biology, climate, and demographics.
        Optimized single-pass evaluation strictly enforcing the conservation identity:
        pop_end = pop_start + births - deaths + in_migrants - out_migrants.
        """
        if rng is None:
            rng = random.Random(42)
        if policy_multipliers is None:
            policy_multipliers = {}

        mortality_policy_mult = policy_multipliers.get("mortality_multiplier", 1.0)
        health_policy_bonus = policy_multipliers.get("health_bonus", 0.0)

        start_living = [c for c in self.citizens.values() if c.is_alive == 1]
        start_population = len(start_living)

        if start_population == 0:
            accounting_entry = {
                "tick": current_tick,
                "ticks_advanced": ticks,
                "start_population": 0,
                "births": 0,
                "deaths": 0,
                "in_migrants": 0,
                "out_migrants": 0,
                "admin_adjustments": 0,
                "end_population": 0,
                "net_change": 0,
                "infant_deaths": 0,
                "crude_birth_rate_annual_per_1000": 0.0,
                "crude_death_rate_annual_per_1000": 0.0,
                "net_migration_rate_annual_per_1000": 0.0,
                "age_cohorts": {k: 0 for k in AGE_COHORTS.keys()},
                "deaths_by_cause": dict(self.deaths_by_cause),
                "attractiveness": 0.0
            }
            self.last_step_accounting = accounting_entry
            return {
                "population": 0,
                "deaths_this_step": 0,
                "births_this_step": 0,
                "in_migrants_this_step": 0,
                "out_migrants_this_step": 0,
                "cumulative_deaths": self.cumulative_deaths,
                "cumulative_births": self.cumulative_births,
                "cumulative_in_migrants": self.cumulative_in_migrants,
                "cumulative_out_migrants": self.cumulative_out_migrants,
                "deaths_by_cause": dict(self.deaths_by_cause),
                "age_cohorts": {k: 0 for k in AGE_COHORTS.keys()},
                "demographic_accounting": accounting_entry,
                "average_health": 0.0,
                "average_happiness": 0.0,
                "unemployment_rate": 0.0,
                "employed_citizens": 0,
                "dead_ids": [],
                "out_migrant_ids": [],
                "new_citizens": []
            }

        age_delta = float(ticks) / 8760.0

        # Hospital overload factor pre-scan
        ill_count = sum(1 for c in start_living if c.health < 0.40)
        hospital_overload = max(0.0, (ill_count - hospital_capacity) / max(1, hospital_capacity))

        # Precompute macro multiplier terms
        food_critical = food_available_ratio < 0.2
        water_critical = water_available_ratio < 0.2
        energy_critical = energy_available_ratio < 0.2
        pollution_high = pollution_level > 0.4
        pollution_severe = pollution_level > 0.6
        optimal_resources = (food_available_ratio >= 0.8 and water_available_ratio >= 0.8 and energy_available_ratio >= 0.8)

        env_risk = 1.0 + max(0.0, pollution_level) * 1.5
        hosp_risk = 1.0 + hospital_overload * 3.0
        base_hazard_mult = env_risk * hosp_risk * mortality_policy_mult

        infant_sanitation_risk = 1.0 + 3.0 * max(0.0, 1.0 - water_available_ratio)
        infant_hosp_risk = 1.0 + hospital_overload * 2.5

        # Fertility scale precomputations
        fertility_damping = max(0.15, float(residential_capacity) / max(1.0, float(start_population))) if start_population >= residential_capacity else 1.0
        fertility_base_scale = HADWIGER_PEAK_RATE * min(1.0, food_available_ratio) * min(1.0, water_available_ratio) * fertility_damping * age_delta

        new_deaths: List[CitizenAgent] = []
        new_births: List[CitizenAgent] = []

        total_health = 0.0
        total_mood = 0.0
        working_age_count = 0
        currently_employed = 0

        cohorts = {
            "Infant": 0, "Child": 0, "Youth": 0, "Young Adult": 0,
            "Prime Adult": 0, "Mature Adult": 0, "Senior": 0, "Elder": 0
        }

        for c in start_living:
            # 1. Advance age
            c.age += age_delta

            # 2. Needs update & Thermal Dynamics
            if food_critical:
                c.hunger = max(0.0, c.hunger - STARVATION_HEALTH_DECAY * 2.5 * ticks)
            elif c.hunger < 1.0:
                c.hunger = min(1.0, c.hunger + 0.05 * ticks)

            if water_critical:
                c.thirst = max(0.0, c.thirst - DEHYDRATION_HEALTH_DECAY * 2.5 * ticks)
            elif c.thirst < 1.0:
                c.thirst = min(1.0, c.thirst + 0.08 * ticks)

            if temperature_c > 35.0 and (water_available_ratio < 0.4 or energy_available_ratio < 0.3):
                c.thirst = max(0.0, c.thirst - 0.015 * ticks)

            if temperature_c < 0.0 and energy_critical:
                subzero_severity = abs(temperature_c) / 15.0
                c.warmth = max(0.0, c.warmth - FREEZING_HEALTH_DECAY * subzero_severity * 2.0 * ticks)
            elif energy_critical:
                c.warmth = max(0.0, c.warmth - 0.01 * ticks)
            elif c.warmth < 1.0:
                c.warmth = min(1.0, c.warmth + 0.05 * ticks)

            # 3. Health progression
            health_delta = 0.0
            if c.hunger < 0.2:
                health_delta -= STARVATION_HEALTH_DECAY * ticks
            if c.thirst < 0.2:
                health_delta -= DEHYDRATION_HEALTH_DECAY * ticks
            if pollution_high:
                health_delta -= (pollution_level - 0.4) * POLLUTION_HEALTH_DECAY * ticks
            if c.warmth < 0.2:
                health_delta -= FREEZING_HEALTH_DECAY * 2.0 * ticks

            if optimal_resources and c.health < 1.0:
                health_delta += 0.005 * ticks

            c.health = max(0.01, min(1.0, c.health + health_delta + health_policy_bonus * 0.01 * ticks))

            # 4. Mortality Model (Infant Siler + Adult Gompertz)
            if c.age < 2.0:
                annual_m = (INFANT_MORTALITY_BASELINE / max(0.2, 1.0 + c.age)) * infant_sanitation_risk * infant_hosp_risk
            else:
                annual_m = GOMPERTZ_ALPHA * math.exp(min(12.0, GOMPERTZ_BETA * c.age))

            tick_hazard = annual_m * age_delta

            risk = base_hazard_mult * (1.0 / max(0.05, c.health))
            if c.hunger <= 0.05: risk *= 25.0
            if c.thirst <= 0.05: risk *= 50.0
            if c.warmth <= 0.05 and temperature_c < 0.0: risk *= 30.0
            if c.thirst <= 0.05 and temperature_c > 35.0: risk *= 20.0

            acute_hazard = 0.0
            if c.health < 0.35:
                acute_hazard += (0.35 - c.health) * 0.08 * (1.0 + hospital_overload * 2.0)
            if c.hunger <= 0.0:
                acute_hazard += 0.04
            if c.thirst <= 0.0:
                acute_hazard += 0.08
            if c.warmth <= 0.0 and temperature_c < -5.0:
                acute_hazard += 0.07

            prob_death = min(0.95, tick_hazard * risk + acute_hazard)
            if rng.random() < prob_death:
                c.is_alive = 0
                if c.age < 2.0:
                    cause = "Infant Mortality"
                    self.cumulative_infant_deaths += 1
                elif c.warmth <= 0.05 and temperature_c < 0.0:
                    cause = "Hypothermia/Extreme Cold"
                elif c.thirst <= 0.05 and temperature_c > 35.0:
                    cause = "Heatstroke/Extreme Heat"
                elif c.thirst <= 0.05:
                    cause = "Dehydration"
                elif c.hunger <= 0.05:
                    cause = "Starvation"
                elif acute_hazard > 0.0 or (hospital_overload > 0.5 and c.health < 0.35):
                    cause = "Hospital Deficit"
                elif pollution_severe:
                    cause = "Pollution"
                elif c.age >= 65.0:
                    cause = "Old Age"
                else:
                    cause = "Hospital Deficit" if hosp_risk > 2.0 else "Old Age"

                c.cause_of_death = cause
                self.deaths_by_cause[cause] = self.deaths_by_cause.get(cause, 0) + 1
                self.cumulative_deaths += 1
                new_deaths.append(c)
                continue

            # 5. Births (Hadwiger Fertility with Postpartum Cooldown)
            if c.sex == "F" and 18.0 <= c.age <= 44.0:
                if c.last_birth_tick is None or (current_tick - c.last_birth_tick) >= POSTPARTUM_COOLDOWN_TICKS:
                    diff = c.age - HADWIGER_PEAK_AGE
                    if -14.0 < diff < 14.0:
                        fert_tick = fertility_base_scale * math.exp(-(diff * diff) * 0.00501)
                        if rng.random() < fert_tick:
                            c.last_birth_tick = current_tick
                            baby_id = f"cit_{self.world_id}_b{self.cumulative_births}_{rng.randint(1000, 9999)}"
                            baby_sex = "M" if rng.random() < SEX_RATIO_AT_BIRTH_MALE else "F"
                            baby = CitizenAgent(
                                id=baby_id,
                                world_id=self.world_id,
                                name=f"Infant {baby_id[-5:]}",
                                age=0.0,
                                sex=baby_sex,
                                education=0.0,
                                health=0.96,
                                wealth=round(c.wealth * 0.2, 2),
                                household_id=c.household_id,
                                home_building_id=c.home_building_id,
                                work_building_id=None,
                                employed=0,
                                occupation="Child",
                                mood=0.90,
                                is_alive=1
                            )
                            new_births.append(baby)
                            self.cumulative_births += 1

            # 6. Education
            if 6.0 <= c.age <= 22.0:
                c.education = min(1.0, c.education + 0.0001 * ticks)

            # 7. Needs composite & mood
            min_vital = min(c.hunger, c.thirst, c.warmth)
            needs_composite = min_vital * 0.65 + ((c.hunger + c.thirst + c.warmth + c.safety) / 4.0) * 0.35
            c.mood = max(0.0, min(1.0, 0.60 * needs_composite + 0.30 * c.health + 0.10 * (0.8 if c.employed else 0.3)))

            # Accumulate living stats and cohort
            total_health += c.health
            total_mood += c.mood

            # Inline cohort classification
            age = c.age
            if age < 2.0: cohorts["Infant"] += 1
            elif age < 13.0: cohorts["Child"] += 1
            elif age < 18.0: cohorts["Youth"] += 1
            elif age < 25.0: cohorts["Young Adult"] += 1
            elif age < 55.0: cohorts["Prime Adult"] += 1
            elif age < 65.0: cohorts["Mature Adult"] += 1
            elif age < 80.0: cohorts["Senior"] += 1
            else: cohorts["Elder"] += 1

            if 18.0 <= age < 65.0:
                working_age_count += 1
                if currently_employed < jobs_capacity:
                    c.employed = 1
                    currently_employed += 1
                else:
                    c.employed = 0

        # Register births into citizens dict and cohorts
        for b in new_births:
            self.citizens[b.id] = b
            cohorts["Infant"] += 1
            total_health += b.health
            total_mood += b.mood

        surviving_count = start_population - len(new_deaths) + len(new_births)
        avg_happiness = (total_mood / max(1, surviving_count)) if surviving_count > 0 else 0.0
        unemployment_rate = float(max(0, working_age_count - currently_employed)) / max(1, working_age_count)

        # 8. Symmetric Migration
        housing_ratio = float(surviving_count) / max(1.0, float(residential_capacity))
        attractiveness = (
            (1.0 - unemployment_rate) * 0.35 +
            avg_happiness * 0.35 +
            (1.0 - min(1.0, pollution_level)) * 0.15 +
            (1.0 if housing_ratio < 1.0 else max(0.05, 1.2 - housing_ratio)) * 0.15
        )

        in_migrants = 0
        in_migrants_list: List[CitizenAgent] = []
        if attractiveness > 0.65 and surviving_count < residential_capacity:
            migration_pot = int(max(1, (residential_capacity - surviving_count) * 0.02 * (ticks / 24.0)))
            for _ in range(min(5, migration_pot)):
                mid = f"cit_{self.world_id}_m{rng.randint(10000, 99999)}"
                migrant_age = round(rng.uniform(20.0, 42.0), 1)
                emp = 1 if currently_employed < jobs_capacity else 0
                if emp: currently_employed += 1
                migrant = CitizenAgent(
                    id=mid,
                    world_id=self.world_id,
                    name=f"Migrant {mid[-4:]}",
                    age=migrant_age,
                    sex="M" if rng.random() < SEX_RATIO_AT_BIRTH_MALE else "F",
                    education=round(rng.uniform(0.4, 0.8), 2),
                    health=0.90,
                    wealth=round(rng.uniform(50.0, 200.0), 2),
                    household_id=f"hh_m_{mid[-4:]}",
                    employed=emp,
                    occupation="Skilled Worker",
                    is_alive=1
                )
                self.citizens[mid] = migrant
                in_migrants_list.append(migrant)
                in_migrants += 1
                self.cumulative_in_migrants += 1
                total_health += migrant.health
                total_mood += migrant.mood
                # Update cohort
                if migrant_age < 25.0: cohorts["Young Adult"] += 1
                else: cohorts["Prime Adult"] += 1

        # Out-migration under severe distress
        out_migrants = 0
        out_migrants_list: List[CitizenAgent] = []
        distress = (
            max(0.0, unemployment_rate - 0.20) * 0.30 +
            (0.35 if food_critical else 0.0) +
            (0.35 if water_critical else 0.0) +
            max(0.0, pollution_level - 0.50) * 0.40 +
            max(0.0, housing_ratio - 1.20) * 0.25
        )

        if distress > 0.35 and surviving_count > 0:
            out_pot = int(max(1, surviving_count * 0.02 * min(2.0, distress) * (ticks / 24.0)))
            # Sample candidates from low mood or unemployed living citizens
            candidates = [c for c in start_living if c.is_alive == 1 and (c.employed == 0 or c.mood < 0.5)]
            if not candidates:
                candidates = [c for c in start_living if c.is_alive == 1]
            candidates.sort(key=lambda x: (x.employed, x.mood))

            for out_cit in candidates[:min(len(candidates), min(5, out_pot))]:
                out_cit.is_alive = 0
                out_cit.cause_of_death = "Emigrated"
                if out_cit.id in self.citizens:
                    del self.citizens[out_cit.id]
                out_migrants_list.append(out_cit)
                out_migrants += 1
                self.cumulative_out_migrants += 1
                total_health -= out_cit.health
                total_mood -= out_cit.mood
                cohorts[out_cit.cohort] = max(0, cohorts[out_cit.cohort] - 1)

        final_count = start_population - len(new_deaths) + len(new_births) + in_migrants - out_migrants
        assert final_count == len([c for c in self.citizens.values() if c.is_alive == 1]), (
            f"Conservation discrepancy: calculated {final_count} != actual {len([c for c in self.citizens.values() if c.is_alive == 1])}"
        )
        assert sum(cohorts.values()) == final_count, (
            f"Cohort sum discrepancy: {sum(cohorts.values())} != {final_count}"
        )

        infant_deaths_step = sum(1 for d in new_deaths if d.age < 2.0)
        annual_factor = (8760.0 / max(1, ticks))

        accounting_entry = {
            "tick": current_tick,
            "ticks_advanced": ticks,
            "start_population": start_population,
            "births": len(new_births),
            "deaths": len(new_deaths),
            "in_migrants": in_migrants,
            "out_migrants": out_migrants,
            "admin_adjustments": 0,
            "end_population": final_count,
            "net_change": final_count - start_population,
            "infant_deaths": infant_deaths_step,
            "crude_birth_rate_annual_per_1000": round((len(new_births) / max(1, start_population)) * annual_factor * 1000.0, 2),
            "crude_death_rate_annual_per_1000": round((len(new_deaths) / max(1, start_population)) * annual_factor * 1000.0, 2),
            "net_migration_rate_annual_per_1000": round(((in_migrants - out_migrants) / max(1, start_population)) * annual_factor * 1000.0, 2),
            "age_cohorts": dict(cohorts),
            "deaths_by_cause": dict(self.deaths_by_cause),
            "attractiveness": round(attractiveness, 3),
            "distress": round(distress, 3)
        }
        self.last_step_accounting = accounting_entry
        self.demographic_accounting_ledger.append(accounting_entry)
        if len(self.demographic_accounting_ledger) > 200:
            self.demographic_accounting_ledger.pop(0)

        return {
            "population": final_count,
            "deaths_this_step": len(new_deaths),
            "births_this_step": len(new_births),
            "in_migrants_this_step": in_migrants,
            "out_migrants_this_step": out_migrants,
            "cumulative_deaths": self.cumulative_deaths,
            "cumulative_births": self.cumulative_births,
            "cumulative_in_migrants": self.cumulative_in_migrants,
            "cumulative_out_migrants": self.cumulative_out_migrants,
            "deaths_by_cause": dict(self.deaths_by_cause),
            "age_cohorts": dict(cohorts),
            "demographic_accounting": accounting_entry,
            "average_health": round(total_health / max(1, final_count), 3),
            "average_happiness": round(total_mood / max(1, final_count), 3),
            "unemployment_rate": round(unemployment_rate, 3),
            "employed_citizens": currently_employed,
            "dead_ids": [d.id for d in new_deaths],
            "out_migrant_ids": [o.id for o in out_migrants_list],
            "new_citizens": [b.to_dict() for b in (new_births + in_migrants_list)]
        }
