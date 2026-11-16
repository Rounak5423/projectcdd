"""Configurable Governance Systems (Module F).

Enforces systemic macro-policies (taxation, civic safety nets, research subsidies)
without tightly coupling with citizen internal cognitive architecture.
"""

from enum import Enum
from typing import List, Dict, Any
from pydantic import BaseModel, Field

from genesis.agents.citizen import CitizenAgent


class GovernanceModel(str, Enum):
    DEMOCRACY = "democracy"
    AUTOCRACY = "autocracy"
    COUNCIL = "council"
    LAISSEZ_FAIRE = "laissez_faire"


class GovernancePolicy(BaseModel):
    """Execution rules of a civilisation's governing regime."""

    model_type: GovernanceModel
    tax_rate: float = Field(default=0.10, ge=0.0, le=0.50)
    welfare_threshold_hunger: float = Field(default=75.0, ge=0.0, le=100.0)
    research_subsidy_multiplier: float = Field(default=1.0, ge=0.5, le=3.0)
    
    # Public Stockpiles managed by governance
    public_food_reserve: float = Field(default=0.0, ge=0.0)
    public_water_reserve: float = Field(default=0.0, ge=0.0)

    def execute_governance_cycle(self, citizens: List[CitizenAgent], current_tick: int) -> Dict[str, Any]:
        """Runs periodic taxation and social welfare safety net distributions."""
        collected_food = 0.0
        collected_water = 0.0

        # 1. Taxation Phase: levies taxes on citizen surplus
        if self.tax_rate > 0.0:
            for citizen in citizens:
                if not citizen.alive:
                    continue
                # Tax only surplus above baseline sustenance (5.0 units)
                if citizen.inventory_food > 5.0:
                    taxable = citizen.inventory_food - 5.0
                    tax = taxable * self.tax_rate
                    citizen.inventory_food -= tax
                    collected_food += tax

                if citizen.inventory_water > 5.0:
                    taxable = citizen.inventory_water - 5.0
                    tax = taxable * self.tax_rate
                    citizen.inventory_water -= tax
                    collected_water += tax

        self.public_food_reserve += collected_food
        self.public_water_reserve += collected_water

        # 2. Welfare Redistribution Phase
        distributed_food = 0.0
        distributed_water = 0.0

        if self.model_type in (GovernanceModel.DEMOCRACY, GovernanceModel.AUTOCRACY, GovernanceModel.COUNCIL):
            for citizen in citizens:
                if not citizen.alive:
                    continue
                # Distribute emergency food ration if citizen is near starvation and lacks personal food
                if citizen.needs.hunger >= self.welfare_threshold_hunger and citizen.inventory_food < 2.0:
                    ration = min(3.0, self.public_food_reserve)
                    if ration > 0.0:
                        self.public_food_reserve -= ration
                        citizen.inventory_food += ration
                        distributed_food += ration

                # Distribute emergency water ration
                if citizen.needs.thirst >= self.welfare_threshold_hunger and citizen.inventory_water < 2.0:
                    ration = min(3.0, self.public_water_reserve)
                    if ration > 0.0:
                        self.public_water_reserve -= ration
                        citizen.inventory_water += ration
                        distributed_water += ration

        return {
            "tick": current_tick,
            "governance_model": self.model_type.value,
            "collected_food": round(collected_food, 2),
            "collected_water": round(collected_water, 2),
            "distributed_food": round(distributed_food, 2),
            "distributed_water": round(distributed_water, 2),
            "reserve_food": round(self.public_food_reserve, 2),
            "reserve_water": round(self.public_water_reserve, 2),
        }


def create_governance_system(
    model: GovernanceModel,
    initial_food: float = 50.0,
    initial_water: float = 50.0,
) -> GovernancePolicy:
    """Factory creating tailored governance archetype policies."""
    if model == GovernanceModel.DEMOCRACY:
        return GovernancePolicy(
            model_type=GovernanceModel.DEMOCRACY,
            tax_rate=0.10,
            welfare_threshold_hunger=70.0,
            research_subsidy_multiplier=1.2,
            public_food_reserve=initial_food,
            public_water_reserve=initial_water,
        )
    elif model == GovernanceModel.AUTOCRACY:
        return GovernancePolicy(
            model_type=GovernanceModel.AUTOCRACY,
            tax_rate=0.25,
            welfare_threshold_hunger=85.0,  # Lower welfare priority
            research_subsidy_multiplier=1.0,
            public_food_reserve=initial_food,
            public_water_reserve=initial_water,
        )
    elif model == GovernanceModel.COUNCIL:
        return GovernancePolicy(
            model_type=GovernanceModel.COUNCIL,
            tax_rate=0.12,
            welfare_threshold_hunger=75.0,
            research_subsidy_multiplier=1.5,  # Significant research focus
            public_food_reserve=initial_food,
            public_water_reserve=initial_water,
        )
    else:  # LAISSEZ_FAIRE
        return GovernancePolicy(
            model_type=GovernanceModel.LAISSEZ_FAIRE,
            tax_rate=0.02,
            welfare_threshold_hunger=99.0,  # No welfare safety net
            research_subsidy_multiplier=1.0,
            public_food_reserve=0.0,
            public_water_reserve=0.0,
        )
