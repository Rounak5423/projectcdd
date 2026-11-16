"""Pydantic Request and Response Schemas for the FastAPI Interface."""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from genesis.core.civilisation import ClimateType, SocialStructure, InitialTechLevel


class CreateCivilisationRequest(BaseModel):
    name: str = Field(default="Mesopotamia", min_length=2, max_length=64)
    initial_population: int = Field(default=20, ge=2, le=200)
    intelligence_mean: float = Field(default=100.0, ge=50.0, le=150.0)
    intelligence_std_dev: float = Field(default=15.0, ge=1.0, le=30.0)
    climate: ClimateType = Field(default=ClimateType.FERTILE_RIVER_VALLEY)
    social_structure: SocialStructure = Field(default=SocialStructure.EGALITARIAN_TRIBE)
    starting_tech_level: InitialTechLevel = Field(default=InitialTechLevel.STONE_AGE)
    seed: int = Field(default=42)


class RunSimulationRequest(BaseModel):
    ticks: int = Field(default=10, ge=1, le=200)


class GodPowerRequest(BaseModel):
    power: str = Field(..., description="rain | feast | eureka | sunshine")


class TriggerScenarioRequest(BaseModel):
    scenario_type: str = Field(default="drought", description="drought | blizzard | plague | golden_age | bountiful_harvest | custom")
    custom_prompt: Optional[str] = None
    duration: int = Field(default=15, ge=3, le=100)


class CitizenSummary(BaseModel):
    id: str
    name: str
    avatar_emoji: str
    job_title: str
    current_thought: str
    age_years: float
    alive: bool
    cause_of_death: Optional[str]
    intelligence: float
    health: float
    hunger: float
    thirst: float
    fatigue: float
    current_action: str
    inventory_food: float
    inventory_water: float
    mastered_knowledge_count: int


class MemoryItemDTO(BaseModel):
    id: str
    tick_created: int
    description: str
    category: str
    importance: float
    emotional_valence: float


class CitizenDetail(BaseModel):
    id: str
    name: str
    avatar_emoji: str
    job_title: str
    current_thought: str
    age_years: float
    alive: bool
    cause_of_death: Optional[str]
    intelligence: float
    personality: Dict[str, float]
    needs: Dict[str, float]
    inventory: Dict[str, float]
    current_action: str
    skills: Dict[str, int]
    knowledge_inventory: Dict[str, float]
    recent_memories: List[MemoryItemDTO]
    decision_history: List[Dict[str, Any]]
    learning_history: List[Dict[str, Any]]
