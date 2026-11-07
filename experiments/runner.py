"""Configurable Experiment Runner and Comparative Scenario Simulator (Module 7)."""

from typing import Dict, Any, List
from pydantic import BaseModel, Field

from genesis.core.civilisation import CivilisationConfig, ClimateType, SocialStructure
from genesis.core.engine import SimulationEngine
from genesis.knowledge.database import get_default_knowledge_registry


class ScenarioResult(BaseModel):
    scenario_name: str
    ticks_run: int
    final_population: int
    total_births: int
    total_deaths: int
    final_avg_iq: float
    technologies_mastered: int
    technology_titles: List[str]
    remaining_food_stock: float
    remaining_water_stock: float
    governance_reserves: float


class ComparativeExperimentReport(BaseModel):
    scenarios: List[ScenarioResult] = Field(default_factory=list)

    def print_comparison(self) -> str:
        lines = []
        lines.append("=" * 80)
        lines.append(f"{'GENESIS COMPARATIVE EXPERIMENT SUMMARY':^80}")
        lines.append("=" * 80)
        lines.append(f"{'Metric':<28} | " + " | ".join(f"{s.scenario_name[:22]:<22}" for s in self.scenarios))
        lines.append("-" * 80)
        lines.append(f"{'Ticks Simulated':<28} | " + " | ".join(f"{s.ticks_run:<22}" for s in self.scenarios))
        lines.append(f"{'Surviving Population':<28} | " + " | ".join(f"{s.final_population:<22}" for s in self.scenarios))
        lines.append(f"{'Births / Deaths':<28} | " + " | ".join(f"{s.total_births} / {s.total_deaths:<18}" for s in self.scenarios))
        lines.append(f"{'Average Intelligence':<28} | " + " | ".join(f"{s.final_avg_iq:<22.1f}" for s in self.scenarios))
        lines.append(f"{'Technologies Unlocked':<28} | " + " | ".join(f"{s.technologies_mastered:<22}" for s in self.scenarios))
        lines.append(f"{'Remaining Food Supply':<28} | " + " | ".join(f"{s.remaining_food_stock:<22.1f}" for s in self.scenarios))
        lines.append(f"{'Public Reserves':<28} | " + " | ".join(f"{s.governance_reserves:<22.1f}" for s in self.scenarios))
        lines.append("=" * 80)
        return "\n".join(lines)


def run_comparative_experiment(ticks: int = 40, seed: int = 42) -> ComparativeExperimentReport:
    """Executes the canonical benchmark:

    Scenario A: High Intelligence (μ=120) & Abundant Resources (Fertile River Valley).
    Scenario B: Lower Intelligence (μ=80) & Limited Resources (Arid Desert).
    """
    registry = get_default_knowledge_registry()

    # Scenario A
    config_a = CivilisationConfig(
        name="Scenario A (Abundance & High IQ)",
        initial_population=20,
        intelligence_mean=120.0,
        intelligence_std_dev=10.0,
        climate=ClimateType.FERTILE_RIVER_VALLEY,
        initial_food=350.0,
        initial_water=450.0,
        social_structure=SocialStructure.EGALITARIAN_TRIBE,
        seed=seed,
    )
    engine_a = SimulationEngine(config=config_a, knowledge_registry=registry)
    engine_a.run(ticks)
    latest_a = engine_a.metrics.get_latest()

    result_a = ScenarioResult(
        scenario_name="Scenario A (Abundance)",
        ticks_run=ticks,
        final_population=latest_a.living_population if latest_a else 0,
        total_births=engine_a.total_births,
        total_deaths=engine_a.total_deaths,
        final_avg_iq=latest_a.average_intelligence if latest_a else 0.0,
        technologies_mastered=len(engine_a.unlocked_technologies),
        technology_titles=[registry.get(t).title for t in engine_a.unlocked_technologies if registry.get(t)],
        remaining_food_stock=latest_a.env_food_stock if latest_a else 0.0,
        remaining_water_stock=latest_a.env_water_stock if latest_a else 0.0,
        governance_reserves=latest_a.gov_food_reserve if latest_a else 0.0,
    )

    # Scenario B
    config_b = CivilisationConfig(
        name="Scenario B (Scarcity & Lower IQ)",
        initial_population=20,
        intelligence_mean=80.0,
        intelligence_std_dev=10.0,
        climate=ClimateType.ARID_DESERT,
        initial_food=100.0,
        initial_water=100.0,
        social_structure=SocialStructure.HIERARCHICAL_CHIEFDOM,
        seed=seed,
    )
    engine_b = SimulationEngine(config=config_b, knowledge_registry=registry)
    engine_b.run(ticks)
    latest_b = engine_b.metrics.get_latest()

    result_b = ScenarioResult(
        scenario_name="Scenario B (Scarcity)",
        ticks_run=ticks,
        final_population=latest_b.living_population if latest_b else 0,
        total_births=engine_b.total_births,
        total_deaths=engine_b.total_deaths,
        final_avg_iq=latest_b.average_intelligence if latest_b else 0.0,
        technologies_mastered=len(engine_b.unlocked_technologies),
        technology_titles=[registry.get(t).title for t in engine_b.unlocked_technologies if registry.get(t)],
        remaining_food_stock=latest_b.env_food_stock if latest_b else 0.0,
        remaining_water_stock=latest_b.env_water_stock if latest_b else 0.0,
        governance_reserves=latest_b.gov_food_reserve if latest_b else 0.0,
    )

    return ComparativeExperimentReport(scenarios=[result_a, result_b])
