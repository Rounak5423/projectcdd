"""
CIVORA — Council Intelligence Recommendation Engine
Produces evidence-based policy and infrastructural directives traceable to analytical findings.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any


@dataclass
class IntelligenceRecommendation:
    """An official directive recommendation proposed by an advisor."""
    id: str
    advisor_id: str
    advisor_name: str
    advisor_title: str
    domain: str
    title: str
    description: str
    reason: str
    category: str  # Policy, Infrastructure, Fiscal, Ecological, Research, Civic
    priority: str  # Low, Medium, High, Urgent/Critical
    expected_benefits: List[str]
    potential_risks: List[str]
    suggested_actions: List[str]
    supporting_finding_ids: List[str] = field(default_factory=list)
    monitoring_indicators: List[str] = field(default_factory=list)
    estimated_cost_crc: float = 0.0
    political_capital_req: float = 0.0
    confidence: float = 0.88

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "advisor_id": self.advisor_id,
            "advisorId": self.advisor_id,
            "advisor_name": self.advisor_name,
            "advisorName": self.advisor_name,
            "advisor_title": self.advisor_title,
            "advisorTitle": self.advisor_title,
            "domain": self.domain,
            "title": self.title,
            "description": self.description,
            "reason": self.reason,
            "justification": self.reason,
            "category": self.category,
            "priority": self.priority,
            "expected_benefits": self.expected_benefits,
            "expectedBenefits": self.expected_benefits,
            "potential_risks": self.potential_risks,
            "potentialRisks": self.potential_risks,
            "suggested_actions": self.suggested_actions,
            "supporting_finding_ids": self.supporting_finding_ids,
            "monitoring_indicators": self.monitoring_indicators,
            "estimated_cost_crc": self.estimated_cost_crc,
            "estimatedCostCrc": self.estimated_cost_crc,
            "political_capital_req": self.political_capital_req,
            "politicalCapitalReq": self.political_capital_req,
            "confidence": self.confidence,
            "status": "Proposed",
        }
