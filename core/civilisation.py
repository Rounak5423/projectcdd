"""Civilisation Configuration and State Entities (Module A).

Represents the macro-level specification and state of an artificial civilisation.
"""

from enum import Enum
import uuid
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator


class ClimateType(str, Enum):
    TEMPERATE = "temperate"
    FERTILE_RIVER_VALLEY = "fertile_river_valley"
    ARID_DESERT = "arid_desert"
    HARSH_TUNDRA = "harsh_tundra"
    TROPICAL_COAST = "tropical_coast"


class SocialStructure(str, Enum):
    EGALITARIAN_TRIBE = "egalitarian_tribe"
    HIERARCHICAL_CHIEFDOM = "hierarchical_chiefdom"
    COUNCIL_COMMUNE = "council_commune"
    INDIVIDUALISTIC_MARKET = "individualistic_market"


class InitialTechLevel(str, Enum):
    STONE_AGE = "stone_age"
    AGRICULTURAL_REVOLUTION = "agricultural_revolution"
    EARLY_BRONZE = "early_bronze"


class CivilisationConfig(BaseModel):
    """Specification used to instantiate a new civilisation."""
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., min_length=2, max_length=64, description="Civilisation name")
    seed: int = Field(default=42, description="Random seed for deterministic simulation")
    
    # Population and Demographics
    initial_population: int = Field(default=20, ge=2, le=500)
    intelligence_mean: float = Field(default=100.0, ge=50.0, le=150.0)
    intelligence_std_dev: float = Field(default=15.0, ge=1.0, le=30.0)
    
    # Environment & Geography
    climate: ClimateType = Field(default=ClimateType.FERTILE_RIVER_VALLEY)
    
    # Starting Resources
    initial_food: float = Field(default=200.0, ge=0.0)
    initial_water: float = Field(default=300.0, ge=0.0)
    initial_wood: float = Field(default=100.0, ge=0.0)
    initial_stone: float = Field(default=50.0, ge=0.0)
    
    # Culture and Governance
    starting_tech_level: InitialTechLevel = Field(default=InitialTechLevel.STONE_AGE)
    social_structure: SocialStructure = Field(default=SocialStructure.EGALITARIAN_TRIBE)
    simulation_speed: float = Field(default=1.0, ge=0.1, le=10.0)
    
    # Custom rule parameters
    policy_overrides: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("name")
    @classmethod
    def validate_name_not_blank(cls, v: str) -> str:
        clean = v.strip()
        if not clean:
            raise ValueError("Civilisation name cannot be empty or whitespace.")
        return clean


class CivilisationState(BaseModel):
    """Mutable dynamic state of a civilisation across ticks."""
    
    config: CivilisationConfig
    current_tick: int = Field(default=0, ge=0)
    is_running: bool = Field(default=False)
    
    # Macro metrics
    population_count: int = Field(default=0, ge=0)
    deceased_count: int = Field(default=0, ge=0)
    born_count: int = Field(default=0, ge=0)
    average_intelligence: float = Field(default=100.0)
    
    # Collective stockpile
    stockpile_food: float = Field(default=0.0)
    stockpile_water: float = Field(default=0.0)
    stockpile_wood: float = Field(default=0.0)
    stockpile_stone: float = Field(default=0.0)
    
    # Societal achievements
    unlocked_knowledge: list[str] = Field(default_factory=list)
    active_governance_type: str = Field(default="democracy")
    
    # Event ledger
    recent_events: list[Dict[str, Any]] = Field(default_factory=list)
