"""Utility-Based Decision-Making Engine (Module C).

Evaluates candidate actions using bounded-rational utility functions combining
physiological drive states, personality traits, skills, environmental scarcity,
and dynamic scenario adaptation.
"""

from enum import Enum
from typing import List, Optional, Tuple, Dict, Any
from pydantic import BaseModel, Field

from genesis.agents.citizen import CitizenAgent
from genesis.environment.resources import EnvironmentMatrix, ResourceType
from genesis.knowledge.database import KnowledgeRegistry
from genesis.knowledge.models import KnowledgeNode
from genesis.agents.adaptation import get_adaptive_utility_modifiers


class ActionType(str, Enum):
    EAT = "eat"
    DRINK = "drink"
    REST = "rest"
    FORAGE_FOOD = "forage_food"
    GATHER_WATER = "gather_water"
    CHOP_WOOD = "chop_wood"
    MINE_STONE = "mine_stone"
    STUDY_KNOWLEDGE = "study_knowledge"
    TEACH_NEIGHBOR = "teach_neighbor"
    CONTRIBUTE_STOCKPILE = "contribute_stockpile"
    IDLE = "idle"


class ActionIntent(BaseModel):
    """A prioritized action selected by an agent for execution in the current tick."""

    action_type: ActionType
    utility_score: float
    target_id: Optional[str] = None
    target_knowledge: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)


class DecisionEngine:
    """Calculates action utilities and resolves autonomous agent choices."""

    @staticmethod
    def evaluate_and_select(
        agent: CitizenAgent,
        environment: EnvironmentMatrix,
        knowledge_registry: KnowledgeRegistry,
        available_peers: Optional[List[CitizenAgent]] = None,
        active_scenario_priority: str = "NORMAL",
    ) -> ActionIntent:
        """Computes utility scores across all viable actions, modified by active scenario adaptations."""
        if not agent.alive:
            return ActionIntent(action_type=ActionType.IDLE, utility_score=0.0)

        adaptive_mods = get_adaptive_utility_modifiers(active_scenario_priority)
        candidates: List[ActionIntent] = []

        # 1. Vitality: EAT from personal inventory
        if agent.inventory_food > 0.0 and agent.needs.hunger > 15.0:
            hunger_pressure = (agent.needs.hunger / 100.0) ** 1.8 * 130.0
            candidates.append(ActionIntent(action_type=ActionType.EAT, utility_score=hunger_pressure))

        # 2. Vitality: DRINK from personal inventory
        if agent.inventory_water > 0.0 and agent.needs.thirst > 15.0:
            thirst_pressure = (agent.needs.thirst / 100.0) ** 2.0 * 150.0
            candidates.append(ActionIntent(action_type=ActionType.DRINK, utility_score=thirst_pressure))

        # 3. Vitality: REST
        if agent.needs.fatigue > 40.0:
            fatigue_pressure = ((agent.needs.fatigue / 100.0) ** 1.8 * 100.0) * adaptive_mods["rest_mult"]
            candidates.append(ActionIntent(action_type=ActionType.REST, utility_score=fatigue_pressure))

        # 4. Resource Acquisition: FORAGE FOOD
        env_food = environment.resources.get(ResourceType.FOOD.value)
        if env_food and env_food.current_stock > 1.0:
            inventory_deficit = max(0.0, 10.0 - agent.inventory_food) / 10.0
            forage_utility = (
                (inventory_deficit * 60.0)
                + ((agent.needs.hunger / 100.0) * 45.0)
                + (agent.personality.conscientiousness * 15.0)
            ) * adaptive_mods["food_mult"]
            candidates.append(ActionIntent(action_type=ActionType.FORAGE_FOOD, utility_score=forage_utility))

        # 5. Resource Acquisition: GATHER WATER
        env_water = environment.resources.get(ResourceType.WATER.value)
        if env_water and env_water.current_stock > 1.0:
            water_deficit = max(0.0, 10.0 - agent.inventory_water) / 10.0
            water_utility = (
                (water_deficit * 65.0)
                + ((agent.needs.thirst / 100.0) * 55.0)
            ) * adaptive_mods["water_mult"]
            candidates.append(ActionIntent(action_type=ActionType.GATHER_WATER, utility_score=water_utility))

        # 6. Resource Acquisition: CHOP WOOD / MINE STONE (Diligence & Shelter)
        if agent.needs.hunger < 60.0 and agent.needs.thirst < 60.0 and agent.needs.fatigue < 60.0:
            wood_utility = (agent.personality.conscientiousness * 28.0) * adaptive_mods["wood_mult"]
            stone_utility = (agent.personality.conscientiousness * 22.0) * adaptive_mods["stone_mult"]
            candidates.append(ActionIntent(action_type=ActionType.CHOP_WOOD, utility_score=wood_utility))
            candidates.append(ActionIntent(action_type=ActionType.MINE_STONE, utility_score=stone_utility))

        # 7. Intellectual: STUDY KNOWLEDGE
        if agent.needs.hunger < 65.0 and agent.needs.thirst < 65.0 and agent.needs.fatigue < 70.0:
            mastered_ids = {kid for kid, m in agent.knowledge_inventory.items() if m >= 1.0}
            available_nodes = knowledge_registry.get_available_for_agent(mastered_ids)
            if available_nodes:
                chosen_node = available_nodes[0]
                study_utility = (
                    (agent.personality.openness * 55.0)
                    + ((agent.intelligence / 100.0) * 25.0)
                    - (chosen_node.difficulty * 15.0)
                ) * adaptive_mods["study_mult"]
                candidates.append(
                    ActionIntent(
                        action_type=ActionType.STUDY_KNOWLEDGE,
                        utility_score=study_utility,
                        target_knowledge=chosen_node.knowledge_id,
                    )
                )

        # 8. Social: TEACH NEIGHBOR
        if (
            available_peers
            and agent.needs.hunger < 60.0
            and agent.needs.thirst < 60.0
            and agent.personality.extraversion > 0.4
        ):
            teachable = [kid for kid, m in agent.knowledge_inventory.items() if m >= 0.7]
            if teachable:
                for peer in available_peers:
                    if peer.id != agent.id and peer.alive:
                        for kid in teachable:
                            if peer.knowledge_inventory.get(kid, 0.0) < 1.0:
                                teach_utility = (
                                    (agent.personality.extraversion * 30.0)
                                    + (agent.personality.agreeableness * 35.0)
                                ) * adaptive_mods["teach_mult"]
                                candidates.append(
                                    ActionIntent(
                                        action_type=ActionType.TEACH_NEIGHBOR,
                                        utility_score=teach_utility,
                                        target_id=peer.id,
                                        target_knowledge=kid,
                                    )
                                )
                                break

        # 9. Civic: CONTRIBUTE TO STOCKPILE
        if agent.inventory_food > 12.0 and agent.personality.agreeableness > 0.5:
            surplus = agent.inventory_food - 10.0
            civic_utility = (agent.personality.agreeableness * 30.0) + (surplus * 2.0)
            candidates.append(ActionIntent(action_type=ActionType.CONTRIBUTE_STOCKPILE, utility_score=civic_utility))

        # Default fallback
        if not candidates:
            return ActionIntent(action_type=ActionType.IDLE, utility_score=1.0)

        # Select candidate with highest utility
        selected = max(candidates, key=lambda c: c.utility_score)
        return selected
