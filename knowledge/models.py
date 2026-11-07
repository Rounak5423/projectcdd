"""Data models for the structured Human Civilisation Knowledge Base."""

from enum import Enum
from typing import List, Dict, Any
from pydantic import BaseModel, Field


class KnowledgeDomain(str, Enum):
    STONE_AGE = "stone_age"
    AGRICULTURAL_DEVELOPMENT = "agricultural_development"
    EARLY_SETTLEMENTS = "early_settlements"
    ANCIENT_TRADE = "ancient_trade"
    WRITING_AND_COMMUNICATION = "writing_and_communication"
    MATHEMATICS = "mathematics"
    ENGINEERING = "engineering"
    MEDICINE = "medicine"
    ASTRONOMY = "astronomy"
    NAVIGATION = "navigation"
    SCIENTIFIC_DISCOVERIES = "scientific_discoveries"
    INDUSTRIAL_DEVELOPMENT = "industrial_development"
    MODERN_TECHNOLOGY = "modern_technology"


class KnowledgeNode(BaseModel):
    """Represents a discrete technological or cultural advancement in human history."""
    
    knowledge_id: str = Field(..., description="Unique alphanumeric identifier (e.g. 'stone_fire_making')")
    domain: KnowledgeDomain
    title: str = Field(..., description="Human-readable title of discovery")
    description: str = Field(..., description="Detailed description of the technology or concept")
    related_activity: str = Field(..., description="Activity where this knowledge is applied (e.g., 'cooking', 'foraging')")
    related_skill: str = Field(..., description="Citizen skill augmented by this knowledge")
    difficulty: float = Field(default=0.2, ge=0.0, le=1.0, description="Cognitive difficulty to comprehend (0.0 to 1.0)")
    prerequisites: List[str] = Field(default_factory=list, description="List of knowledge_ids required before this can be learned")
    learning_outcomes: Dict[str, Any] = Field(
        default_factory=dict,
        description="Stat modifiers or efficiency bonuses granted upon mastering this knowledge",
    )
    historical_context: str = Field(
        ...,
        description="Historically grounded background information on when and how humanity adopted this breakthrough",
    )
