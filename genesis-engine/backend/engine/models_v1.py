from typing import Dict, List, Optional, Literal, Any
from pydantic import BaseModel, Field, field_validator

SimulationStatusType = Literal["running", "paused", "stopped"]
SimulationSpeedType = Literal["1x", "2x", "5x", "10x"]
BuildingStatusType = Literal["active", "constructing", "upgrading", "abandoned", "damaged", "derelict", "decommissioned", "operational"]
BuildingCategoryType = Literal[
    "Residential", "Agriculture", "Industry", "Research",
    "Education", "Healthcare", "Energy", "Government", "Environment"
]
ClimateType = Literal["Temperate", "Arid", "Boreal", "Tropical", "Cyber-Industrial"]
TechLevelType = Literal["Emergent", "Automated", "Post-Scarcity", "Cognitive-Frontier"]


# ---------------------------------------------------------------------------
# World Management Schemas
# ---------------------------------------------------------------------------

class WorldCreateRequest(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "Aurora Prime"})
    climate: ClimateType = "Temperate"
    technology_level: TechLevelType = "Automated"
    initial_population: int = Field(default=10, ge=10, le=2000000)
    grid_size: int = Field(default=32, ge=16, le=128)
    initial_resources: Optional[Dict[str, float]] = None


class WorldUpdateRequest(BaseModel):
    name: Optional[str] = None
    climate: Optional[ClimateType] = None
    technology_level: Optional[TechLevelType] = None
    simulation_speed: Optional[SimulationSpeedType] = None


class WorldSummary(BaseModel):
    id: str
    name: str
    parent_world_id: Optional[str] = None
    owner_id: Optional[str] = None
    tick: int
    year: int
    day: int
    simulation_status: SimulationStatusType
    simulation_speed: SimulationSpeedType
    population: int
    gdp: float
    thriving_score: float
    level: int
    climate: str
    technology_level: str
    created_at: str
    updated_at: str
    forecast: Optional[Dict[str, Any]] = None


class WorldDetail(BaseModel):
    id: str
    name: str
    parent_world_id: Optional[str] = None
    owner_id: Optional[str] = None
    tick: int
    year: int
    day: int
    simulation_status: SimulationStatusType
    simulation_speed: SimulationSpeedType
    climate: ClimateType
    technology_level: TechLevelType
    grid_size: int
    population_count: int
    gdp: float
    thriving_score: float
    level: int
    grc_balance: float
    created_at: str
    updated_at: str
    forecast: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# 3D World & Infrastructure Schemas
# ---------------------------------------------------------------------------

class MapTerrainResponse(BaseModel):
    world_id: str
    grid_size: int
    climate: ClimateType
    zones: List[Dict[str, Any]]
    elevation_grid: List[List[float]]
    biomes: Dict[str, Any]


class BuildingCost(BaseModel):
    materials: float = 0.0
    energy: float = 0.0
    credits: float = 0.0


class BuildingRecord(BaseModel):
    id: str
    world_id: str
    name: str
    type: str
    level: int = 1
    x: float
    y: float
    z: float = 0.0
    width: float = 2.0
    length: float = 2.0
    height: float = 3.0
    orientation: float = 0.0  # degrees
    status: BuildingStatusType = "active"
    capacity: int = 50
    construction_cost: Dict[str, float] = Field(default_factory=dict)
    upgrade_cost: Dict[str, float] = Field(default_factory=dict)
    effects: Dict[str, Any] = Field(default_factory=dict)
    coordinates: Optional[Dict[str, float]] = None
    dimensions: Optional[Dict[str, float]] = None


class BuildingConstructRequest(BaseModel):
    name: Optional[str] = None
    type: str
    x: float
    y: float
    z: float = 0.0
    orientation: float = 0.0
    capacity: Optional[int] = 50
    dimensions: Optional[Dict[str, float]] = None

    @field_validator("type", mode="before")
    @classmethod
    def normalize_type(cls, v):
        if isinstance(v, str):
            mapping = {
                "residential": "Residential",
                "agriculture": "Agriculture",
                "industry": "Industry",
                "industrial": "Industry",
                "research": "Research",
                "education": "Education",
                "healthcare": "Healthcare",
                "health": "Healthcare",
                "energy": "Energy",
                "government": "Government",
                "environment": "Environment",
            }
            return mapping.get(v.lower(), v.title())
        return v


class BuildingUpgradeResponse(BaseModel):
    building_id: str
    name: str
    previous_level: int
    new_level: int
    status: BuildingStatusType
    upgrade_cost: Dict[str, float]
    updated_effects: Dict[str, Any]


# ---------------------------------------------------------------------------
# Population & Citizens Schemas
# ---------------------------------------------------------------------------

class PopulationOverview(BaseModel):
    world_id: str
    total_population: int
    growth_rate: float
    happiness: float
    health: float
    education: float
    employment_rate: float
    birth_rate: float
    death_rate: float
    migration_rate: float
    demographics_breakdown: Dict[str, int]


class CitizenRecord(BaseModel):
    id: str
    world_id: str
    age: float
    occupation: str
    wealth: float
    x: float
    y: float
    hunger: float
    energy: float
    wellbeing: float
    education_level: float
    health: float
    independent_reasoning: float
    problem_solving: float
    critical_evaluation: float
    creativity: float
    knowledge_retention: float
    ai_dependency: float
    is_alive: bool = True


# ---------------------------------------------------------------------------
# Economy & Resources Schemas
# ---------------------------------------------------------------------------

class EconomyOverview(BaseModel):
    world_id: str
    gdp: float
    gdp_formatted: str
    gdp_growth_rate: float
    employment_rate: float
    average_income: float
    gini_coefficient: float
    civic_stability: float
    tax_rate: float
    economic_health_score: float
    happiness: Optional[float] = 0.78


class ResourceBalances(BaseModel):
    world_id: str
    food: float
    food_rate: float
    water: float
    water_rate: float
    energy: float
    energy_rate: float
    materials: float
    materials_rate: float
    research_points: float
    research_rate: float
    genesis_research_credits: float
    happiness: float
    environmental_health: float
    pollution: float


class InfrastructureOverview(BaseModel):
    world_id: str
    total_buildings: int
    active_buildings: int
    under_construction: int
    residential_capacity: int
    total_energy_consumption_mw: float
    total_maintenance_cost: float
    buildings_by_category: Dict[str, int]


class MetricHistoryPoint(BaseModel):
    tick: int
    year: int
    day: int
    population: int
    gdp: float
    happiness: float
    employment: float
    environment: float
    gini: float
    civic_stability: float
    macro_innovation: float
    avg_ai_dependency: float
    avg_reasoning: float
    food: float
    energy: float
    materials: float


# ---------------------------------------------------------------------------
# Simulation Controls Schemas
# ---------------------------------------------------------------------------

class SimulationStartRequest(BaseModel):
    speed: SimulationSpeedType = "1x"


class SimulationAdvanceRequest(BaseModel):
    ticks: int = Field(default=1, ge=1, le=500)


class SimulationStatusResponse(BaseModel):
    world_id: str
    simulation_status: SimulationStatusType
    simulation_speed: SimulationSpeedType
    current_tick: int
    year: int
    day: int
    formatted_time: str


# ---------------------------------------------------------------------------
# Policies & Technology Schemas
# ---------------------------------------------------------------------------

class PolicyDefinition(BaseModel):
    id: str
    name: str
    category: str
    description: str
    implementation_cost: float
    parameters: Dict[str, float]
    effects: Dict[str, Any]
    is_active: bool = False


class PolicyApplyRequest(BaseModel):
    policy_id: str
    parameters: Optional[Dict[str, float]] = None


class TechnologyNode(BaseModel):
    id: str
    name: str
    category: str
    description: str = ""
    level_required: int = 1
    research_cost: float = 1000.0
    research_progress: float = 0.0
    is_unlocked: bool = False
    is_researching: bool = False
    effects: Dict[str, Any] = {}
    era: Optional[str] = "Foundational"
    turns: Optional[int] = 5
    icon: Optional[str] = "🔬"
    is_boosted: Optional[bool] = False
    boost_text: Optional[str] = ""
    unlocked_effects: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None
    unlocks: Optional[List[str]] = None
    cost_points: Optional[int] = 300
    can_research: Optional[bool] = True
    missing_prerequisites: Optional[List[str]] = None


class TechResearchRequest(BaseModel):
    technology_id: str


class TechnologyOverviewResponse(BaseModel):
    world_id: str
    science_per_turn: float
    active_technology: Optional[TechnologyNode] = None
    turns_remaining: int = 0
    unlocked_count: int = 0
    total_technologies: int = 0
    current_era: str = "Foundational"
    technologies: List[TechnologyNode] = []


class EurekaBoostRequest(BaseModel):
    technology_id: Optional[str] = None


class EurekaBoostResponse(BaseModel):
    success: bool
    technology: TechnologyNode
    turns_saved: int
    discount_applied: float
    message: str


# ---------------------------------------------------------------------------
# Gamification & Progression Schemas
# ---------------------------------------------------------------------------

class ProgressionOverview(BaseModel):
    world_id: str
    xp: int
    level: int
    title: str
    thriving_score: float
    grc_balance: float
    xp_to_next_level: int
    progress_percentage: float


class MissionRecord(BaseModel):
    id: str
    world_id: str
    title: str
    description: str
    target_metric: str
    target_value: float
    current_value: float
    is_completed: bool
    is_claimed: bool
    reward_xp: int
    reward_grc: float
    progress_percentage: float


class AchievementRecord(BaseModel):
    id: str
    world_id: str
    title: str
    description: str
    icon: str
    is_unlocked: bool
    unlocked_at: Optional[str] = None


class EventRecord(BaseModel):
    id: str
    world_id: str
    year: int
    day: int
    title: str
    category: str
    description: str
    created_at: str


# ---------------------------------------------------------------------------
# Future Simulator & Scenarios Schemas
# ---------------------------------------------------------------------------

class SnapshotCreateRequest(BaseModel):
    name: str


class SnapshotRecord(BaseModel):
    id: str
    world_id: str
    name: str
    tick: int
    year: int
    day: int
    created_at: str


class ScenarioCreateRequest(BaseModel):
    world_id: str
    snapshot_id: str
    name: str
    simulation_horizon_ticks: int = Field(default=50, ge=10, le=200)
    policy_overrides: Optional[Dict[str, bool]] = None


class ScenarioRunRequest(BaseModel):
    ticks: Optional[int] = None


class ScenarioResultResponse(BaseModel):
    id: Optional[str] = None
    scenario_id: str
    world_id: str
    name: str
    status: str
    credit_cost: float
    ticks_projected: int
    policy_overrides: Dict[str, bool]
    results_summary: Dict[str, Any]
    history: List[Dict[str, Any]]


class ScenarioCompareResponse(BaseModel):
    baseline_id: str
    baseline_name: str
    scenario_id: str
    scenario_name: str
    divergence_summary: Dict[str, Any]
    baseline_trajectory: List[Dict[str, Any]]
    scenario_trajectory: List[Dict[str, Any]]


class ExperimentCreateRequest(BaseModel):
    world_id: str
    title: str
    research_question: str
    variable_tested: str
    credit_cost: float = 200.0


class ExperimentResultResponse(BaseModel):
    id: Optional[str] = None
    experiment_id: str
    world_id: str
    title: str
    research_question: str
    variable_tested: str
    status: str
    credit_cost: float
    baseline_metrics: Dict[str, Any]
    outcome_metrics: Dict[str, Any]
    findings: str
    created_at: str


# ---------------------------------------------------------------------------
# Authentication & Role-Based Access Control Schemas
# ---------------------------------------------------------------------------

class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, json_schema_extra={"example": "cosmic_builder"})
    email: str = Field(..., json_schema_extra={"example": "builder@genesis.ai"})
    password: str = Field(..., min_length=6, json_schema_extra={"example": "Secret123!"})


class UserLoginRequest(BaseModel):
    username: str = Field(..., json_schema_extra={"example": "player1"})
    password: str = Field(..., json_schema_extra={"example": "UserPassword123!"})


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: Literal["user", "admin"]
    is_active: bool
    created_at: str
    updated_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AdminUserCreateRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str
    password: str = Field(..., min_length=6)
    role: Literal["user", "admin"] = "user"
    is_active: bool = True


class AdminUserUpdateRequest(BaseModel):
    email: Optional[str] = None
    role: Optional[Literal["user", "admin"]] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class AdminUserDetail(BaseModel):
    id: str
    username: str
    email: str
    role: Literal["user", "admin"]
    is_active: bool
    created_at: str
    updated_at: str
    worlds_count: int
    worlds: List[Dict[str, Any]] = []


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    admin_count: int
    user_count: int
    total_worlds: int
    total_population: int
    total_gdp: float
