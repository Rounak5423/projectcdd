"""
CIVORA — Council Intelligence Risk Assessment Engine
Defines domain risk indicators without fabricating arbitrary statistical probabilities.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any


@dataclass
class Risk:
    """An emerging threat or systemic vulnerability identified by an advisor."""
    id: str
    advisor_id: str
    title: str
    description: str
    probability: str  # Low, Moderate, High, Imminent, or Unavailable
    potential_impact: str  # Minor, Moderate, Severe, Catastrophic
    severity: str  # Low, Moderate, High, Critical
    time_horizon: str  # Immediate (1-5 cycles), Mid-term (10-20 cycles), Long-term (50+ cycles)
    supporting_finding_ids: List[str] = field(default_factory=list)
    mitigation_strategy: str = ""
    confidence: float = 0.85

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "advisor_id": self.advisor_id,
            "title": self.title,
            "name": self.title,  # Frontend compatibility
            "description": self.description,
            "probability": self.probability,
            "potentialImpact": self.potential_impact,
            "potential_impact": self.potential_impact,
            "severity": self.severity,
            "time_horizon": self.time_horizon,
            "supporting_finding_ids": self.supporting_finding_ids,
            "mitigationStrategy": self.mitigation_strategy,
            "mitigation_strategy": self.mitigation_strategy,
            "confidence": self.confidence,
        }
