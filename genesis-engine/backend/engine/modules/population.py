"""
GENESIS Engine v2.0 - Population Subsystem Module
Module: engine.modules.population
Authoritative agent demographics, Gompertz mortality with cause logging,
Hadwiger fertility, migration, employment matching, education pipeline, and needs.
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
    POLLUTION_HEALTH_DECAY
)


class CitizenAgent:
    """Agent representation for individual citizens."""
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
        is_alive: int = 1
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

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "world_id": self.world_id,
            "name": self.name,
            "age": round(self.age, 2),
            "sex": self.sex,
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
            "cause_of_death": self.cause_of_death
        }


class PopulationModule:
    """
    Simulates the living populace of the civilisation with entity-level integrity.
    """
    def __init__(self, world_id: str):
        self.world_id = world_id
        self.citizens: Dict[str, CitizenAgent] = {}
        self.deaths_by_cause: Dict[str, int] = {
            "Old Age": 0,
            "Starvation": 0,
            "Dehydration": 0,
            "Pollution": 0,
            "Hospital Deficit": 0,
            "Accident": 0
        }
        self.cumulative_births = 0
        self.cumulative_deaths = 0

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
                is_alive=int(r.get("is_alive", 1))
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
        rng: Optional[random.Random] = None
    ) -> Dict[str, Any]:
        """
        Advances all citizens by N ticks according to causal biology and demographics.
        """
        if rng is None:
            rng = random.Random(42)
        if policy_multipliers is None:
            policy_multipliers = {}

        mortality_policy_mult = policy_multipliers.get("mortality_multiplier", 1.0)
        health_policy_bonus = policy_multipliers.get("health_bonus", 0.0)

        living = [c for c in self.citizens.values() if c.is_alive == 1]
        living_count = len(living)

        # Hospital overload factor
        ill_or_injured = [c for c in living if c.health < 0.40]
        hospital_overload = max(0.0, (len(ill_or_injured) - hospital_capacity) / max(1, hospital_capacity))

        new_deaths: List[CitizenAgent] = []
        new_births: List[CitizenAgent] = []

        # Age step size: ticks sim hours = ticks / 8760 years
        age_delta = float(ticks) / 8760.0

        for c in living:
            # 1. Advance age
            c.age += age_delta

            # 2. Needs update
            if food_available_ratio < 0.2:
                c.hunger = max(0.0, c.hunger - STARVATION_HEALTH_DECAY * 2.5 * ticks)
            elif c.hunger < 1.0:
                c.hunger = min(1.0, c.hunger + 0.05 * ticks)

            if water_available_ratio < 0.2:
                c.thirst = max(0.0, c.thirst - DEHYDRATION_HEALTH_DECAY * 2.5 * ticks)
            elif c.thirst < 1.0:
                c.thirst = min(1.0, c.thirst + 0.08 * ticks)

            if energy_available_ratio < 0.2:
                c.warmth = max(0.0, c.warmth - 0.01 * ticks)
            elif c.warmth < 1.0:
                c.warmth = min(1.0, c.warmth + 0.05 * ticks)

            # 3. Health progression
            health_delta = 0.0
            if c.hunger < 0.2:
                health_delta -= STARVATION_HEALTH_DECAY * ticks
            if c.thirst < 0.2:
                health_delta -= DEHYDRATION_HEALTH_DECAY * ticks
            if pollution_level > 0.4:
                health_delta -= (pollution_level - 0.4) * POLLUTION_HEALTH_DECAY * ticks

            if food_available_ratio >= 0.8 and water_available_ratio >= 0.8 and energy_available_ratio >= 0.8:
                if c.health < 1.0:
                    health_delta += 0.005 * ticks

            c.health = max(0.01, min(1.0, c.health + health_delta + health_policy_bonus * 0.01 * ticks))

            # 4. Gompertz mortality with cause diagnosis
            # Annual baseline Gompertz hazard: m(x) = alpha * exp(beta * x)
            annual_m = GOMPERTZ_ALPHA * math.exp(min(12.0, GOMPERTZ_BETA * c.age))
            tick_hazard = 1.0 - math.pow(max(0.0, 1.0 - annual_m), float(ticks) / 8760.0)

            # Risk multipliers
            health_risk = 1.0 / max(0.05, c.health)
            env_risk = 1.0 + max(0.0, pollution_level) * 1.5
            hosp_risk = 1.0 + hospital_overload * 3.0
            starvation_risk = 25.0 if c.hunger <= 0.05 else 1.0
            dehydration_risk = 50.0 if c.thirst <= 0.05 else 1.0

            # Acute failure hazard under unmanaged trauma/critical health or active famine
            acute_hazard = 0.0
            if c.health < 0.35:
                acute_hazard = (0.35 - c.health) * 0.08 * (1.0 + hospital_overload * 2.0)
            if c.hunger <= 0.0:
                acute_hazard += 0.04  # ~4% hourly failure under complete starvation exhaustion
            if c.thirst <= 0.0:
                acute_hazard += 0.08  # ~8% hourly failure under complete dehydration

            total_hazard = (tick_hazard * health_risk * env_risk * hosp_risk * starvation_risk * dehydration_risk * mortality_policy_mult) + acute_hazard
            # Cap maximum single-step death probability at 0.95
            prob_death = min(0.95, total_hazard)

            if rng.random() < prob_death:
                c.is_alive = 0
                if c.thirst <= 0.05:
                    cause = "Dehydration"
                elif c.hunger <= 0.05:
                    cause = "Starvation"
                elif acute_hazard > 0.0 or (hospital_overload > 0.5 and c.health < 0.35):
                    cause = "Hospital Deficit"
                elif pollution_level > 0.6:
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

            # 5. Births (Hadwiger fertility model for reproductive age females)
            if c.sex == "F" and 18.0 <= c.age <= 44.0 and living_count < residential_capacity * 1.2:
                # Hadwiger curve approx peaking around age 28
                t = c.age - 18.0
                fertility_annual = 0.12 * math.exp(-((t - 10.0) ** 2) / 36.0)
                # Multipliers: food, water, healthcare
                fertility_annual *= min(1.0, food_available_ratio) * min(1.0, water_available_ratio)
                fert_tick = fertility_annual * (float(ticks) / 8760.0)
                if rng.random() < fert_tick:
                    baby_id = f"cit_{self.world_id}_b{self.cumulative_births}_{rng.randint(1000, 9999)}"
                    baby = CitizenAgent(
                        id=baby_id,
                        world_id=self.world_id,
                        name=f"Infant {baby_id[-5:]}",
                        age=0.0,
                        sex="F" if rng.random() < 0.50 else "M",
                        education=0.0,
                        health=0.95,
                        wealth=round(c.wealth * 0.2, 2),
                        household_id=c.household_id,
                        home_building_id=c.home_building_id,
                        work_building_id=None,
                        employed=0,
                        occupation="Child",
                        mood=0.90
                    )
                    new_births.append(baby)
                    self.cumulative_births += 1

            # 6. Education pipeline
            if 6.0 <= c.age <= 22.0:
                c.education = min(1.0, c.education + 0.0001 * ticks)

            # 7. Mood / Satisfaction (Non-compensatory biological needs)
            min_vital = min(c.hunger, c.thirst, c.warmth)
            needs_composite = min_vital * 0.65 + ((c.hunger + c.thirst + c.warmth + c.safety) / 4.0) * 0.35
            c.mood = max(0.0, min(1.0, 0.60 * needs_composite + 0.30 * c.health + 0.10 * (0.8 if c.employed else 0.3)))

        # Register new births
        for b in new_births:
            self.citizens[b.id] = b

        # 8. Migration (City Attractiveness)
        active_living = [c for c in self.citizens.values() if c.is_alive == 1]
        active_count = len(active_living)
        avg_happiness = sum(c.mood for c in active_living) / max(1, active_count)
        avg_health = sum(c.health for c in active_living) / max(1, active_count)

        working_age = [c for c in active_living if 18.0 <= c.age < 65.0]
        # Match employment
        currently_employed = 0
        for w in working_age:
            if currently_employed < jobs_capacity:
                w.employed = 1
                currently_employed += 1
            else:
                w.employed = 0

        unemployed_count = max(0, len(working_age) - currently_employed)
        unemployment_rate = float(unemployed_count) / max(1, len(working_age))

        attractiveness = (
            (1.0 - unemployment_rate) * 0.35 +
            avg_happiness * 0.35 +
            (1.0 - min(1.0, pollution_level)) * 0.15 +
            (1.0 if residential_capacity > active_count else 0.2) * 0.15
        )

        in_migrants = 0
        if attractiveness > 0.65 and active_count < residential_capacity:
            # Influx
            migration_pot = int(max(1, (residential_capacity - active_count) * 0.02 * (ticks / 24.0)))
            for _ in range(min(5, migration_pot)):
                mid = f"cit_{self.world_id}_m{rng.randint(10000, 99999)}"
                migrant = CitizenAgent(
                    id=mid,
                    world_id=self.world_id,
                    name=f"Migrant {mid[-4:]}",
                    age=round(rng.uniform(20.0, 42.0), 1),
                    sex="F" if rng.random() < 0.5 else "M",
                    education=round(rng.uniform(0.4, 0.8), 2),
                    health=0.90,
                    wealth=round(rng.uniform(50.0, 200.0), 2),
                    household_id=f"hh_m_{mid[-4:]}",
                    employed=1 if currently_employed < jobs_capacity else 0,
                    occupation="Skilled Worker"
                )
                self.citizens[mid] = migrant
                in_migrants += 1

        final_living = [c for c in self.citizens.values() if c.is_alive == 1]
        final_count = len(final_living)

        return {
            "population": final_count,
            "deaths_this_step": len(new_deaths),
            "births_this_step": len(new_births),
            "in_migrants_this_step": in_migrants,
            "cumulative_deaths": self.cumulative_deaths,
            "cumulative_births": self.cumulative_births,
            "deaths_by_cause": dict(self.deaths_by_cause),
            "average_health": round(sum(c.health for c in final_living) / max(1, final_count), 3),
            "average_happiness": round(sum(c.mood for c in final_living) / max(1, final_count), 3),
            "unemployment_rate": round(unemployment_rate, 3),
            "employed_citizens": currently_employed,
            "dead_ids": [d.id for d in new_deaths],
            "new_citizens": [b.to_dict() for b in (new_births + [self.citizens[k] for k in list(self.citizens.keys())[-in_migrants:] if in_migrants > 0])]
        }
