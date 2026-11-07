"""
CIVORA — Council Intelligence Evidence and Findings System
Provides structured, evidence-based analytical observations for Council advisors.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any


@dataclass
class Evidence:
    """Individual data point or observation supporting an analytical finding."""
    metric_name: str
    observed_value: Any
    benchmark_or_threshold: Optional[Any] = None
    trend: str = "neutral"  # improving, deteriorating, stable, neutral
    interpretation: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "metric_name": self.metric_name,
            "observed_value": self.observed_value,
            "benchmark_or_threshold": self.benchmark_or_threshold,
            "trend": self.trend,
            "interpretation": self.interpretation,
        }


@dataclass
class Finding:
    """A verified domain finding backed by authoritative simulation evidence."""
    id: str
    advisor_id: str
    domain: str
    title: str
    description: str
    severity: str  # informational, low, moderate, high, critical
    related_metrics: List[str]
    observed_values: Dict[str, Any]
    supporting_evidence: List[Evidence] = field(default_factory=list)
    detected_epoch: str = "Epoch 1"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "advisor_id": self.advisor_id,
            "domain": self.domain,
            "title": self.title,
            "description": self.description,
            "severity": self.severity,
            "related_metrics": self.related_metrics,
            "observed_values": self.observed_values,
            "supporting_evidence": [e.to_dict() for e in self.supporting_evidence],
            "detected_epoch": self.detected_epoch,
        }
