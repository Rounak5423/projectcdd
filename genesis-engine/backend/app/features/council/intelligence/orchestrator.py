"""
CIVORA — Council Intelligence Central Orchestrator
Coordinates all six independent advisor engines over a shared, read-only simulation context.
Gathers findings, evaluates risks, detects cross-domain trade-offs, and persists recommendations.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
import uuid
import logging

from app.features.council.intelligence.context import build_civilisation_context, CivilisationContext
from app.features.council.intelligence.base import BaseAdvisor, AdvisorAnalysisResult
from app.features.council.intelligence.advisors import (
    ChancellorAdvisor,
    TreasurerAdvisor,
    GrandScholarAdvisor,
    RoyalArchitectAdvisor,
    HighPhysicianAdvisor,
    KeeperOfNatureAdvisor,
)
from app.features.council.intelligence.strategies.tradeoff_analysis import (
    AdvisorTradeoffConflict,
    detect_cross_domain_tradeoffs,
)
from app.features.council.repository import CouncilRepository

logger = logging.getLogger(__name__)


@dataclass
class UnifiedCouncilReport:
    """Consolidated deliberation report from all six Council advisors."""
    id: str
    world_id: str
    world_name: str
    simulation_tick: int
    year: int
    day: int
    generated_at: str
    overall_civilisation_status: str
    executive_summary: str
    advisor_reports: Dict[str, Any] = field(default_factory=dict)
    all_findings_count: int = 0
    all_risks_count: int = 0
    all_recommendations_count: int = 0
    cross_domain_tradeoffs: List[Dict[str, Any]] = field(default_factory=list)
    composite_confidence: float = 0.88
    data_completeness: float = 0.90
    failed_advisors: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "world_id": self.world_id,
            "worldId": self.world_id,
            "world_name": self.world_name,
            "simulation_tick": self.simulation_tick,
            "simulationTick": self.simulation_tick,
            "year": self.year,
            "day": self.day,
            "generated_at": self.generated_at,
            "overall_civilisation_status": self.overall_civilisation_status,
            "status": self.overall_civilisation_status,
            "executive_summary": self.executive_summary,
            "advisor_reports": self.advisor_reports,
            "all_findings_count": self.all_findings_count,
            "all_risks_count": self.all_risks_count,
            "all_recommendations_count": self.all_recommendations_count,
            "cross_domain_tradeoffs": self.cross_domain_tradeoffs,
            "composite_confidence": self.composite_confidence,
            "data_completeness": self.data_completeness,
            "failed_advisors": self.failed_advisors,
        }


class CouncilOrchestrator:
    """Central engine orchestrating the six advisor intelligence modules."""

    def __init__(self, repository: Optional[CouncilRepository] = None):
        self.repo = repository or CouncilRepository()
        self.advisors: List[BaseAdvisor] = [
            ChancellorAdvisor(),
            TreasurerAdvisor(),
            GrandScholarAdvisor(),
            RoyalArchitectAdvisor(),
            HighPhysicianAdvisor(),
            KeeperOfNatureAdvisor(),
        ]
        # In-memory cache for latest unified reports by world_id
        self._latest_reports: Dict[str, UnifiedCouncilReport] = {}

    def get_latest_report(self, world_id: str) -> Optional[UnifiedCouncilReport]:
        return self._latest_reports.get(world_id)

    def analyse_single_advisor(self, world_id: str, advisor_id: str) -> AdvisorAnalysisResult:
        """Executes analysis for a single advisor."""
        target_adv = next((a for a in self.advisors if a.advisor_id == advisor_id), None)
        if not target_adv:
            raise ValueError(f"Advisor identity '{advisor_id}' not found in Imperial Roster.")

        context = build_civilisation_context(world_id)
        return target_adv.analyse(context)

    def run_council_deliberation(
        self,
        world_id: str,
        persist_recommendations: bool = True
    ) -> UnifiedCouncilReport:
        """
        Executes full multi-domain Council deliberation across all six advisors:
        1. Obtains single consistent immutable CivilisationContext snapshot.
        2. Executes each advisor with failure isolation.
        3. Collects findings, risks, and recommendations.
        4. Detects genuine cross-domain policy conflicts.
        5. Persists new recommendations into Council database without duplicates.
        6. Returns unified structured report.
        """
        now = datetime.now(timezone.utc).isoformat()
        report_id = f"rpt_{uuid.uuid4().hex[:12]}"

        # 1. Build immutable shared snapshot
        context = build_civilisation_context(world_id)

        advisor_reports: Dict[str, AdvisorAnalysisResult] = {}
        failed_advisors: List[str] = []

        # 2. Execute each advisor independently
        for advisor in self.advisors:
            try:
                res = advisor.analyse(context)
                advisor_reports[advisor.advisor_id] = res
            except Exception as e:
                logger.error(f"Advisor '{advisor.advisor_id}' analysis failure: {e}", exc_info=True)
                failed_advisors.append(advisor.advisor_id)

        # 3. Detect cross-domain trade-offs and disagreements
        tradeoffs = detect_cross_domain_tradeoffs(context, advisor_reports)

        # 4. Aggregates
        total_findings = sum(len(r.findings) for r in advisor_reports.values())
        total_risks = sum(len(r.risks) for r in advisor_reports.values())
        all_recs = [rec for r in advisor_reports.values() for rec in r.recommendations]

        # 5. Determine overall civilisational status
        all_statuses = [r.overall_status for r in advisor_reports.values()]
        if "Critical" in all_statuses:
            overall_status = "Critical"
            exec_summary = "High Imperial Council reports critical civil distress requiring immediate sovereign intervention."
        elif "Attention Required" in all_statuses:
            overall_status = "Attention Required"
            exec_summary = "Imperial advisors highlight emerging systemic vulnerabilities across governance, ecology, or infrastructure."
        elif "Stable" in all_statuses:
            overall_status = "Stable"
            exec_summary = "Civilisational equilibria maintained across primary domains with steady progress."
        else:
            overall_status = "Optimal"
            exec_summary = "The empire flourishes under harmonious governance, robust reserves, and pristine biomes."

        # Composite metrics
        avg_confidence = round(
            sum(r.confidence for r in advisor_reports.values()) / max(len(advisor_reports), 1), 2
        )
        avg_completeness = round(
            sum(r.data_completeness for r in advisor_reports.values()) / max(len(advisor_reports), 1), 2
        )

        # 6. Optionally persist recommendations into Phase 2 Council database (without duplicates)
        if persist_recommendations and all_recs:
            existing_recs = self.repo.list_recommendations(world_id=world_id, limit=200)
            existing_titles = {r["title"].lower() for r in existing_recs}

            for rec in all_recs:
                if rec.title.lower() not in existing_titles:
                    try:
                        self.repo.create_recommendation({
                            "world_id": world_id,
                            "session_id": None,
                            "advisor_id": rec.advisor_id,
                            "title": rec.title,
                            "description": rec.description,
                            "justification": rec.reason,
                            "expected_benefits": rec.expected_benefits,
                            "potential_risks": rec.potential_risks,
                            "estimated_cost_crc": rec.estimated_cost_crc,
                            "political_capital_req": rec.political_capital_req,
                            "category": rec.category,
                            "priority": rec.priority.lower(),
                            "status": "proposed",
                        })
                        existing_titles.add(rec.title.lower())
                    except Exception as err:
                        logger.warning(f"Could not persist recommendation '{rec.title}': {err}")

        # 7. Construct unified report
        report = UnifiedCouncilReport(
            id=report_id,
            world_id=context.world_id,
            world_name=context.world_name,
            simulation_tick=context.tick,
            year=context.year,
            day=context.day,
            generated_at=now,
            overall_civilisation_status=overall_status,
            executive_summary=exec_summary,
            advisor_reports={k: v.to_dict() for k, v in advisor_reports.items()},
            all_findings_count=total_findings,
            all_risks_count=total_risks,
            all_recommendations_count=len(all_recs),
            cross_domain_tradeoffs=[t.to_dict() for t in tradeoffs],
            composite_confidence=avg_confidence,
            data_completeness=avg_completeness,
            failed_advisors=failed_advisors,
        )

        self._latest_reports[world_id] = report
        return report

