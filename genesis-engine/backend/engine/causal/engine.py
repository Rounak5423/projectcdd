"""
authoritative Causal Simulation Coupling Engine.
Enforces strict 10-stage causal propagation per tick:
1. needs / utilities -> 2. environment -> 3. health & disease ->
4. incidents -> 5. hospital & emergency -> 6. mortality & births ->
7. economy -> 8. citizen satisfaction -> 9. unrest & protest -> 10. governance feedback.
"""

import math
import os
import random
import uuid
from collections import deque
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Any

from engine.causal.config import CausalConfig, DEFAULT_CAUSAL_CONFIG
from engine.causal.state import (
    CausalVitalsSnapshot,
    DeathsByCause,
    UnmetNeeds,
    CausalNode,
    CausalLink,
    CausalTraceGraph,
    CausalEvent,
)


class CausalCouplingEngine:
    def __init__(self, config: Optional[CausalConfig] = None):
        self.config = config or DEFAULT_CAUSAL_CONFIG
        # In-memory history cache per world: world_id -> deque of snapshots
        self._vitals_history: Dict[str, deque] = {}
        self._trace_history: Dict[str, deque] = {}
        self._protest_intensity: Dict[str, float] = {}
        self._hospitalized_patients: Dict[str, float] = {}
        self._health_index: Dict[str, float] = {}
        self._birth_accumulators: Dict[str, float] = {}
        self._death_accumulators: Dict[str, float] = {}
        self.history_limit = 200

    def _get_history(self, world_id: str) -> Tuple[deque, deque]:
        if world_id not in self._vitals_history:
            self._vitals_history[world_id] = deque(maxlen=self.history_limit)
            self._trace_history[world_id] = deque(maxlen=self.history_limit)
            self._protest_intensity[world_id] = 0.0
            self._hospitalized_patients[world_id] = 0.0
            self._health_index[world_id] = 0.88
        return self._vitals_history[world_id], self._trace_history[world_id]

    def reset_world(self, world_id: str):
        """Clears cached history for a world."""
        if world_id in self._vitals_history:
            self._vitals_history[world_id].clear()
            self._trace_history[world_id].clear()
            self._protest_intensity[world_id] = 0.0
            self._hospitalized_patients[world_id] = 0.0
            self._health_index[world_id] = 0.88
            self._birth_accumulators[world_id] = 0.0
            self._death_accumulators[world_id] = 0.0

    def step(
        self,
        world_id: str,
        current_tick: int,
        year: int,
        day: int,
        population: int,
        food_stock: float,
        food_production: float,
        water_stock: float,
        water_production: float,
        energy_stock: float,
        energy_production: float,
        pollution_level: float,
        civic_stability: float,
        happiness: float,
        hospital_capacity: int = 1500,
        residential_capacity: int = 1500000,
        unemployment_rate: float = 0.05,
        ticks_passed: int = 1,
        mean_age: Optional[float] = None,
        mean_health: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Executes a single or multi-tick causal coupling step.
        Returns a dictionary containing updated population, deaths, births,
        vitals, causal trace graph, and generated causal events.
        """
        vitals_hist, trace_hist = self._get_history(world_id)

        dt = (self.config.days_per_tick * ticks_passed) / self.config.days_per_year
        days = self.config.days_per_tick * ticks_passed

        # Retrieve previous state
        prev_protest = self._protest_intensity.get(world_id, 0.0)
        baseline_patient_estimate = float(min(hospital_capacity, population * self.config.general_morbidity_rate * 4.0 / 365.0))
        prev_patients = self._hospitalized_patients.get(world_id, baseline_patient_estimate)
        prev_health = self._health_index.get(world_id, 0.88)

        # -------------------------------------------------------------
        # STAGE 1: NEEDS & UTILITIES
        # -------------------------------------------------------------
        # Daily demand per citizen
        food_demand = max(1.0, (population / 10000.0) * (days / 30.0) * 8.0)
        water_demand = max(1.0, (population / 10000.0) * (days / 30.0) * 10.0)
        energy_demand = max(1.0, (population / 10000.0) * (days / 30.0) * 6.5)

        avail_food = food_stock + food_production
        avail_water = water_stock + water_production
        avail_energy = energy_stock + energy_production

        unmet_food = max(0.0, min(1.0, (food_demand - avail_food) / food_demand)) if avail_food < food_demand else 0.0
        unmet_water = max(0.0, min(1.0, (water_demand - avail_water) / water_demand)) if avail_water < water_demand else 0.0
        unmet_energy = max(0.0, min(1.0, (energy_demand - avail_energy) / energy_demand)) if avail_energy < energy_demand else 0.0

        # Shelter need
        effective_res_cap = max(100, residential_capacity)
        unmet_shelter = max(0.0, min(1.0, (population - effective_res_cap) / population)) if population > effective_res_cap else 0.0

        # -------------------------------------------------------------
        # STAGE 2: ENVIRONMENT
        # -------------------------------------------------------------
        # Environmental health degrades with pollution
        env_health = max(0.05, min(1.0, 1.0 - (pollution_level * 0.8)))
        excess_pollution = max(0.0, pollution_level - self.config.pollution_hazard_threshold)

        # -------------------------------------------------------------
        # STAGE 3: HEALTH & DISEASE
        # -------------------------------------------------------------
        # Health deteriorates sharply under basic needs deprivation and toxic pollution
        health_delta = 0.0
        if unmet_water > 0.0:
            health_delta -= (unmet_water * 0.28 * days)  # Dehydration is acute and fast
        if unmet_food > 0.0:
            health_delta -= (unmet_food * 0.15 * days)   # Malnutrition
        if unmet_energy > 0.0:
            health_delta -= (unmet_energy * 0.05 * days)  # Hypothermia / grid failure
        if excess_pollution > 0.0:
            health_delta -= (excess_pollution * 0.08 * days)

        if unmet_water == 0.0 and unmet_food == 0.0 and excess_pollution == 0.0:
            # Gradual biological recovery toward baseline 0.90
            health_delta += 0.02 * days

        curr_health = max(0.08, min(0.98, prev_health + health_delta))
        self._health_index[world_id] = curr_health

        # -------------------------------------------------------------
        # STAGE 4: INCIDENTS (TRAUMA & ACCIDENTS)
        # -------------------------------------------------------------
        # Baseline incidents + safety decay from low stability/unemployment
        incident_hazard = 0.00015 * (1.0 + (1.0 - civic_stability) * 0.8 + unemployment_rate * 0.5)
        new_trauma_cases = max(0, int(population * incident_hazard * (days / 30.0)))

        # -------------------------------------------------------------
        # STAGE 5: HOSPITAL & EMERGENCY
        # -------------------------------------------------------------
        effective_hospital_cap = max(1, hospital_capacity)
        # Inflow of patients from morbidity (illness, toxicity, malnutrition) + trauma
        morbidity_inflow = population * self.config.general_morbidity_rate * (1.0 + (1.0 - curr_health) * 3.5) * (days / 365.0)
        daily_admissions = int(morbidity_inflow + new_trauma_cases)

        # Retention / discharge dynamics
        discharge_rate = 1.0 / max(1.0, self.config.hospital_bed_retention_days)
        discharged_patients = prev_patients * discharge_rate * days
        curr_active_patients = max(0.0, prev_patients - discharged_patients + daily_admissions)
        self._hospitalized_patients[world_id] = curr_active_patients

        bed_occupancy_pct = (curr_active_patients / float(effective_hospital_cap)) * 100.0
        overflow_patients = max(0, int(curr_active_patients - effective_hospital_cap))
        unmet_healthcare = min(1.0, overflow_patients / max(1.0, curr_active_patients)) if overflow_patients > 0 else 0.0

        # -------------------------------------------------------------
        # STAGE 6: MORTALITY & BIRTHS
        # -------------------------------------------------------------
        # 6a. Crude Births (calibrated to real UN CBR range 10-25 per 1,000/yr)
        cbr_rate = self.config.baseline_crude_birth_rate / 1000.0
        # Births decrease during famine, dehydration, or extreme unrest
        fertility_modifier = (curr_health / 0.88) * (0.5 + 0.5 * civic_stability)
        raw_births = population * cbr_rate * dt * fertility_modifier
        accum_b = self._birth_accumulators.get(world_id, 0.0) + raw_births
        births = int(accum_b)
        self._birth_accumulators[world_id] = accum_b - births

        # 6b. Baseline Gompertz/Natural Mortality
        # Calibrated baseline CDR ~ 7.8 per 1,000/yr
        cdr_rate = self.config.baseline_crude_death_rate / 1000.0
        ml_hazard_multiplier = 1.0

        effective_age = mean_age if mean_age is not None else 42.0
        effective_health = mean_health if mean_health is not None else curr_health

        # Query ML inference model if enabled
        if os.environ.get("ML_ENABLED", "false").lower() in ("1", "true", "yes"):
            try:
                from ml.inference.registry import calculate_gompertz_mortality_hazard
                ml_inferred = calculate_gompertz_mortality_hazard(age=effective_age, health=effective_health)
                # Bounded strictly within [0.70, 1.40] for numerical stability
                ml_hazard_multiplier = max(
                    self.config.ml_hazard_min_bound,
                    min(self.config.ml_hazard_max_bound, ml_inferred / 0.008)
                )
            except Exception:
                ml_hazard_multiplier = 1.0

        raw_aging_deaths = population * cdr_rate * dt * ml_hazard_multiplier
        accum_d = self._death_accumulators.get(world_id, 0.0) + raw_aging_deaths
        baseline_aging_deaths = int(accum_d)
        self._death_accumulators[world_id] = accum_d - baseline_aging_deaths

        # 6c. Specific Causal Hazards
        # Starvation
        starvation_deaths = 0
        if unmet_food > 0.0:
            starv_rate = self.config.starvation_hazard_coeff * (unmet_food ** 1.5) * days
            starvation_deaths = int(round(population * starv_rate))

        # Dehydration (acute mortality)
        dehydration_deaths = 0
        if unmet_water > 0.0:
            dehyd_rate = self.config.dehydration_hazard_coeff * (unmet_water ** 1.3) * days
            dehydration_deaths = int(round(population * dehyd_rate))

        # Hospital Overload (lack of critical care when occupancy > 100%)
        hospital_overload_deaths = 0
        if overflow_patients > 0:
            hospital_overload_deaths = int(round(overflow_patients * self.config.hospital_overload_fatality_rate * days))

        # Pollution Toxicity Deaths
        pollution_deaths = 0
        if excess_pollution > 0.0:
            poll_rate = self.config.pollution_hazard_coeff * excess_pollution * days
            pollution_deaths = int(round(population * poll_rate))

        # Severe Trauma Deaths
        trauma_deaths = int(round(new_trauma_cases * 0.06))

        # Total deaths breakdown
        deaths_by_cause = DeathsByCause(
            aging=baseline_aging_deaths,
            starvation=starvation_deaths,
            dehydration=dehydration_deaths,
            hospital_overload=hospital_overload_deaths,
            pollution=pollution_deaths,
            trauma=trauma_deaths,
        )
        total_deaths = min(population, deaths_by_cause.total())

        # Net population update (strictly causal: pop + births - deaths)
        new_population = max(0, population + births - total_deaths)

        # -------------------------------------------------------------
        # STAGE 7: ECONOMY FEEDBACK
        # -------------------------------------------------------------
        # Productive workforce ratio is curtailed by disease and mortality
        labor_participation = max(0.20, curr_health * 0.95)

        # -------------------------------------------------------------
        # STAGE 8: CITIZEN SATISFACTION (HAPPINESS & STABILITY)
        # -------------------------------------------------------------
        unmet_needs = UnmetNeeds(
            food=unmet_food,
            water=unmet_water,
            energy=unmet_energy,
            healthcare=unmet_healthcare,
            shelter=unmet_shelter,
        )

        # Dynamic composite happiness
        needs_satisfaction = 1.0 - (
            unmet_food * 0.35 +
            unmet_water * 0.35 +
            unmet_energy * 0.15 +
            unmet_healthcare * 0.10 +
            unmet_shelter * 0.05
        )
        target_happiness = max(0.04, min(0.98,
            needs_satisfaction * 0.50 +
            curr_health * 0.25 +
            civic_stability * 0.15 +
            env_health * 0.10
        ))
        new_happiness = max(0.05, min(0.98, happiness * 0.6 + target_happiness * 0.4))

        # Grievance score driving civic unrest
        grievance = max(0.0, min(1.0,
            (1.0 - new_happiness) * 0.55 +
            (1.0 - civic_stability) * 0.25 +
            unmet_food * 0.50 +
            unmet_water * 0.60 +
            (1.0 if bed_occupancy_pct > 120.0 else 0.0) * 0.20
        ))

        # -------------------------------------------------------------
        # STAGE 9: UNREST & PROTEST CONTAGION
        # -------------------------------------------------------------
        new_events: List[CausalEvent] = []
        if grievance > self.config.grievance_protest_threshold:
            excess_grievance = grievance - self.config.grievance_protest_threshold
            new_protest_intensity = min(1.0, prev_protest * 0.65 + excess_grievance * self.config.protest_contagion_rate + 0.12)
            # Civic stability erodes
            new_stability = max(0.08, civic_stability - (new_protest_intensity * 0.08 * days))

            # Trigger protest events on threshold crossings
            if prev_protest < 0.30 and new_protest_intensity >= 0.30:
                new_events.append(CausalEvent(
                    id=f"evt_protest_{uuid.uuid4().hex[:8]}",
                    world_id=world_id,
                    year=year,
                    day=day,
                    tick=current_tick + ticks_passed,
                    category="protest",
                    title="Civil Protest Erupts",
                    severity="warning",
                    description=f"Widespread dissatisfaction over {'unmet food supply' if unmet_food > 0 else 'living conditions'} has sparked demonstrations across the central district.",
                    metadata={"grievance": grievance, "intensity": new_protest_intensity}
                ))
            elif prev_protest < 0.70 and new_protest_intensity >= 0.70:
                new_events.append(CausalEvent(
                    id=f"evt_unrest_{uuid.uuid4().hex[:8]}",
                    world_id=world_id,
                    year=year,
                    day=day,
                    tick=current_tick + ticks_passed,
                    category="civil_unrest",
                    title="Mass Civil Unrest Declared",
                    severity="critical",
                    description=f"Mass strikes and unrest with protest intensity at {int(new_protest_intensity * 100)}%. Critical public services threatened.",
                    metadata={"grievance": grievance, "intensity": new_protest_intensity}
                ))
        else:
            # De-escalation
            new_protest_intensity = max(0.0, prev_protest * (1.0 - self.config.protest_decay_rate) - 0.05)
            new_stability = min(0.96, civic_stability + 0.015 * days)

        self._protest_intensity[world_id] = new_protest_intensity
        protest_participants = int(new_population * new_protest_intensity * self.config.protest_mobilization_ratio)

        # Hospital overload emergency event
        if bed_occupancy_pct > 105.0 and overflow_patients > 10:
            new_events.append(CausalEvent(
                id=f"evt_hosp_{uuid.uuid4().hex[:8]}",
                world_id=world_id,
                year=year,
                day=day,
                tick=current_tick + ticks_passed,
                category="healthcare_emergency",
                title="Hospital Capacity Saturated",
                severity="emergency",
                description=f"Hospital bed occupancy reached {bed_occupancy_pct:.1f}% ({overflow_patients} overflow patients). Emergency triage active.",
                metadata={"occupancy_pct": bed_occupancy_pct, "overflow": overflow_patients}
            ))

        # Starvation crisis event
        if starvation_deaths > 5:
            new_events.append(CausalEvent(
                id=f"evt_starv_{uuid.uuid4().hex[:8]}",
                world_id=world_id,
                year=year,
                day=day,
                tick=current_tick + ticks_passed,
                category="humanitarian_crisis",
                title="Famine Alert: Starvation Casualties",
                severity="critical",
                description=f"Food shortages have claimed {starvation_deaths} lives this cycle. Emergency grain release recommended.",
                metadata={"starvation_deaths": starvation_deaths, "unmet_food": unmet_food}
            ))

        # -------------------------------------------------------------
        # STAGE 10: GOVERNANCE FEEDBACK & TRACE GRAPH SYNTHESIS
        # -------------------------------------------------------------
        now_str = datetime.now(timezone.utc).isoformat()
        vitals_snapshot = CausalVitalsSnapshot(
            world_id=world_id,
            tick=current_tick + ticks_passed,
            year=year,
            day=day,
            population=new_population,
            births=births,
            deaths=total_deaths,
            deaths_by_cause=deaths_by_cause,
            unmet_needs=unmet_needs,
            health_index=round(curr_health, 3),
            hospital_admissions=daily_admissions,
            bed_capacity=effective_hospital_cap,
            bed_occupancy_pct=round(bed_occupancy_pct, 1),
            overflow_patients=overflow_patients,
            protest_intensity=round(new_protest_intensity, 3),
            protest_participants=protest_participants,
            grievance_score=round(grievance, 3),
            happiness=round(new_happiness, 3),
            civic_stability=round(new_stability, 3),
            environmental_health=round(env_health, 3),
            created_at=now_str
        )

        trace_graph = self._build_trace_graph(
            world_id=world_id,
            tick=current_tick + ticks_passed,
            year=year,
            day=day,
            vitals=vitals_snapshot,
            food_stock=food_stock,
            water_stock=water_stock,
            energy_stock=energy_stock,
            pollution_level=pollution_level,
        )

        # Store in circular buffers
        vitals_hist.append(vitals_snapshot)
        trace_hist.append(trace_graph)

        return {
            "new_population": new_population,
            "births": births,
            "deaths": total_deaths,
            "deaths_by_cause": deaths_by_cause.model_dump(),
            "unmet_needs": unmet_needs.model_dump(),
            "health_index": round(curr_health, 3),
            "hospital_occupancy_pct": round(bed_occupancy_pct, 1),
            "overflow_patients": overflow_patients,
            "protest_intensity": round(new_protest_intensity, 3),
            "protest_participants": protest_participants,
            "grievance_score": round(grievance, 3),
            "happiness": round(new_happiness, 3),
            "civic_stability": round(new_stability, 3),
            "environmental_health": round(env_health, 3),
            "events": [e.model_dump() for e in new_events],
            "vitals": vitals_snapshot.model_dump(),
            "trace_graph": trace_graph.model_dump()
        }

    def _build_trace_graph(
        self,
        world_id: str,
        tick: int,
        year: int,
        day: int,
        vitals: CausalVitalsSnapshot,
        food_stock: float,
        water_stock: float,
        energy_stock: float,
        pollution_level: float,
    ) -> CausalTraceGraph:
        """Constructs an interactive causal graph node-and-link model."""
        nodes: List[CausalNode] = [
            CausalNode(
                id="node_needs",
                label="Resource Stock & Basic Needs",
                category="utilities",
                value=round(1.0 - (vitals.unmet_needs.food + vitals.unmet_needs.water) / 2.0, 2),
                display_value=f"Food: {int(food_stock)} | Water: {int(water_stock)}",
                unit="units",
                status="critical" if (vitals.unmet_needs.food > 0.1 or vitals.unmet_needs.water > 0.1) else "normal",
                description="Supply vs demand for food, potable water, and electricity."
            ),
            CausalNode(
                id="node_environment",
                label="Environmental Health & Pollution",
                category="environment",
                value=round(vitals.environmental_health, 2),
                display_value=f"{int(vitals.environmental_health * 100)}%",
                unit="index",
                status="warning" if pollution_level > 0.3 else "normal",
                description="Air & soil quality impacting respiratory and cardiorespiratory health."
            ),
            CausalNode(
                id="node_health",
                label="Population Health Index",
                category="health",
                value=round(vitals.health_index, 2),
                display_value=f"{int(vitals.health_index * 100)}%",
                unit="index",
                status="critical" if vitals.health_index < 0.6 else ("warning" if vitals.health_index < 0.8 else "normal"),
                description="Aggregate biological vitality driven by hydration, nutrition, and sanitation."
            ),
            CausalNode(
                id="node_hospitals",
                label="Healthcare & Hospital System",
                category="healthcare",
                value=round(vitals.bed_occupancy_pct, 1),
                display_value=f"{vitals.bed_occupancy_pct:.1f}% ({vitals.overflow_patients} overflow)",
                unit="%",
                status="critical" if vitals.bed_occupancy_pct > 100.0 else ("warning" if vitals.bed_occupancy_pct > 85.0 else "normal"),
                description="Inpatient bed occupancy, emergency triage, and treatment capacity."
            ),
            CausalNode(
                id="node_mortality",
                label="Mortality & Demographic Vitality",
                category="demographics",
                value=float(vitals.deaths),
                display_value=f"{vitals.deaths} deaths | {vitals.births} births",
                unit="persons/day",
                status="critical" if vitals.deaths > vitals.births * 2 else "normal",
                description="Cumulative daily mortality across aging, famine, overload, and trauma."
            ),
            CausalNode(
                id="node_satisfaction",
                label="Citizen Happiness & Welfare",
                category="satisfaction",
                value=round(vitals.happiness, 2),
                display_value=f"{int(vitals.happiness * 100)}%",
                unit="index",
                status="critical" if vitals.happiness < 0.4 else "normal",
                description="Citizen satisfaction derived from basic needs fulfillment and safety."
            ),
            CausalNode(
                id="node_unrest",
                label="Protest Intensity & Grievance",
                category="civic",
                value=round(vitals.protest_intensity, 2),
                display_value=f"{int(vitals.protest_intensity * 100)}% ({vitals.protest_participants:,} marching)",
                unit="index",
                status="critical" if vitals.protest_intensity > 0.6 else ("warning" if vitals.protest_intensity > 0.3 else "normal"),
                description="Mobilization of public demonstrations and civil disruption."
            ),
        ]

        # Causal edges with real dynamic link weights
        links: List[CausalLink] = [
            CausalLink(
                source="node_needs",
                target="node_health",
                strength=round(-(vitals.unmet_needs.food * 0.4 + vitals.unmet_needs.water * 0.6), 2) if (vitals.unmet_needs.food > 0 or vitals.unmet_needs.water > 0) else 0.8,
                impact="aggravating" if (vitals.unmet_needs.food > 0 or vitals.unmet_needs.water > 0) else "mitigating",
                description="Food and water deprivation degrade baseline health."
            ),
            CausalLink(
                source="node_environment",
                target="node_health",
                strength=round(vitals.environmental_health - 0.5, 2),
                impact="aggravating" if pollution_level > 0.3 else "mitigating",
                description="Pollution exposure introduces chronic respiratory stress."
            ),
            CausalLink(
                source="node_health",
                target="node_hospitals",
                strength=round((1.0 - vitals.health_index) * 1.5, 2),
                impact="aggravating" if vitals.health_index < 0.75 else "neutral",
                description="Illness and acute malnutrition drive hospital admission surges."
            ),
            CausalLink(
                source="node_hospitals",
                target="node_mortality",
                strength=round(min(1.0, vitals.bed_occupancy_pct / 100.0), 2),
                impact="aggravating" if vitals.bed_occupancy_pct > 100.0 else "mitigating",
                description="Saturated hospitals with overflow increase preventable deaths."
            ),
            CausalLink(
                source="node_needs",
                target="node_satisfaction",
                strength=round(-(vitals.unmet_needs.food + vitals.unmet_needs.water), 2) if (vitals.unmet_needs.food > 0 or vitals.unmet_needs.water > 0) else 0.75,
                impact="aggravating" if (vitals.unmet_needs.food > 0 or vitals.unmet_needs.water > 0) else "mitigating",
                description="Shortages directly collapse citizen quality of life."
            ),
            CausalLink(
                source="node_satisfaction",
                target="node_unrest",
                strength=round((1.0 - vitals.happiness) * 1.2, 2),
                impact="aggravating" if vitals.happiness < 0.55 else "mitigating",
                description="Unmet expectations and grievances trigger civil demonstration contagion."
            ),
            CausalLink(
                source="node_mortality",
                target="node_unrest",
                strength=0.8 if (vitals.deaths_by_cause.starvation > 0 or vitals.deaths_by_cause.hospital_overload > 0) else 0.1,
                impact="aggravating" if (vitals.deaths_by_cause.starvation > 0 or vitals.deaths_by_cause.hospital_overload > 0) else "neutral",
                description="Excess preventable deaths fuel public outrage against administration."
            ),
        ]

        factors = []
        if vitals.deaths_by_cause.starvation > 0:
            factors.append(f"Starvation ({vitals.deaths_by_cause.starvation} casualties)")
        if vitals.deaths_by_cause.dehydration > 0:
            factors.append(f"Dehydration ({vitals.deaths_by_cause.dehydration} casualties)")
        if vitals.deaths_by_cause.hospital_overload > 0:
            factors.append(f"Hospital bed shortage ({vitals.deaths_by_cause.hospital_overload} casualties)")
        if vitals.protest_intensity > 0.3:
            factors.append(f"Civil protests ({int(vitals.protest_intensity * 100)}% intensity)")

        summary = (
            f"Tick {tick}: Vital signs coupled. Births: {vitals.births:,}, Deaths: {vitals.deaths:,} "
            f"(Starvation: {vitals.deaths_by_cause.starvation}, Hospital Overload: {vitals.deaths_by_cause.hospital_overload}). "
            f"Bed Occupancy: {vitals.bed_occupancy_pct}%. Protest Intensity: {int(vitals.protest_intensity * 100)}%."
        )

        return CausalTraceGraph(
            world_id=world_id,
            tick=tick,
            year=year,
            day=day,
            nodes=nodes,
            links=links,
            summary=summary,
            contributing_factors=factors
        )

    def get_vitals_history(self, world_id: str, limit: int = 100) -> List[CausalVitalsSnapshot]:
        """Returns the recent vitals snapshots for a world."""
        vitals_hist, _ = self._get_history(world_id)
        items = list(vitals_hist)
        return items[-limit:]

    def get_causal_trace(self, world_id: str) -> Optional[CausalTraceGraph]:
        """Returns the most recent causal trace graph for a world."""
        _, trace_hist = self._get_history(world_id)
        if trace_hist:
            return trace_hist[-1]
        return None


# Global singleton instance for the backend runtime
global_causal_engine = CausalCouplingEngine()
