"""Citizen Agent Definition (Module B).

Represents an individual autonomous agent with physical needs, cognitive memory,
dynamic knowledge mastery, personality-driven behavior, and adaptive thoughts.
"""

import math
import uuid
import random
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

from genesis.config import (
    DEFAULT_BASE_HUNGER_RATE,
    DEFAULT_BASE_FATIGUE_RATE,
    STARVATION_THRESHOLD,
    KNOWLEDGE_MASTERY_THRESHOLD,
    MAX_AGENT_AGE_TICKS,
)
from genesis.agents.personality import PersonalityMatrix
from genesis.agents.memory import CognitiveMemory, MemoryItem
from genesis.agents.skills import SkillInventory, SkillType
from genesis.knowledge.models import KnowledgeNode
from genesis.agents.adaptation import generate_citizen_thought


class AgentNeedState(BaseModel):
    """Dynamic physiological drive state (0.0 = satisfied, 100.0 = lethal crisis)."""

    hunger: float = Field(default=20.0, ge=0.0, le=100.0)
    thirst: float = Field(default=20.0, ge=0.0, le=100.0)
    fatigue: float = Field(default=15.0, ge=0.0, le=100.0)
    health: float = Field(default=100.0, ge=0.0, le=100.0)


class CitizenAgent(BaseModel):
    """An autonomous citizen agent in the Genesis artificial civilisation."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    age_ticks: int = Field(default=180, ge=0)  # Starting young adult (~18 in-simulation years)
    alive: bool = True
    cause_of_death: Optional[str] = None
    
    # Needs & Vitality
    needs: AgentNeedState = Field(default_factory=AgentNeedState)
    
    # Cognitive Profile
    intelligence: float = Field(default=100.0, ge=10.0, le=200.0)
    personality: PersonalityMatrix = Field(default_factory=PersonalityMatrix)
    memory: CognitiveMemory = Field(default_factory=CognitiveMemory)
    skills: SkillInventory = Field(default_factory=SkillInventory)
    
    # Knowledge Mastery: knowledge_id -> mastery score in [0.0, 1.0]
    knowledge_inventory: Dict[str, float] = Field(default_factory=dict)
    
    # Agent Personal Inventory
    inventory_food: float = Field(default=5.0, ge=0.0)
    inventory_water: float = Field(default=5.0, ge=0.0)
    inventory_wood: float = Field(default=0.0, ge=0.0)
    inventory_stone: float = Field(default=0.0, ge=0.0)

    # Activity & Dynamic Thought Bubble
    current_action: str = "idle"
    current_thought: str = "Looking forward to another productive day."
    decision_history: List[Dict[str, Any]] = Field(default_factory=list)
    learning_history: List[Dict[str, Any]] = Field(default_factory=list)

    @property
    def age_years(self) -> float:
        """Assuming 10 simulation ticks represent approximately one calendar year."""
        return round(self.age_ticks / 10.0, 1)

    @property
    def job_title(self) -> str:
        """Calculates a user-friendly RPG-style title for the citizen."""
        if not self.alive:
            return "Ancestral Spirit"
        if self.age_ticks < 50:
            return "Settlement Youth"
        if self.age_ticks > 500:
            return "Village Elder"
        
        # Skill-based titles
        mastered_techs = sum(1 for m in self.knowledge_inventory.values() if m >= 1.0)
        if mastered_techs >= 4 or self.intelligence >= 125:
            return "Chief Scholar"
        if self.skills.get_level(SkillType.CONSTRUCTION) >= 2:
            return "Craftsman Mason"
        if self.skills.get_level(SkillType.FORAGING) >= 2:
            return "Master Forager"
        if self.skills.get_level(SkillType.LEADERSHIP) >= 2:
            return "Community Leader"
        return "Pioneer Settler"

    @property
    def avatar_emoji(self) -> str:
        """Returns a thematic visual emoji avatar."""
        if not self.alive:
            return "🪦"
        if self.age_ticks < 50:
            return "🧒"
        if self.age_ticks > 500:
            return "🧙‍♂️"
        if self.intelligence >= 125:
            return "📜"
        if self.personality.agreeableness > 0.7:
            return "🤝"
        return "🧑‍🌾"

    @classmethod
    def create(
        cls,
        name: str,
        intelligence: float = 100.0,
        rng: Optional[random.Random] = None,
        age_ticks: int = 180,
    ) -> "CitizenAgent":
        """Factory method to construct an agent with scaled memory capacity and personality."""
        r = rng or random.Random()
        personality = PersonalityMatrix.generate_random(r)
        # Higher intelligence grants greater cognitive memory capacity
        calculated_capacity = max(6, min(40, int(8 + (intelligence / 12.0))))
        memory = CognitiveMemory(capacity=calculated_capacity)
        
        return cls(
            name=name,
            intelligence=intelligence,
            personality=personality,
            memory=memory,
            age_ticks=age_ticks,
        )

    def refresh_thought(self, active_scenario_priority: str = "NORMAL", scenario_title: Optional[str] = None) -> None:
        """Generates a fresh live thought for this citizen."""
        self.current_thought = generate_citizen_thought(
            agent_name=self.name,
            intelligence=self.intelligence,
            personality=self.personality,
            health=self.needs.health,
            hunger=self.needs.hunger,
            thirst=self.needs.thirst,
            current_action=self.current_action,
            active_scenario_priority=active_scenario_priority,
            scenario_title=scenario_title,
        )

    def metabolic_tick(self, current_tick: int, health_drain_modifier: float = 0.0) -> None:
        """Processes one simulation tick of biological metabolism, hunger, thirst, and aging."""
        if not self.alive:
            return

        self.age_ticks += 1
        self.needs.hunger = min(100.0, self.needs.hunger + DEFAULT_BASE_HUNGER_RATE)
        self.needs.thirst = min(100.0, self.needs.thirst + (DEFAULT_BASE_HUNGER_RATE * 1.3))
        self.needs.fatigue = min(100.0, self.needs.fatigue + DEFAULT_BASE_FATIGUE_RATE)

        # Starvation, dehydration, and scenario health drain (e.g. frost/plague)
        damage = health_drain_modifier
        if self.needs.hunger > STARVATION_THRESHOLD:
            damage += (self.needs.hunger - STARVATION_THRESHOLD) * 0.4
        if self.needs.thirst > STARVATION_THRESHOLD:
            damage += (self.needs.thirst - STARVATION_THRESHOLD) * 0.6

        # Old age fragility check
        if self.age_ticks > MAX_AGENT_AGE_TICKS:
            age_excess = self.age_ticks - MAX_AGENT_AGE_TICKS
            damage += age_excess * 0.15

        if damage > 0:
            self.needs.health = max(0.0, self.needs.health - damage)
            if self.needs.hunger > STARVATION_THRESHOLD:
                self.memory.record_experience(
                    description=f"Experienced severe starvation at tick {current_tick}",
                    current_tick=current_tick,
                    category="survival",
                    importance=0.8,
                    emotional_valence=-0.9,
                )

        # Check death
        if self.needs.health <= 0.0:
            self.alive = False
            self.needs.health = 0.0
            if self.needs.thirst > STARVATION_THRESHOLD:
                self.cause_of_death = "Dehydration"
            elif self.needs.hunger > STARVATION_THRESHOLD:
                self.cause_of_death = "Starvation"
            elif health_drain_modifier > 0:
                self.cause_of_death = "Crisis Calamity"
            elif self.age_ticks > MAX_AGENT_AGE_TICKS:
                self.cause_of_death = "Old Age"
            else:
                self.cause_of_death = "Vital Exhaustion"

    def consume_food(self, amount: float = 5.0) -> float:
        """Eats available food from personal inventory to satisfy hunger."""
        available = min(self.inventory_food, amount)
        if available > 0:
            self.inventory_food -= available
            hunger_relief = available * 6.0
            self.needs.hunger = max(0.0, self.needs.hunger - hunger_relief)
            self.needs.health = min(100.0, self.needs.health + (available * 1.5))
        return available

    def consume_water(self, amount: float = 5.0) -> float:
        """Drinks available water from personal inventory to satisfy thirst."""
        available = min(self.inventory_water, amount)
        if available > 0:
            self.inventory_water -= available
            thirst_relief = available * 8.0
            self.needs.thirst = max(0.0, self.needs.thirst - thirst_relief)
            self.needs.health = min(100.0, self.needs.health + (available * 1.5))
        return available

    def rest(self, recovery_amount: float = 35.0) -> None:
        """Recovers fatigue through sleep or meditation."""
        self.needs.fatigue = max(0.0, self.needs.fatigue - recovery_amount)
        self.needs.health = min(100.0, self.needs.health + 2.0)

    def study_knowledge(self, node: KnowledgeNode, current_tick: int, base_effort: float = 0.25) -> float:
        """Progresses knowledge mastery according to IQ, openness, and knowledge difficulty.

        Formula:
        delta = (base_effort * (IQ / 100.0) * (0.7 + 0.6 * openness)) / (1.0 + difficulty)
        """
        current_mastery = self.knowledge_inventory.get(node.knowledge_id, 0.0)
        if current_mastery >= 1.0:
            return 1.0

        iq_multiplier = self.intelligence / 100.0
        openness_bonus = 0.7 + (0.6 * self.personality.openness)
        difficulty_penalty = 1.0 + (node.difficulty * 1.5)

        progress = (base_effort * iq_multiplier * openness_bonus) / difficulty_penalty
        new_mastery = min(1.0, current_mastery + progress)
        self.knowledge_inventory[node.knowledge_id] = new_mastery

        # If mastery threshold crossed, log achievement and boost memory
        if current_mastery < 1.0 and new_mastery >= 1.0:
            self.learning_history.append({
                "tick": current_tick,
                "knowledge_id": node.knowledge_id,
                "title": node.title,
            })
            self.memory.record_experience(
                description=f"Mastered civilisational knowledge: {node.title}",
                current_tick=current_tick,
                category="discovery",
                importance=0.9,
                emotional_valence=0.85,
            )
            # Practice related skill
            skill_name = SkillType(node.related_skill) if node.related_skill in SkillType._value2member_map_ else None
            if skill_name:
                self.skills.practice(skill_name, 60.0, self.intelligence, self.personality.conscientiousness)

        return new_mastery

    def can_teach(self, knowledge_id: str) -> bool:
        """Only citizens who have mastered a concept (>= threshold) can teach it."""
        return self.knowledge_inventory.get(knowledge_id, 0.0) >= KNOWLEDGE_MASTERY_THRESHOLD

    def record_decision(self, tick: int, action: str, details: str = "") -> None:
        """Maintains an ongoing record of citizen actions and intentions."""
        self.current_action = action
        self.decision_history.append({
            "tick": tick,
            "action": action,
            "details": details,
        })
        if len(self.decision_history) > 30:
            self.decision_history.pop(0)
