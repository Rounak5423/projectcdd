from typing import Dict, List, Optional, Literal, Any
from pydantic import BaseModel, Field

OccupationType = Literal["Farmer", "Engineer", "Scholar", "Builder", "Merchant"]
ClimateType = Literal["Temperate", "Arid", "Boreal", "Tropical", "Cyber-Industrial"]
TechLevel = Literal["Emergent", "Automated", "Post-Scarcity", "Cognitive-Frontier"]
BuildingType = Literal["Residential", "Research", "Industrial", "Agricultural", "Commercial", "Civic"]


class Building(BaseModel):
    id: str
    type: BuildingType
    x: float
    y: float
    height: float = 2.0
    level: int = 1
    capacity: int = 10


class EnvironmentStats(BaseModel):
    climate: ClimateType = "Temperate"
    technology_level: TechLevel = "Automated"
    environmental_quality: float = Field(ge=0.0, le=1.0, default=0.85)
    temperature_celsius: float = 21.5
    weather: str = "Clear"


class Demographics(BaseModel):
    id: str
    age: float = Field(ge=0.0, le=120.0, default=25.0)
    occupation: OccupationType = "Scholar"
    wealth: float = Field(ge=0.0, default=100.0)
    x: float = Field(default=0.0)
    y: float = Field(default=0.0)


class NeedsVector(BaseModel):
    hunger: float = Field(ge=0.0, le=1.0, default=0.2)      # 0 = full, 1 = starving
    energy: float = Field(ge=0.0, le=1.0, default=0.8)      # 1 = energetic, 0 = exhausted
    wellbeing: float = Field(ge=0.0, le=1.0, default=0.75)  # 1 = thriving, 0 = depressed


class CognitiveProfile(BaseModel):
    independent_reasoning: float = Field(ge=0.0, le=1.0, default=0.7)
    problem_solving: float = Field(ge=0.0, le=1.0, default=0.6)
    critical_evaluation: float = Field(ge=0.0, le=1.0, default=0.65)
    creativity: float = Field(ge=0.0, le=1.0, default=0.6)
    knowledge_retention: float = Field(ge=0.0, le=1.0, default=0.7)
    ai_dependency: float = Field(ge=0.0, le=1.0, default=0.1)


class Citizen(BaseModel):
    id: str
    demographics: Demographics
    needs: NeedsVector = Field(default_factory=NeedsVector)
    cognitive: CognitiveProfile = Field(default_factory=CognitiveProfile)
    is_alive: bool = True


class Resources(BaseModel):
    food: float = Field(ge=0.0, default=1000.0)
    water: float = Field(ge=0.0, default=1000.0)
    energy: float = Field(ge=0.0, default=800.0)
    materials: float = Field(ge=0.0, default=500.0)


class Policy(BaseModel):
    id: str
    name: str
    description: str
    active: bool = False
    parameters: Dict[str, float] = Field(default_factory=dict)


class EconomyStats(BaseModel):
    gini: float = Field(ge=0.0, le=1.0, default=0.32)
    civic_stability: float = Field(ge=0.0, le=1.0, default=0.744)
    average_wealth: float = Field(default=100.0)
    total_wealth: float = Field(default=0.0)
    macro_innovation_index: float = Field(default=0.5)
    avg_ai_dependency: float = Field(default=0.1)
    avg_reasoning: float = Field(default=0.7)
    avg_problem_solving: float = Field(default=0.6)


class HistorySnapshot(BaseModel):
    tick: int
    year: float
    population: int
    gini: float
    civic_stability: float
    macro_innovation: float
    avg_ai_dependency: float
    avg_reasoning: float
    food: float
    energy: float
    materials: float
    average_wealth: float


class WorldState(BaseModel):
    id: str
    name: str
    parent_world_id: Optional[str] = None
    tick: int = 0
    year: float = 2026.0
    population_count: int = 0
    environment: EnvironmentStats = Field(default_factory=EnvironmentStats)
    buildings: List[Building] = Field(default_factory=list)
    citizens: List[Citizen] = Field(default_factory=list)
    resources: Resources = Field(default_factory=Resources)
    economy: EconomyStats = Field(default_factory=EconomyStats)
    policies: Dict[str, Policy] = Field(default_factory=dict)
    grid_size: int = 32
    history: List[HistorySnapshot] = Field(default_factory=list)


# API Request / Response schemas
class WorldCreationRequest(BaseModel):
    name: str = "Civilisation Alpha"
    initial_population: int = Field(ge=10, le=1000, default=100)
    grid_size: int = Field(ge=16, le=64, default=32)
    climate: ClimateType = "Temperate"
    technology_level: TechLevel = "Automated"
    resource_tier: Literal["Scarce", "Balanced", "Abundant"] = "Balanced"
    active_policies: Optional[List[str]] = None


class TickRequest(BaseModel):
    ticks: int = Field(ge=1, le=500, default=1)


class PolicyUpdateRequest(BaseModel):
    policy_id: str
    active: bool
    parameters: Optional[Dict[str, float]] = None


class BranchRequest(BaseModel):
    new_world_id: Optional[str] = None
    new_world_name: str
    policy_overrides: Optional[Dict[str, bool]] = None
    project_ticks: int = Field(ge=0, le=200, default=0)


class CompareResponse(BaseModel):
    source_world_id: str
    source_world_name: str
    target_world_id: str
    target_world_name: str
    branch_tick: int
    trajectory_length: int
    source_history: List[HistorySnapshot]
    target_history: List[HistorySnapshot]
    divergence_summary: Dict[str, Any]
