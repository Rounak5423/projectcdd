"""
CIVORA — Council Intelligence Engine Package
"""

from app.features.council.intelligence.context import (
    CivilisationContext,
    build_civilisation_context,
)
from app.features.council.intelligence.evidence import Finding, Evidence
from app.features.council.intelligence.risk_engine import Risk
from app.features.council.intelligence.recommendation_engine import IntelligenceRecommendation
from app.features.council.intelligence.confidence import calculate_domain_confidence
from app.features.council.intelligence.base import BaseAdvisor, AdvisorAnalysisResult
from app.features.council.intelligence.strategies.tradeoff_analysis import (
    AdvisorTradeoffConflict,
    detect_cross_domain_tradeoffs,
)
from app.features.council.intelligence.orchestrator import (
    CouncilOrchestrator,
    UnifiedCouncilReport,
)

__all__ = [
    "CivilisationContext",
    "build_civilisation_context",
    "Finding",
    "Evidence",
    "Risk",
    "IntelligenceRecommendation",
    "calculate_domain_confidence",
    "BaseAdvisor",
    "AdvisorAnalysisResult",
    "AdvisorTradeoffConflict",
    "detect_cross_domain_tradeoffs",
    "CouncilOrchestrator",
    "UnifiedCouncilReport",
]
