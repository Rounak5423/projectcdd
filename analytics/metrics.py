"""Analytics Aggregator and Historical Telemetry Collector (Module H)."""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from genesis.agents.citizen import CitizenAgent
from genesis.environment.resources import EnvironmentMatrix, ResourceType
from genesis.governance.policies import GovernancePolicy


class SimulationSnapshot(BaseModel):
    """Historical telemetry record captured at an individual simulation tick."""

    tick: int
    living_population: int
    total_deaths: int
    total_births: int
    average_intelligence: float
    average_health: float
    average_hunger: float
    average_thirst: float
    
    # Environment Stocks
    env_food_stock: float
    env_water_stock: float
    env_wood_stock: float
    env_stone_stock: float
    
    # Governance Reserves
    gov_food_reserve: float
    gov_water_reserve: float
    
    # Civilisational Milestones
    unlocked_knowledge_count: int
    unlocked_knowledge_titles: List[str]
    season: str
    activity_breakdown: Dict[str, int] = Field(default_factory=dict)


class CivilisationMetricsCollector:
    """Collects and aggregates statistical time-series data for analysis and visualization."""

    def __init__(self, max_history_size: int = 1000) -> None:
        self.max_history_size = max_history_size
        self.history: List[SimulationSnapshot] = []

    def capture_tick(
        self,
        tick: int,
        citizens: List[CitizenAgent],
        environment: EnvironmentMatrix,
        governance: GovernancePolicy,
        unlocked_knowledge_titles: List[str],
        total_deaths: int,
        total_births: int,
    ) -> SimulationSnapshot:
        living = [c for c in citizens if c.alive]
        pop_count = len(living)

        avg_iq = sum(c.intelligence for c in living) / pop_count if pop_count > 0 else 0.0
        avg_health = sum(c.needs.health for c in living) / pop_count if pop_count > 0 else 0.0
        avg_hunger = sum(c.needs.hunger for c in living) / pop_count if pop_count > 0 else 0.0
        avg_thirst = sum(c.needs.thirst for c in living) / pop_count if pop_count > 0 else 0.0

        activity_breakdown: Dict[str, int] = {}
        for c in living:
            act = c.current_action
            activity_breakdown[act] = activity_breakdown.get(act, 0) + 1

        food_node = environment.resources.get(ResourceType.FOOD.value)
        water_node = environment.resources.get(ResourceType.WATER.value)
        wood_node = environment.resources.get(ResourceType.WOOD.value)
        stone_node = environment.resources.get(ResourceType.STONE.value)

        snapshot = SimulationSnapshot(
            tick=tick,
            living_population=pop_count,
            total_deaths=total_deaths,
            total_births=total_births,
            average_intelligence=round(avg_iq, 1),
            average_health=round(avg_health, 1),
            average_hunger=round(avg_hunger, 1),
            average_thirst=round(avg_thirst, 1),
            env_food_stock=round(food_node.current_stock if food_node else 0.0, 1),
            env_water_stock=round(water_node.current_stock if water_node else 0.0, 1),
            env_wood_stock=round(wood_node.current_stock if wood_node else 0.0, 1),
            env_stone_stock=round(stone_node.current_stock if stone_node else 0.0, 1),
            gov_food_reserve=round(governance.public_food_reserve, 1),
            gov_water_reserve=round(governance.public_water_reserve, 1),
            unlocked_knowledge_count=len(unlocked_knowledge_titles),
            unlocked_knowledge_titles=unlocked_knowledge_titles,
            season=environment.current_season.value,
            activity_breakdown=activity_breakdown,
        )

        self.history.append(snapshot)
        if len(self.history) > self.max_history_size:
            self.history.pop(0)

        return snapshot

    def get_latest(self) -> Optional[SimulationSnapshot]:
        return self.history[-1] if self.history else None

    def get_history(self) -> List[SimulationSnapshot]:
        return list(self.history)

    def clear(self) -> None:
        self.history.clear()
