"""
CIVORA — Council of Advisors Pydantic Request & Response Schemas
Compatible with both Phase 1 TypeScript contracts (camelCase) and backend REST conventions (snake_case).
"""

from typing import List, Optional, Dict, Any, Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class CouncilEnvelope(BaseModel, Generic[T]):
    """Standard CIVORA API response envelope for frontend compatibility."""
    success: bool = True
    data: Optional[T] = None
    message: Optional[str] = None


# ---------------------------------------------------------------------------
# Advisor Schemas
# ---------------------------------------------------------------------------

class AdvisorMetricSchema(BaseModel):
    id: str
    label: str
    value: Any
    trend: str = "neutral"  # up, down, neutral
    status: str = "stable"  # optimal, stable, warning, critical
    unit: Optional[str] = ""
    description: str = ""


class AdvisorObservationSchema(BaseModel):
    id: str
    title: str
    detail: str
    severity: str = "info"  # info, positive, warning, urgent
    recordedDate: str = ""


class AdvisorRiskSchema(BaseModel):
    id: str
    name: str
    probability: str = "Moderate"  # Low, Moderate, High, Imminent
    potentialImpact: str = "Moderate"  # Minor, Moderate, Severe, Catastrophic
    mitigationStrategy: str = ""


class AdvisorBriefingDataSchema(BaseModel):
    advisorId: str
    date: str
    headline: str
    formalSpeech: str
    supportingObservations: List[AdvisorObservationSchema] = []
    proposedDirectives: List[str] = []
    systemicConsequences: List[str] = []
    keyMetrics: List[AdvisorMetricSchema] = []
    confidenceScore: int = 85


class CouncilAdvisorDetail(BaseModel):
    id: str
    role: str
    name: str
    title: str
    officialTitle: str
    domain: str
    motto: str = ""
    portraitSymbol: str = "🏛️"
    accentColor: str = "#C5A66A"
    status: str = "Stable"
    statusSummary: str = ""
    hasActiveWarning: bool = False
    warningText: Optional[str] = None
    confidenceScore: int = 85
    lastBriefingDate: str = ""
    responsibilities: List[str] = []
    metrics: List[AdvisorMetricSchema] = []
    currentBriefing: Optional[AdvisorBriefingDataSchema] = None
    identifiedRisks: List[AdvisorRiskSchema] = []
    displayOrder: int = 0
    display_order: int = 0
    isActive: bool = True
    is_active: bool = True
    createdAt: str = ""
    created_at: str = ""
    updatedAt: str = ""
    updated_at: str = ""


# ---------------------------------------------------------------------------
# Recommendation Schemas
# ---------------------------------------------------------------------------

class CouncilRecommendationCreate(BaseModel):
    world_id: Optional[str] = None
    worldId: Optional[str] = None
    advisor_id: Optional[str] = None
    advisorId: Optional[str] = None
    session_id: Optional[str] = None
    sessionId: Optional[str] = None
    title: str
    description: str
    justification: Optional[str] = ""
    expected_benefits: Optional[List[str]] = []
    expectedBenefits: Optional[List[str]] = []
    potential_risks: Optional[List[str]] = []
    potentialRisks: Optional[List[str]] = []
    estimated_cost_crc: Optional[float] = 0.0
    estimatedCostCrc: Optional[float] = 0.0
    political_capital_req: Optional[float] = 0.0
    politicalCapitalReq: Optional[float] = 0.0
    category: Optional[str] = "Policy"
    priority: Optional[str] = "medium"

    def get_world_id(self) -> str:
        return self.world_id or self.worldId or "aurora-prime"

    def get_advisor_id(self) -> str:
        return self.advisor_id or self.advisorId or ""

    def get_session_id(self) -> Optional[str]:
        return self.session_id or self.sessionId

    def get_benefits(self) -> List[str]:
        return self.expectedBenefits or self.expected_benefits or []

    def get_risks(self) -> List[str]:
        return self.potentialRisks or self.potential_risks or []

    def get_cost(self) -> float:
        return self.estimatedCostCrc or self.estimated_cost_crc or 0.0

    def get_capital(self) -> float:
        return self.politicalCapitalReq or self.political_capital_req or 0.0


class CouncilRecommendationReview(BaseModel):
    action: Optional[str] = None  # accept, reject, request_review
    status: Optional[str] = None  # Accepted, Rejected, Under Review
    review_note: Optional[str] = None
    notes: Optional[str] = None


class CouncilRecommendationResponse(BaseModel):
    id: str
    worldId: str
    world_id: str
    sessionId: Optional[str] = None
    session_id: Optional[str] = None
    advisorId: str
    advisor_id: str
    advisorName: str
    advisorTitle: str
    domain: str
    title: str
    description: str
    justification: str = ""
    expectedBenefits: List[str] = []
    expected_benefits: List[str] = []
    potentialRisks: List[str] = []
    potential_risks: List[str] = []
    estimatedCostCrc: Optional[float] = 0.0
    estimated_cost_crc: Optional[float] = 0.0
    politicalCapitalReq: Optional[float] = 0.0
    political_capital_req: Optional[float] = 0.0
    priority: str
    status: str
    category: str = "Policy"
    dateProposed: str
    proposed_at: str
    reviewedDate: Optional[str] = None
    reviewed_at: Optional[str] = None
    reviewedBy: Optional[str] = None
    reviewed_by: Optional[str] = None
    decisionNotes: Optional[str] = None
    decision_notes: Optional[str] = None
    implementationReference: Optional[str] = None
    implementation_reference: Optional[str] = None
    createdAt: str
    created_at: str
    updatedAt: str
    updated_at: str


class RecommendationHistoryEntry(BaseModel):
    timestamp: str
    action: str
    reviewer: Optional[str] = None
    notes: Optional[str] = None
    previous_status: Optional[str] = None
    new_status: str


# ---------------------------------------------------------------------------
# Decision Schemas
# ---------------------------------------------------------------------------

class CouncilDecisionCreate(BaseModel):
    recommendation_id: Optional[str] = None
    recommendationId: Optional[str] = None
    decision_type: Optional[str] = "ratification"
    decision_text: Optional[str] = None
    decree_summary: Optional[str] = None
    decreeSummary: Optional[str] = None
    outcome: str = "Ratified"  # Ratified, Vetoed, Referred to Committee
    metadata: Optional[Dict[str, Any]] = None

    def get_rec_id(self) -> Optional[str]:
        return self.recommendation_id or self.recommendationId

    def get_text(self) -> str:
        return self.decreeSummary or self.decree_summary or self.decision_text or "Sovereign decree executed."


class CouncilDecisionResponse(BaseModel):
    id: str
    sessionId: str
    session_id: str
    recommendationId: Optional[str] = None
    recommendation_id: Optional[str] = None
    recommendationTitle: Optional[str] = ""
    advisorId: Optional[str] = None
    advisor_id: Optional[str] = None
    advisorTitle: Optional[str] = ""
    outcome: str
    decreeSummary: str
    decision_text: str
    decisionType: str = "ratification"
    decision_type: str = "ratification"
    decidedBy: Optional[str] = None
    decided_by: Optional[str] = None
    timestamp: str
    decided_at: str
    metadata: Dict[str, Any] = {}


# ---------------------------------------------------------------------------
# Session Schemas
# ---------------------------------------------------------------------------

class CouncilSessionEventResponse(BaseModel):
    id: str
    sessionId: str
    session_id: str
    eventType: str
    event_type: str
    description: str
    actorId: Optional[str] = None
    actor_id: Optional[str] = None
    metadata: Dict[str, Any] = {}
    createdAt: str
    created_at: str


class CouncilSessionCreate(BaseModel):
    world_id: Optional[str] = None
    worldId: Optional[str] = None
    title: str = "Council Deliberation Session"
    sim_year: Optional[int] = 2026
    simYear: Optional[int] = 2026
    sim_day: Optional[int] = 1
    simDay: Optional[int] = 1
    agenda_topics: Optional[List[str]] = []
    agendaTopics: Optional[List[str]] = []
    invited_advisor_ids: Optional[List[str]] = []
    invitedAdvisorIds: Optional[List[str]] = []
    opening_address: Optional[str] = None
    openingAddress: Optional[str] = None

    def get_world_id(self) -> str:
        return self.world_id or self.worldId or "aurora-prime"

    def get_year(self) -> int:
        return self.simYear or self.sim_year or 2026

    def get_day(self) -> int:
        return self.simDay or self.sim_day or 1

    def get_topics(self) -> List[str]:
        return self.agendaTopics or self.agenda_topics or []

    def get_invited_advisors(self) -> List[str]:
        return self.invitedAdvisorIds or self.invited_advisor_ids or []

    def get_opening_address(self) -> Optional[str]:
        return self.openingAddress or self.opening_address


class CouncilSessionResponse(BaseModel):
    id: str
    worldId: str
    world_id: str
    sessionNumber: int = 1
    session_number: int = 1
    simYear: int = 2026
    sim_year: int = 2026
    simDay: int = 1
    sim_day: int = 1
    title: str
    status: str
    state: str  # Frontend state: Scheduled, In Progress, Concluded, Archived
    convenedBy: str
    convened_by: str
    agendaTopics: List[str] = []
    agenda_topics: List[str] = []
    attendees: List[str] = []
    briefingsDelivered: int = 0
    recommendationsDiscussed: List[CouncilRecommendationResponse] = []
    decisionsRecorded: List[CouncilDecisionResponse] = []
    events: List[CouncilSessionEventResponse] = []
    openingAddress: Optional[str] = None
    opening_address: Optional[str] = None
    summaryNotes: Optional[str] = None
    summary: Optional[str] = None
    startedAt: Optional[str] = None
    started_at: Optional[str] = None
    endedAt: Optional[str] = None
    ended_at: Optional[str] = None
    createdAt: str
    created_at: str
    updatedAt: str
    updated_at: str
