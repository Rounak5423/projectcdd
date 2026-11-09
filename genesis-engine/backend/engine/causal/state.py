"""
State definitions and data transfer objects for Causal Simulation Coupling.
"""

from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class DeathsByCause(BaseModel):
    aging: int = Field(default=0, description="Natural aging / Gompertz baseline deaths")
    starvation: int = Field(default=0, description="Deaths from acute food deficit")
    dehydration: int = Field(default=0, description="Deaths from acute water deficit")
    hospital_overload: int = Field(default=0, description="Deaths due to hospital bed unavailability")
    pollution: int = Field(default=0, description="Deaths from environmental pollution toxicity")
    trauma: int = Field(default=0, description="Deaths from severe accidents / incidents")

    def total(self) -> int:
        return (
            self.aging
            + self.starvation
            + self.dehydration
            + self.hospital_overload
            + self.pollution
            + self.trauma
        )


class UnmetNeeds(BaseModel):
    food: float = Field(default=0.0, ge=0.0, le=1.0, description="Fraction of food demand unfulfilled [0-1]")
    water: float = Field(default=0.0, ge=0.0, le=1.0, description="Fraction of water demand unfulfilled [0-1]")
    energy: float = Field(default=0.0, ge=0.0, le=1.0, description="Fraction of energy demand unfulfilled [0-1]")
    healthcare: float = Field(default=0.0, ge=0.0, le=1.0, description="Fraction of acute healthcare unfulfilled [0-1]")
    shelter: float = Field(default=0.0, ge=0.0, le=1.0, description="Fraction of population lacking adequate housing [0-1]")


class CausalVitalsSnapshot(BaseModel):
    world_id: str
    tick: int
    year: int
    day: int
    population: int
    births: int
    deaths: int
    deaths_by_cause: DeathsByCause
    unmet_needs: UnmetNeeds
    health_index: float
    hospital_admissions: int
    bed_capacity: int
    bed_occupancy_pct: float
    overflow_patients: int
    protest_intensity: float
    protest_participants: int
    grievance_score: float
    happiness: float
    civic_stability: float
    environmental_health: float
    created_at: str


class CausalNode(BaseModel):
    id: str
    label: str
    category: str
    value: float
    display_value: str
    unit: str
    status: str  # 'normal', 'warning', 'critical'
    description: str


class CausalLink(BaseModel):
    source: str
    target: str
    strength: float  # -1.0 to +1.0
    impact: str  # 'mitigating', 'aggravating', 'neutral'
    description: str


class CausalTraceGraph(BaseModel):
    world_id: str
    tick: int
    year: int
    day: int
    nodes: List[CausalNode]
    links: List[CausalLink]
    summary: str
    contributing_factors: List[str]


class CausalEvent(BaseModel):
    id: str
    world_id: str
    year: int
    day: int
    tick: int
    category: str
    title: str
    severity: str  # 'info', 'warning', 'emergency', 'critical'
    description: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

