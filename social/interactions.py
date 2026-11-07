"""Social Interactions, Peer Teaching, and Barter Trade (Module E)."""

from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from genesis.agents.citizen import CitizenAgent
from genesis.agents.skills import SkillType
from genesis.knowledge.models import KnowledgeNode
from genesis.config import KNOWLEDGE_MASTERY_THRESHOLD


class InteractionType(str, Enum):
    TEACHING = "teaching"
    BARTER = "barter"
    COMMUNICATION = "communication"


class InteractionResult(BaseModel):
    """The outcome of a social interaction between two citizens."""

    interaction_type: InteractionType
    success: bool
    message: str
    details: Dict[str, Any] = Field(default_factory=dict)


class SocialInteractionManager:
    """Coordinates peer-to-peer exchanges and knowledge diffusion."""

    @staticmethod
    def execute_teaching(
        teacher: CitizenAgent,
        student: CitizenAgent,
        knowledge_node: KnowledgeNode,
        current_tick: int,
    ) -> InteractionResult:
        """Transfers knowledge from a knowledgeable mentor to a receptive student."""
        if not teacher.alive or not student.alive:
            return InteractionResult(
                interaction_type=InteractionType.TEACHING,
                success=False,
                message="Cannot teach: one of the citizens is deceased.",
            )

        # Check teacher qualification
        teacher_mastery = teacher.knowledge_inventory.get(knowledge_node.knowledge_id, 0.0)
        if teacher_mastery < KNOWLEDGE_MASTERY_THRESHOLD:
            return InteractionResult(
                interaction_type=InteractionType.TEACHING,
                success=False,
                message=f"{teacher.name} has not sufficiently mastered {knowledge_node.title} to teach.",
            )

        # Verify student prerequisites
        for prereq in knowledge_node.prerequisites:
            if student.knowledge_inventory.get(prereq, 0.0) < 1.0:
                return InteractionResult(
                    interaction_type=InteractionType.TEACHING,
                    success=False,
                    message=f"{student.name} lacks prerequisite {prereq} for {knowledge_node.title}.",
                )

        current_student_mastery = student.knowledge_inventory.get(knowledge_node.knowledge_id, 0.0)
        if current_student_mastery >= 1.0:
            return InteractionResult(
                interaction_type=InteractionType.TEACHING,
                success=False,
                message=f"{student.name} already possesses full mastery of {knowledge_node.title}.",
            )

        # Teaching transmission formula:
        # Effective transfer is boosted by teacher's agreeableness and student's IQ & openness
        base_teaching_effort = 0.40  # Direct teaching is faster than self-study (0.25)
        student_iq_mult = student.intelligence / 100.0
        student_openness = 0.7 + (0.6 * student.personality.openness)
        teacher_warmth = 0.8 + (0.4 * teacher.personality.agreeableness)
        difficulty_discount = 1.0 + (knowledge_node.difficulty * 1.2)

        transfer_delta = (base_teaching_effort * student_iq_mult * student_openness * teacher_warmth) / difficulty_discount
        new_mastery = min(1.0, current_student_mastery + transfer_delta)
        student.knowledge_inventory[knowledge_node.knowledge_id] = new_mastery

        # Memory formation
        teacher.memory.record_experience(
            description=f"Mentored {student.name} in {knowledge_node.title}",
            current_tick=current_tick,
            category="social",
            importance=0.6,
            emotional_valence=0.7,
        )
        student.memory.record_experience(
            description=f"Received direct instruction from {teacher.name} in {knowledge_node.title}",
            current_tick=current_tick,
            category="learning",
            importance=0.7,
            emotional_valence=0.8,
        )

        # Teacher gains Leadership XP
        teacher.skills.practice(SkillType.LEADERSHIP, 30.0, teacher.intelligence, teacher.personality.conscientiousness)

        # If student reached mastery, record learning history
        if current_student_mastery < 1.0 and new_mastery >= 1.0:
            student.learning_history.append({
                "tick": current_tick,
                "knowledge_id": knowledge_node.knowledge_id,
                "title": knowledge_node.title,
                "mentor": teacher.name,
            })

        return InteractionResult(
            interaction_type=InteractionType.TEACHING,
            success=True,
            message=f"{teacher.name} taught {knowledge_node.title} to {student.name}.",
            details={"transfer_delta": transfer_delta, "new_mastery": new_mastery},
        )

    @staticmethod
    def execute_barter(
        agent_a: CitizenAgent,
        agent_b: CitizenAgent,
        current_tick: int,
    ) -> InteractionResult:
        """Facilitates mutually beneficial resource exchange (e.g. food for water)."""
        # Scenario: Agent A needs water and has surplus food; Agent B needs food and has surplus water
        a_needs_water = agent_a.inventory_water < 3.0 and agent_a.inventory_food > 5.0
        b_needs_food = agent_b.inventory_food < 3.0 and agent_b.inventory_water > 5.0

        if a_needs_water and b_needs_food:
            trade_amount = 2.0
            agent_a.inventory_food -= trade_amount
            agent_a.inventory_water += trade_amount
            agent_b.inventory_water -= trade_amount
            agent_b.inventory_food += trade_amount

            agent_a.memory.record_experience(
                description=f"Bartered food for water with {agent_b.name}",
                current_tick=current_tick,
                category="trade",
                importance=0.5,
                emotional_valence=0.5,
            )
            agent_b.memory.record_experience(
                description=f"Bartered water for food with {agent_a.name}",
                current_tick=current_tick,
                category="trade",
                importance=0.5,
                emotional_valence=0.5,
            )
            agent_a.skills.practice(SkillType.TRADING, 20.0, agent_a.intelligence, agent_a.personality.conscientiousness)
            agent_b.skills.practice(SkillType.TRADING, 20.0, agent_b.intelligence, agent_b.personality.conscientiousness)

            return InteractionResult(
                interaction_type=InteractionType.BARTER,
                success=True,
                message=f"Traded {trade_amount} food for {trade_amount} water between {agent_a.name} and {agent_b.name}.",
                details={"units_traded": trade_amount},
            )

        return InteractionResult(
            interaction_type=InteractionType.BARTER,
            success=False,
            message="No complementary trade deficits found between agents.",
        )
