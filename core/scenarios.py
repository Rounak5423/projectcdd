"""Adaptive AI Scenario Engine and Crisis Director.

Allows players to introduce dynamic environmental challenges and gifts (Drought, Blizzard,
Plague, Golden Age, or Natural Language Custom Prompts), and compels citizens to adapt.
"""

from enum import Enum
import uuid
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class ScenarioType(str, Enum):
    DROUGHT = "drought"
    BLIZZARD = "blizzard"
    GOLDEN_AGE = "golden_age"
    PLAGUE = "plague"
    BOUNTIFUL_HARVEST = "bountiful_harvest"
    CUSTOM = "custom"


class ActiveScenario(BaseModel):
    """An active dynamic event affecting the simulated civilisation."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4())[:8])
    scenario_type: ScenarioType
    title: str
    description: str
    duration_ticks: int = 15
    remaining_ticks: int = 15
    
    # Environmental Modifiers (multipliers on base yields and regeneration)
    food_yield_modifier: float = 1.0
    water_yield_modifier: float = 1.0
    wood_yield_modifier: float = 1.0
    health_drain_per_tick: float = 0.0
    learning_speed_modifier: float = 1.0
    
    # Behavioral Adaptation Directive
    behavioral_priority: str = "NORMAL"  # WATER_CONSERVATION, WARMTH_SHELTER, MEDICAL_EMERGENCY, RESEARCH_BOOM
    ai_story_narration: str = ""

    def tick(self) -> bool:
        """Decrements duration. Returns True if scenario has finished."""
        self.remaining_ticks -= 1
        return self.remaining_ticks <= 0


class AIScenarioDirector:
    """Interprets player scenarios and modulates simulation conditions and citizen adaptation."""

    @classmethod
    def create_scenario(
        cls,
        scenario_type: ScenarioType,
        custom_prompt: Optional[str] = None,
        duration_ticks: int = 15,
    ) -> ActiveScenario:
        """Builds an active scenario with environmental modifiers and adaptive directives."""
        if scenario_type == ScenarioType.DROUGHT:
            return ActiveScenario(
                scenario_type=ScenarioType.DROUGHT,
                title="The Great Scorching Drought",
                description="A blistering heatwave has dried the seasonal creeks. Water has become precious.",
                duration_ticks=duration_ticks,
                remaining_ticks=duration_ticks,
                food_yield_modifier=0.4,
                water_yield_modifier=0.25,
                health_drain_per_tick=0.5,
                behavioral_priority="WATER_CONSERVATION",
                ai_story_narration="The rivers have receded to mud. Citizens must dig deeper, share reserves, and prioritize water over all else.",
            )

        elif scenario_type == ScenarioType.BLIZZARD:
            return ActiveScenario(
                scenario_type=ScenarioType.BLIZZARD,
                title="The Great Winter Freeze",
                description="Permafrost blankets the land. Freezing temperatures threaten life and demand fire and shelter.",
                duration_ticks=duration_ticks,
                remaining_ticks=duration_ticks,
                food_yield_modifier=0.3,
                wood_yield_modifier=1.3,
                health_drain_per_tick=1.0,
                behavioral_priority="WARMTH_SHELTER",
                ai_story_narration="Bitter howling winds sweep the settlements. Wood for hearth fires and sturdy shelter are now paramount for survival.",
            )

        elif scenario_type == ScenarioType.PLAGUE:
            return ActiveScenario(
                scenario_type=ScenarioType.PLAGUE,
                title="Outbreak of the Marsh Fever",
                description="A virulent fever spreads among the citizens, testing natural immunity and herbal medicine.",
                duration_ticks=duration_ticks,
                remaining_ticks=duration_ticks,
                health_drain_per_tick=2.5,
                learning_speed_modifier=0.8,
                behavioral_priority="MEDICAL_EMERGENCY",
                ai_story_narration="Coughs echo through the settlement. Citizens with herbal wisdom must care for the vulnerable.",
            )

        elif scenario_type == ScenarioType.GOLDEN_AGE:
            return ActiveScenario(
                scenario_type=ScenarioType.GOLDEN_AGE,
                title="Era of Radiant Enlightenment",
                description="A peaceful epoch of clarity, abundance, and collaborative cultural curiosity.",
                duration_ticks=duration_ticks,
                remaining_ticks=duration_ticks,
                food_yield_modifier=1.6,
                water_yield_modifier=1.5,
                learning_speed_modifier=2.2,
                behavioral_priority="RESEARCH_BOOM",
                ai_story_narration="Surplus food and mild weather ignite the imagination. Scholars debate, craftspeople invent, and teachers gather eager students.",
            )

        elif scenario_type == ScenarioType.BOUNTIFUL_HARVEST:
            return ActiveScenario(
                scenario_type=ScenarioType.BOUNTIFUL_HARVEST,
                title="Bountiful Earth Miracle",
                description="Wild grains and fruit trees flourish in unprecedented abundance.",
                duration_ticks=duration_ticks,
                remaining_ticks=duration_ticks,
                food_yield_modifier=2.5,
                water_yield_modifier=1.4,
                behavioral_priority="HARVEST_FEAST",
                ai_story_narration="The fields are overflowing with grain. Granaries swell as citizens celebrate plentiful provisions.",
            )

        else:  # CUSTOM Scenario
            prompt = (custom_prompt or "An unexpected mystery arrives in the land.").strip()
            lower_p = prompt.lower()

            # Rule-based / NLP heuristic parsing of custom prompt intent
            food_mod = 1.0
            water_mod = 1.0
            wood_mod = 1.0
            health_drain = 0.0
            learning_mod = 1.0
            priority = "NORMAL"

            if any(w in lower_p for w in ["drought", "dry", "desert", "thirst", "sun"]):
                water_mod = 0.3
                food_mod = 0.5
                priority = "WATER_CONSERVATION"
            elif any(w in lower_p for w in ["freeze", "ice", "blizzard", "cold", "snow", "winter"]):
                wood_mod = 1.5
                food_mod = 0.4
                health_drain = 1.2
                priority = "WARMTH_SHELTER"
            elif any(w in lower_p for w in ["disease", "plague", "fever", "illness", "poison"]):
                health_drain = 2.0
                priority = "MEDICAL_EMERGENCY"
            elif any(w in lower_p for w in ["knowledge", "discovery", "enlightenment", "idea", "books", "alien", "meteor"]):
                learning_mod = 2.0
                priority = "RESEARCH_BOOM"
            elif any(w in lower_p for w in ["feast", "harvest", "rich", "gold", "abundance"]):
                food_mod = 2.0
                water_mod = 1.8
                priority = "HARVEST_FEAST"

            return ActiveScenario(
                scenario_type=ScenarioType.CUSTOM,
                title=f"Custom Event: {prompt[:32]}...",
                description=prompt,
                duration_ticks=duration_ticks,
                remaining_ticks=duration_ticks,
                food_yield_modifier=food_mod,
                water_yield_modifier=water_mod,
                wood_yield_modifier=wood_mod,
                health_drain_per_tick=health_drain,
                learning_speed_modifier=learning_mod,
                behavioral_priority=priority,
                ai_story_narration=f"A new reality sweeps the civilisation: '{prompt}'. The people are adapting to the challenge.",
            )
